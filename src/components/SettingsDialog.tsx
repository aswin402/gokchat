import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { ProviderType } from "../lib/types";
import {
  Eye,
  EyeOff,
  Key,
  Palette,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Cpu,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Search,
  BookOpen,
  User,
  X
} from "lucide-react";

export function SettingsDialog() {
  const settings = useSettingsStore();
  const chat = useChatStore();
  const [activeTab, setActiveTab] = useState<"general" | "providers" | "instructions" | "appearance">("general");
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>("openai");
  
  // Input states
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  
  // User Profile States
  const [userName, setUserName] = useState("aswin");
  const [preferredName, setPreferredName] = useState("aswin");
  const [systemPrompt, setSystemPrompt] = useState("");

  const activeProvConfig = settings.providers[selectedProvider];

  // Sync state when provider changes
  useEffect(() => {
    setApiKey("");
    setValidationResult(null);
    if (activeProvConfig) {
      setBaseUrl(activeProvConfig.baseUrl);
    }
  }, [selectedProvider, activeProvConfig]);

  // Sync default system prompt when store loads
  useEffect(() => {
    if (settings.defaultSystemPrompt) {
      setSystemPrompt(settings.defaultSystemPrompt);
    }
  }, [settings.defaultSystemPrompt]);

  if (!settings.isSettingsOpen) return null;

  const handleSaveSystemPrompt = async () => {
    await settings.updateSettings({ defaultSystemPrompt: systemPrompt });
    alert("System instructions saved successfully!");
  };

  const handleSaveProviderConfig = async () => {
    await settings.updateProviderConfig(selectedProvider, {
      baseUrl,
    });
    alert("API Base URL saved successfully!");
  };

  const handleStoreKey = async () => {
    if (!apiKey.trim()) return;
    try {
      await settings.storeApiKey(selectedProvider, apiKey);
      setApiKey("");
      setValidationResult(null);
      alert("API Key saved successfully!");
    } catch (e: any) {
      alert(`Error saving API Key: ${e.message || e}`);
    }
  };

  const handleDeleteKey = async () => {
    if (confirm(`Are you sure you want to delete the API key for ${selectedProvider}?`)) {
      await settings.deleteApiKey(selectedProvider);
      setApiKey("");
      setValidationResult(null);
    }
  };

  const handleValidateKey = async () => {
    if (!apiKey.trim() && !activeProvConfig.hasKey) {
      alert("Please enter a key to validate.");
      return;
    }
    setValidating(true);
    setValidationResult(null);
    try {
      const keyToValidate = apiKey.trim() || "keyring"; 
      const isValid = await settings.validateApiKey(selectedProvider, keyToValidate, baseUrl);
      setValidationResult(isValid);
    } catch (e) {
      setValidationResult(false);
    } finally {
      setValidating(false);
    }
  };

  const providerDetails = {
    openai: { name: "OpenAI", desc: "Access official models like GPT-4o and GPT-4o-mini.", icon: Sparkles, color: "text-emerald-500" },
    anthropic: { name: "Anthropic Claude", desc: "Access official models like Claude 3.5 Sonnet and Opus.", icon: Cpu, color: "text-orange-400" },
    openai_compatible: { name: "Local / Compatible LLM", desc: "Connect local servers like Ollama, LM Studio, or Groq/OpenRouter.", icon: Terminal, color: "text-blue-400" },
  };

  return (
    <Dialog open={settings.isSettingsOpen} onOpenChange={(open) => !open && settings.closeSettings()}>
      <DialogContent showCloseButton={false} className="bg-zinc-950/98 backdrop-blur-xl text-zinc-100 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-0 sm:max-w-[820px] sm:w-[820px] sm:h-[560px] w-[calc(100%-2rem)] h-[560px] flex flex-col">
        {/* Screen Reader Required Dialog Title */}
        <DialogTitle className="sr-only">Settings dialog for custom preferences</DialogTitle>

        <div className="flex flex-1 h-full overflow-hidden">
          
          {/* Left Sidebar Section (Replicating Image 2) */}
          <div className="w-[220px] border-r border-zinc-900/80 bg-zinc-950/40 p-4 flex flex-col justify-between shrink-0 select-none">
            <div className="flex flex-col gap-4">
              {/* Search Bar at the top of settings sidebar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  disabled
                  className="w-full bg-zinc-900/50 border border-zinc-900 rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-400 placeholder-zinc-600 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Settings navigation links */}
              <div className="space-y-4">
                {/* Settings Group */}
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                    Settings
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setActiveTab("general")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                        activeTab === "general"
                          ? "bg-zinc-900 text-zinc-50 border border-zinc-850 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                      }`}
                    >
                      <User className="w-4 h-4 text-zinc-450" />
                      General
                    </button>
                    <button
                      onClick={() => setActiveTab("providers")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                        activeTab === "providers"
                          ? "bg-zinc-900 text-zinc-50 border border-zinc-850 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                      }`}
                    >
                      <Key className="w-4 h-4 text-zinc-450" />
                      Providers
                    </button>
                    <button
                      onClick={() => setActiveTab("instructions")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                        activeTab === "instructions"
                          ? "bg-zinc-900 text-zinc-50 border border-zinc-850 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-zinc-450" />
                      Instructions
                    </button>
                  </div>
                </div>

                {/* Customize Group */}
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                    Customize
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setActiveTab("appearance")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                        activeTab === "appearance"
                          ? "bg-zinc-900 text-zinc-50 border border-zinc-850 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                      }`}
                    >
                      <Palette className="w-4 h-4 text-zinc-450" />
                      Appearance
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Version */}
            <div className="px-2.5 text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
              GokChat v0.1.0
            </div>
          </div>

          {/* Right Content Area (Replicating Image 2 Content Panel) */}
          <div className="flex-1 overflow-y-auto bg-zinc-950/10 flex flex-col justify-between relative">
            {/* Close button in top-right */}
            <button
              onClick={() => settings.closeSettings()}
              className="absolute right-4 top-4 p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-450 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Tab content wrapper */}
            <div className="p-8 flex-1">
              
              {/* --- GENERAL TAB --- */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  {/* Tab Title */}
                  <div>
                    <h2 className="text-md font-bold text-zinc-150 select-none">General Profile</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage user details and application flow controls.</p>
                  </div>

                  {/* Profile Settings Section (Mimicking Image 2 Profile Layout) */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 border-b border-zinc-900 pb-5">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none">
                        Profile
                      </div>
                      
                      {/* Avatar Row */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-zinc-300 font-semibold select-none">Avatar</span>
                        <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-250 flex items-center justify-center font-bold text-xs border border-zinc-700 shadow-md">
                          A
                        </div>
                      </div>

                      {/* Full Name Row */}
                      <div className="flex justify-between items-center py-1 gap-6">
                        <span className="text-xs text-zinc-300 font-semibold select-none">Full name</span>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-zinc-900/60 border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-800 w-[240px]"
                        />
                      </div>

                      {/* Preferred Name Row */}
                      <div className="flex justify-between items-center py-1 gap-6">
                        <span className="text-xs text-zinc-300 font-semibold select-none">What should GokChat call you?</span>
                        <input
                          type="text"
                          value={preferredName}
                          onChange={(e) => setPreferredName(e.target.value)}
                          className="bg-zinc-900/60 border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-800 w-[240px]"
                        />
                      </div>
                    </div>

                    {/* Flow settings list */}
                    <div className="space-y-2.5 pt-2">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none mb-2">
                        Preferences & Deletions
                      </div>

                      <div className="flex items-center justify-between py-1.5">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-300">Send message on Enter</span>
                          <p className="text-[10px] text-zinc-550 mt-0.5">Press Enter to send, Shift+Enter for new line.</p>
                        </div>
                        <Switch
                          checked={settings.sendOnEnter}
                          onCheckedChange={(checked) => settings.updateSettings({ sendOnEnter: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between py-1.5">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-300">Stream responses</span>
                          <p className="text-[10px] text-zinc-550 mt-0.5">Display assistant tokens as they are generated.</p>
                        </div>
                        <Switch
                          checked={settings.streamResponses}
                          onCheckedChange={(checked) => settings.updateSettings({ streamResponses: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between py-1.5">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-300">Confirm chat deletions</span>
                          <p className="text-[10px] text-zinc-550 mt-0.5">Prompt before permanently removing conversations.</p>
                        </div>
                        <Switch
                          checked={settings.confirmDelete}
                          onCheckedChange={(checked) => settings.updateSettings({ confirmDelete: checked })}
                        />
                      </div>
                    </div>

                    {/* Backup & Portability */}
                    <div className="space-y-3 pt-4 border-t border-zinc-900/60 mt-4 select-none">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none">
                        Backup & Portability
                      </div>
                      <div className="flex items-center justify-between py-1.5 gap-4">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-300">Data Backups</span>
                          <p className="text-[10px] text-zinc-555 mt-0.5">Export all conversation history or import from a JSON backup file.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => chat.exportDbBackup()}
                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-xs px-3 font-semibold transition-all shrink-0 cursor-pointer"
                          >
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => chat.importDbBackup()}
                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-xs px-3 font-semibold transition-all shrink-0 cursor-pointer"
                          >
                            Import
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* --- PROVIDERS TAB --- */}
              {activeTab === "providers" && (
                <div className="space-y-5">
                  {/* Tab Title */}
                  <div>
                    <h2 className="text-md font-bold text-zinc-155 select-none">AI Providers</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Configure endpoints and secure API credentials.</p>
                  </div>

                  {/* Provider Selector Tabs */}
                  <div className="grid grid-cols-3 bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-full select-none">
                    {(["openai", "anthropic", "openai_compatible"] as ProviderType[]).map((prov) => {
                      const info = providerDetails[prov];
                      const active = selectedProvider === prov;
                      return (
                        <button
                          key={prov}
                          onClick={() => setSelectedProvider(prov)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                            active
                              ? "bg-zinc-900 text-zinc-50 border border-zinc-800/80 shadow-md"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <info.icon className={`w-3.5 h-3.5 ${info.color}`} />
                          {info.name.split(" ")[0]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Settings Card */}
                  <div className="bg-zinc-900/25 border border-zinc-850 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col select-none">
                      <span className="text-xs font-bold text-zinc-200">
                        {providerDetails[selectedProvider].name} Credentials
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        {providerDetails[selectedProvider].desc}
                      </span>
                    </div>

                    {/* API Base URL */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">Base API URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={baseUrl}
                          disabled={selectedProvider === "anthropic"}
                          onChange={(e) => setBaseUrl(e.target.value)}
                          placeholder="https://api.openai.com/v1"
                          className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed font-mono"
                        />
                        <Button
                          size="sm"
                          disabled={selectedProvider === "anthropic"}
                          onClick={handleSaveProviderConfig}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl text-xs px-3 font-semibold transition-all shrink-0"
                        >
                          Save URL
                        </Button>
                      </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">API Key</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={
                              activeProvConfig?.hasKey
                                ? "•••••••••••••••••••• (Saved in Secure Keyring)"
                                : "Enter API Key"
                            }
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-3 pr-10 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-2.5 text-zinc-450 hover:text-zinc-200 transition-colors"
                          >
                            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <Button
                          size="sm"
                          disabled={!apiKey.trim()}
                          onClick={handleStoreKey}
                          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs px-3 font-bold transition-all shrink-0"
                        >
                          Save Key
                        </Button>

                        {activeProvConfig?.hasKey && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteKey}
                            className="bg-red-950/60 border border-red-900 text-red-300 hover:bg-red-900 rounded-xl p-2 shrink-0 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Test Connection Row */}
                    <div className="flex items-center gap-3 pt-2.5 border-t border-zinc-850/60 select-none">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={validating || (!apiKey.trim() && !activeProvConfig?.hasKey)}
                        onClick={handleValidateKey}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-950 rounded-xl text-xs px-3 font-semibold transition-all"
                      >
                        {validating ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin mr-1.5 text-zinc-400" />
                            Testing...
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </Button>

                      {validationResult === true && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-950/30 border border-emerald-900 px-2 py-1 rounded-lg flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Connection Valid
                        </span>
                      )}

                      {validationResult === false && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-955/30 border border-red-900 px-2 py-1 rounded-lg flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Connection Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- INSTRUCTIONS TAB (System Prompts) --- */}
              {activeTab === "instructions" && (
                <div className="space-y-6">
                  {/* Tab Title */}
                  <div>
                    <h2 className="text-md font-bold text-zinc-150 select-none">Instructions</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Customize default system instructions across conversations.</p>
                  </div>

                  {/* System Prompt container card */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-zinc-350 font-semibold select-none">Instructions for GokChat</span>
                      <p className="text-[10px] text-zinc-550 leading-relaxed select-none">
                        GokChat will feed these instructions to the LLMs on every message completion to align their writing style, tone, and formatting constraints.
                      </p>
                    </div>

                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="e.g., Keep explanations brief and to the point. Answer questions directly without conversational fluff."
                      className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl p-4 text-xs text-zinc-100 focus:outline-none focus:border-zinc-800 min-h-[160px] max-h-[220px] resize-y font-mono leading-relaxed"
                    />

                    <div className="flex justify-end pt-2 select-none">
                      <Button
                        size="sm"
                        onClick={handleSaveSystemPrompt}
                        className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs px-4 font-bold transition-all shadow-md"
                      >
                        Save Instructions
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- APPEARANCE TAB --- */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  {/* Tab Title */}
                  <div>
                    <h2 className="text-md font-bold text-zinc-150 select-none">Appearance</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Customize window scale, themes, and details.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Theme switches row */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">Appearance</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "light", label: "Light", icon: Sun },
                          { id: "dark", label: "Dark", icon: Moon },
                          { id: "system", label: "System", icon: Monitor },
                        ].map((t) => {
                          const active = settings.theme === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => settings.setTheme(t.id as any)}
                              className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer select-none ${
                                active
                                  ? "bg-zinc-900 text-zinc-50 border-zinc-800 shadow-md"
                                  : "bg-zinc-900/20 text-zinc-400 border-zinc-850 hover:border-zinc-800 hover:text-zinc-200"
                              }`}
                            >
                              <t.icon className="w-4 h-4" />
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Font size sliders row */}
                    <div className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center select-none">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-zinc-200">Text scale</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5">Adjust chat viewport font size dynamically.</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-300 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-md">
                          {settings.fontSize}px
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-650 font-bold tracking-widest select-none">A</span>
                        <input
                          type="range"
                          min="12"
                          max="20"
                          step="1"
                          value={settings.fontSize}
                          onChange={(e) => settings.updateSettings({ fontSize: parseInt(e.target.value) })}
                          className="flex-1 accent-zinc-200 cursor-pointer h-1 bg-zinc-850 rounded-lg appearance-none"
                        />
                        <span className="text-sm text-zinc-400 font-bold select-none">A</span>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3 pt-2">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none mb-1">
                        Layout Options
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-300">Show Token Usage statistics</span>
                          <p className="text-[10px] text-zinc-550 mt-0.5">Show detailed speed rate and generation usage metrics.</p>
                        </div>
                        <Switch
                          checked={settings.showTokenUsage}
                          onCheckedChange={(checked) => settings.updateSettings({ showTokenUsage: checked })}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
