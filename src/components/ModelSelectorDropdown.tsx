import { useState, useRef, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { Cpu, Sparkles, Check, ChevronDown, AlertCircle } from "lucide-react";
import { ProviderType } from "../lib/types";

interface ModelSelectorDropdownProps {
  className?: string;
  align?: "left" | "right";
}

export function ModelSelectorDropdown({ className = "", align = "left" }: ModelSelectorDropdownProps) {
  const settings = useSettingsStore();
  const chat = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConv = chat.getActiveConversation();
  
  // Determine currently selected provider and model
  const selectedProvider = activeConv ? activeConv.provider : settings.activeProvider;
  const selectedModel = activeConv ? activeConv.model : settings.defaultModel || settings.providers[selectedProvider].defaultModel;

  // Group models by provider
  const providersList = [
    { id: "openai" as ProviderType, name: "OpenAI", icon: Sparkles, color: "text-emerald-500" },
    { id: "anthropic" as ProviderType, name: "Anthropic Claude", icon: Cpu, color: "text-orange-400" },
    { id: "openai_compatible" as ProviderType, name: "Ollama / Local LLM", icon: Cpu, color: "text-blue-400" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (provider: ProviderType, model: string) => {
    // If we have an active conversation, update its model & provider
    if (activeConv) {
      await chat.updateConversationModel(activeConv.id, provider, model);
    } else {
      // Otherwise, update settings defaults
      settings.setActiveProvider(provider);
      await settings.updateSettings({ defaultProvider: provider, defaultModel: model });
    }
    setIsOpen(false);
  };

  // Helper to get displayName of active selection
  const getSelectedDisplayName = () => {
    if (selectedProvider === "openai") return `GPT-4o (${selectedModel})`;
    if (selectedProvider === "anthropic") return `Claude (${selectedModel.split("/").pop()})`;
    return `Local (${selectedModel})`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-all select-none"
      >
        <span>{getSelectedDisplayName()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {providersList.map((p) => {
            const config = settings.providers[p.id];
            const hasKey = config.hasKey || p.id === "openai_compatible"; // Local model doesn't strictly require key check
            const models = settings.availableModels[p.id] || [];

            return (
              <div key={p.id} className="mb-2 last:mb-0">
                {/* Group Header */}
                <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900 mb-1 select-none">
                  <div className="flex items-center gap-1">
                    <p.icon className={`w-3 h-3 ${p.color}`} />
                    {p.name}
                  </div>
                  {!hasKey && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        settings.openSettings("providers");
                      }}
                      className="text-amber-500 hover:underline flex items-center gap-0.5 normal-case font-medium"
                    >
                      <AlertCircle className="w-2.5 h-2.5" />
                      Configure
                    </button>
                  )}
                </div>

                {/* Models List */}
                <div className="space-y-0.5">
                  {hasKey && models.length > 0 ? (
                    models.map((m) => {
                      const isModelSelected = selectedProvider === p.id && selectedModel === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleSelect(p.id, m.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-all ${
                            isModelSelected
                              ? "bg-zinc-900 text-zinc-50 font-medium"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                          }`}
                        >
                          <span className="truncate max-w-[200px]" title={m.name}>
                            {m.name}
                          </span>
                          {isModelSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </button>
                      );
                    })
                  ) : hasKey ? (
                    // Seeding default model if list hasn't loaded yet
                    <button
                      onClick={() => handleSelect(p.id, config.defaultModel)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-all ${
                        selectedProvider === p.id && selectedModel === config.defaultModel
                          ? "bg-zinc-900 text-zinc-50 font-medium"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                      }`}
                    >
                      <span className="truncate">{config.defaultModel} (Default)</span>
                      {selectedProvider === p.id && selectedModel === config.defaultModel && (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </button>
                  ) : (
                    <div className="px-2.5 py-1.5 text-xs text-zinc-600 italic select-none">
                      API Key not set
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
