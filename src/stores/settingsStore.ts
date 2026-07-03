import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { LazyStore } from "@tauri-apps/plugin-store";
import Database from "@tauri-apps/plugin-sql";
import { AppSettings, ModelInfo, ProviderType } from "../lib/types";
import {
  storeApiKey as tauriStoreApiKey,
  getApiKey as tauriGetApiKey,
  deleteApiKey as tauriDeleteApiKey,
  validateApiKey as tauriValidateApiKey,
  listModels as tauriListModels,
} from "../lib/tauri";

const store = new LazyStore("gokchat_settings.bin");

interface ProviderStatus {
  hasKey: boolean;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
}

interface SettingsStore {
  // --- App Settings State ---
  theme: "system" | "light" | "dark";
  fontSize: number;
  sendOnEnter: boolean;
  streamResponses: boolean;
  showTokenUsage: boolean;
  defaultProvider: ProviderType | null;
  defaultModel: string | null;
  defaultSystemPrompt: string | null;
  compactSidebar: boolean;
  confirmDelete: boolean;
  autoTitle: boolean;

  providers: Record<ProviderType, ProviderStatus>;
  activeProvider: ProviderType;
  availableModels: Record<ProviderType, ModelInfo[]>;

  isSettingsOpen: boolean;
  settingsTab: "general" | "providers" | "appearance";
  sidebarExpanded: boolean;

  // --- Actions ---
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setTheme: (theme: "system" | "light" | "dark") => void;
  setActiveProvider: (provider: ProviderType) => void;
  updateProviderConfig: (
    provider: ProviderType,
    config: Partial<Omit<ProviderStatus, "hasKey">>
  ) => Promise<void>;

  checkApiKey: (provider: ProviderType) => Promise<boolean>;
  storeApiKey: (provider: ProviderType, key: string) => Promise<void>;
  deleteApiKey: (provider: ProviderType) => Promise<void>;
  validateApiKey: (provider: ProviderType, key: string, baseUrl?: string) => Promise<boolean>;

  loadModels: (provider: ProviderType) => Promise<void>;

  openSettings: (tab?: "general" | "providers" | "appearance") => void;
  closeSettings: () => void;
  toggleSidebar: () => void;
}

const DEFAULT_SETTINGS = {
  theme: "system" as const,
  fontSize: 14,
  sendOnEnter: true,
  streamResponses: true,
  showTokenUsage: true,
  defaultProvider: "openai" as ProviderType,
  defaultModel: "gpt-4o",
  defaultSystemPrompt: "You are a helpful AI Assistant. When asked to create single-page applications, HTML prototypes, SVG designs, or interactive components, wrap the complete code inside a single <gok_artifact id=\"unique-id\" type=\"html\" title=\"Component Title\">...</gok_artifact> tag. Do not include markdown code block syntax around the tags themselves.",
  compactSidebar: false,
  confirmDelete: true,
  autoTitle: true,
};

const DEFAULT_PROVIDERS = {
  openai: {
    hasKey: false,
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
  },
  anthropic: {
    hasKey: false,
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-latest",
    temperature: 0.7,
    maxTokens: 4096,
  },
  openai_compatible: {
    hasKey: false,
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    temperature: 0.7,
    maxTokens: 4096,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  immer((set, get) => ({
    // Initial State
    ...DEFAULT_SETTINGS,
    providers: DEFAULT_PROVIDERS,
    activeProvider: "openai",
    availableModels: { openai: [], anthropic: [], openai_compatible: [] },
    isSettingsOpen: false,
    settingsTab: "general",
    sidebarExpanded: true,

    async loadSettings() {
      // 1. Load preferences from tauri store
      const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof typeof DEFAULT_SETTINGS>;
      const loadedPrefs: Partial<AppSettings> = {};
      
      for (const key of keys) {
        const val = await store.get<any>(key);
        if (val !== undefined && val !== null) {
          (loadedPrefs as any)[key] = val;
        } else {
          // Seed defaults if not present
          await store.set(key, DEFAULT_SETTINGS[key]);
          (loadedPrefs as any)[key] = DEFAULT_SETTINGS[key];
        }
      }
      await store.save();

      // 2. Load provider configurations from SQLite database
      const db = await Database.load("sqlite:gokchat.db");
      const dbConfigs = await db.select<any[]>("SELECT * FROM provider_configs");
      
      const providers = { ...DEFAULT_PROVIDERS };
      for (const row of dbConfigs) {
        const prov = row.provider as ProviderType;
        if (providers[prov]) {
          providers[prov].baseUrl = row.base_url;
          providers[prov].defaultModel = row.default_model;
          providers[prov].temperature = row.temperature;
          providers[prov].maxTokens = row.max_tokens;
        }
      }

      // 3. Verify API keys in keychain
      for (const provider of ["openai", "anthropic", "openai_compatible"] as ProviderType[]) {
        const hasKey = await tauriGetApiKey(provider);
        providers[provider].hasKey = hasKey;
      }

      // Apply to store state
      set((state) => {
        Object.assign(state, loadedPrefs);
        state.providers = providers;
        state.activeProvider = (loadedPrefs.defaultProvider as ProviderType) || "openai";
      });

      // Apply theme to HTML root
      const loadedTheme = (loadedPrefs.theme || DEFAULT_SETTINGS.theme) as "system" | "light" | "dark";
      get().setTheme(loadedTheme);

      // Try loading models for active provider
      const active = get().activeProvider;
      if (providers[active].hasKey || active === "openai_compatible") {
        get().loadModels(active).catch(() => {});
      }
    },

    async updateSettings(partial) {
      set((state) => {
        Object.assign(state, partial);
      });

      // Persist to store
      for (const [key, val] of Object.entries(partial)) {
        await store.set(key, val);
      }
      await store.save();
    },

    setTheme(theme) {
      get().updateSettings({ theme });
      
      // Update HTML class
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    },

    setActiveProvider(provider) {
      set({ activeProvider: provider });
      const hasKey = get().providers[provider].hasKey;
      if (hasKey || provider === "openai_compatible") {
        get().loadModels(provider).catch(() => {});
      }
    },

    async updateProviderConfig(provider, config) {
      const db = await Database.load("sqlite:gokchat.db");
      
      // Update SQLite configs
      if (config.baseUrl !== undefined) {
        await db.execute(
          "UPDATE provider_configs SET base_url = ?1 WHERE provider = ?2",
          [config.baseUrl, provider]
        );
      }
      if (config.defaultModel !== undefined) {
        await db.execute(
          "UPDATE provider_configs SET default_model = ?1 WHERE provider = ?2",
          [config.defaultModel, provider]
        );
      }
      if (config.temperature !== undefined) {
        await db.execute(
          "UPDATE provider_configs SET temperature = ?1 WHERE provider = ?2",
          [config.temperature, provider]
        );
      }
      if (config.maxTokens !== undefined) {
        await db.execute(
          "UPDATE provider_configs SET max_tokens = ?1 WHERE provider = ?2",
          [config.maxTokens, provider]
        );
      }

      set((state) => {
        Object.assign(state.providers[provider], config);
      });
    },

    async checkApiKey(provider) {
      const hasKey = await tauriGetApiKey(provider);
      set((state) => {
        state.providers[provider].hasKey = hasKey;
      });
      return hasKey;
    },

    async storeApiKey(provider, key) {
      await tauriStoreApiKey(provider, key);
      set((state) => {
        state.providers[provider].hasKey = true;
      });
      get().loadModels(provider).catch(() => {});
    },

    async deleteApiKey(provider) {
      await tauriDeleteApiKey(provider);
      set((state) => {
        state.providers[provider].hasKey = false;
        state.availableModels[provider] = [];
      });
    },

    async validateApiKey(provider, key, baseUrl) {
      // If openai_compatible, use the passed base_url or the currently saved one
      const url = baseUrl || get().providers[provider].baseUrl;
      return await tauriValidateApiKey(provider, key, url);
    },

    async loadModels(provider) {
      const pConfig = get().providers[provider];
      const models = await tauriListModels(provider, pConfig.baseUrl);
      set((state) => {
        state.availableModels[provider] = models;
      });
    },

    openSettings(tab = "general") {
      set({ isSettingsOpen: true, settingsTab: tab });
    },
    
    closeSettings() {
      set({ isSettingsOpen: false });
    },

    toggleSidebar() {
      set((state) => {
        state.sidebarExpanded = !state.sidebarExpanded;
      });
    },
  }))
);
