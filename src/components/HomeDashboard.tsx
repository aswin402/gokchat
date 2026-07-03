import React, { useState, useRef, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { ModelSelectorDropdown } from "./ModelSelectorDropdown";
import { Plus, Mic, Volume2, PenTool, BookOpen, Code2, Coffee, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

export function HomeDashboard() {
  const settings = useSettingsStore();
  const chat = useChatStore();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const presets = [
    { label: "Write", icon: PenTool, prompt: "Help me write a concise article about " },
    { label: "Learn", icon: BookOpen, prompt: "Explain to me like I'm five: " },
    { label: "Code", icon: Code2, prompt: "Write a high-performance Rust function to " },
    { label: "Life stuff", icon: Coffee, prompt: "Give me some productivity tips on " },
    { label: "Claude's choice", icon: Sparkles, prompt: "Tell me an interesting historical riddle." },
  ];

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || chat.isStreaming) return;
    const text = inputValue.trim();
    setInputValue("");

    // Create a new conversation dynamically first, then send message in it!
    const defaultProv = settings.activeProvider;
    const defaultModel = settings.defaultModel || settings.providers[defaultProv].defaultModel;
    const defaultPrompt = settings.defaultSystemPrompt;

    await chat.createConversation(
      "New Chat",
      defaultProv,
      defaultModel,
      defaultPrompt
    );

    // Trigger sending the message inside the new conversation!
    const pConfig = settings.providers[defaultProv];
    // Wait: chat.sendMessage reads from activeConversationId, which is set inside createConversation!
    // So we just call chat.sendMessage directly after creation!
    await chat.sendMessage(text, pConfig.baseUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-300 relative select-none">
      {/* Greetings Title */}
      <h1 className="text-3xl font-serif tracking-tight text-zinc-100 flex items-center gap-2 mb-8 animate-fade-in">
        <span className="text-orange-400 text-4xl">✴</span>
        aswin returns!
      </h1>

      {/* Input Card Container */}
      <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-xl hover:border-zinc-850 transition-all flex flex-col gap-2 relative">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How can I help you today?"
          rows={1}
          className="w-full bg-transparent border-0 outline-0 resize-none text-zinc-100 placeholder-zinc-500 text-sm py-1.5 focus:ring-0 focus:outline-none min-h-[44px]"
        />

        {/* Bottom Control Row */}
        <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3 mt-2 shrink-0">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Add attachment"
            >
              <Plus className="w-4.5 h-4.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Model Selector */}
            <ModelSelectorDropdown align="right" />

            {/* Mic and audio waveforms */}
            <Button
              size="sm"
              variant="ghost"
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preset Pill Row */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-xl">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setInputValue(preset.prompt);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-850 transition-all cursor-pointer font-medium"
          >
            <preset.icon className="w-3.5 h-3.5" />
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
