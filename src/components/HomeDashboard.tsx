import React, { useState, useRef, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { ModelSelectorDropdown } from "./ModelSelectorDropdown";
import { Plus, Mic, Volume2, PenTool, BookOpen, Code2, Coffee, Sparkles, X, FileCode } from "lucide-react";
import { Button } from "./ui/button";

export function HomeDashboard() {
  const settings = useSettingsStore();
  const chat = useChatStore();
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; content: string; type: "text" | "image" }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!inputValue.trim() && attachments.length === 0) return;
    if (chat.isStreaming) return;

    let text = inputValue.trim();
    
    // Append attachments to prompt content
    if (attachments.length > 0) {
      const textFiles = attachments.filter((a) => a.type === "text");
      if (textFiles.length > 0) {
        text += "\n\n### Attached Files:\n";
        textFiles.forEach((file) => {
          text += `\n**File: ${file.name}**\n\`\`\`\n${file.content}\n\`\`\`\n`;
        });
      }

      const imageFiles = attachments.filter((a) => a.type === "image");
      if (imageFiles.length > 0) {
        text += "\n\n### Attached Images:\n";
        imageFiles.forEach((img) => {
          text += `\n![Attached Image - ${img.name}](${img.content})\n`;
        });
      }
    }

    setInputValue("");
    setAttachments([]);

    const defaultProv = settings.activeProvider;
    const defaultModel = settings.defaultModel || settings.providers[defaultProv].defaultModel;
    const defaultPrompt = settings.defaultSystemPrompt;

    await chat.createConversation("New Chat", defaultProv, defaultModel, defaultPrompt);

    const pConfig = settings.providers[defaultProv];
    await chat.sendMessage(text, pConfig.baseUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Hidden File Dialog Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      parseFiles(e.target.files);
    }
  };

  const parseFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              content: event.target!.result as string,
              type: isImage ? "image" : "text",
            },
          ]);
        }
      };
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if leaving the window outer boundary
    if (e.clientX === 0 && e.clientY === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      parseFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-300 relative select-none"
    >
      {/* Greetings Title */}
      <h1 className="text-3xl font-serif tracking-tight text-zinc-100 flex items-center gap-2 mb-8 animate-fade-in">
        <span className="text-orange-400 text-4xl">✴</span>
        aswin returns!
      </h1>

      {/* Input Card Container */}
      <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-xl hover:border-zinc-850 transition-all flex flex-col gap-2 relative">
        {/* Render Attachments strip if any */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 mb-2 border-b border-zinc-850/40 pb-2.5">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="relative flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl pl-2 pr-1.5 py-1 text-xs text-zinc-350"
              >
                {file.type === "image" ? (
                  <img src={file.content} className="w-5 h-5 rounded-md object-cover" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span className="max-w-[120px] truncate text-[10px] font-bold">{file.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-0.5 hover:bg-zinc-850 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

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
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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
              <Mic className="w-4.5 h-4.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Volume2 className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preset starter cards */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 max-w-2xl">
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputValue(p.prompt);
              textareaRef.current?.focus();
            }}
            className="flex items-center gap-2 bg-zinc-900/30 border border-zinc-850 hover:bg-zinc-900/60 hover:border-zinc-800/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-sm select-none"
          >
            <p.icon className="w-4 h-4 text-zinc-500" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Fullscreen Drag Overlay */}
      {isDragging && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/85 border-4 border-dashed border-zinc-700/60 backdrop-blur-xs m-4 rounded-3xl"
        >
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-2xl text-center pointer-events-none">
            <Plus className="w-8 h-8 text-zinc-400 animate-bounce" />
            <span className="text-sm font-bold text-zinc-200">Drop your files or images</span>
            <span className="text-[10px] text-zinc-500 max-w-[200px]">
              Add text documents, scripts, logs, or image mockups directly to your prompt.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
