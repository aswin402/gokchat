import React, { useRef, useEffect, useState } from "react";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { MessageBubble } from "./MessageBubble";
import { HomeDashboard } from "./HomeDashboard";
import { ModelSelectorDropdown } from "./ModelSelectorDropdown";
import { Button } from "./ui/button";
import { Send, Square, Sparkles, AlertCircle, Plus, Mic, Volume2, X, FileCode } from "lucide-react";

export function ChatView() {
  const chat = useChatStore();
  const settings = useSettingsStore();
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; content: string; type: "text" | "image" }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = chat.getActiveConversation();
  const activeMessages = chat.getActiveMessages();

  // Scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, chat.streamingText, chat.isStreaming]);

  // Focus textarea when conversation changes
  useEffect(() => {
    if (activeConv) {
      textareaRef.current?.focus();
    }
  }, [chat.activeConversationId]);

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  if (!activeConv || (activeMessages.length === 0 && !chat.isStreaming)) {
    return <HomeDashboard />;
  }

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
    
    // Clear textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const pConfig = settings.providers[activeConv.provider];
    await chat.sendMessage(text, pConfig.baseUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && settings.sendOnEnter) {
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
      className="flex-1 flex flex-col h-full bg-zinc-950 premium-gradient-bg text-zinc-100 overflow-hidden relative"
    >
      {/* Top Navigation / Model Selector */}
      <div className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/80 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm truncate max-w-[200px]">
            {activeConv.title}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800">
            {activeConv.provider}
          </span>
        </div>

        {/* Model Dropdown */}
        <div className="flex items-center gap-2">
          <ModelSelectorDropdown align="right" />
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-950/20">
        <div className="max-w-3xl mx-auto py-4">
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-650 select-none">
              <Sparkles className="w-8 h-8 text-zinc-800 mb-2" />
              <p className="text-xs">Beginning of your conversation.</p>
            </div>
          ) : (
            activeMessages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                provider={activeConv.provider}
                fontSize={settings.fontSize}
                isLast={index === activeMessages.length - 1}
              />
            ))
          )}

          {/* Streaming Assistant Response */}
          {chat.isStreaming &&
            chat.streamingConversationId === activeConv.id &&
            chat.streamingText.length > 0 && (
              <MessageBubble
                message={{
                  id: "streaming",
                  conversationId: activeConv.id,
                  role: "assistant",
                  content: chat.streamingText,
                  model: activeConv.model,
                  createdAt: new Date().toISOString(),
                }}
                provider={activeConv.provider}
                fontSize={settings.fontSize}
              />
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Banner */}
      {chat.error && (
        <div className="bg-red-950/60 border-t border-red-900/50 px-6 py-2.5 flex items-center justify-between text-xs text-red-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{chat.error}</span>
          </div>
          <button
            onClick={() => chat.clearError()}
            className="text-red-400 hover:text-red-200 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Chat Input Form */}
      <div className="bg-transparent pb-6 pt-2 px-6 shrink-0">
        <div className="max-w-3xl mx-auto flex flex-col bg-zinc-900 border border-zinc-800/80 rounded-2xl px-3 py-2.5 shadow-2xl relative">
          
          {/* Render Attachments strip if any */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1 mb-2 border-b border-zinc-850/40 pb-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center gap-1.5 bg-zinc-950 border border-zinc-850 rounded-xl pl-2 pr-1.5 py-1 text-xs text-zinc-350"
                >
                  {file.type === "image" ? (
                    <img src={file.content} className="w-5 h-5 rounded-md object-cover" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-blue-505" />
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

          <div className="flex items-end gap-2 w-full">
            {/* Plus icon on left */}
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
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 cursor-pointer"
              title="Add attachment"
            >
              <Plus className="w-4.5 h-4.5" />
            </Button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chat.isStreaming
                  ? "Generation in progress..."
                  : `Message ${activeConv.model}...`
              }
              disabled={chat.isStreaming}
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-zinc-100 placeholder-zinc-500 resize-none max-h-48 py-1 focus:outline-none"
            />

            {/* Audio and Send controls on right */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
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

              {chat.isStreaming ? (
                <Button
                  size="sm"
                  onClick={() => chat.stopGeneration()}
                  className="bg-red-650 hover:bg-red-750 text-white rounded-xl p-2 shrink-0 animate-pulse cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-white" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={!inputValue.trim() && attachments.length === 0}
                  onClick={handleSend}
                  className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-zinc-100 rounded-xl p-2 transition-all shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center text-[10px] text-zinc-600 mt-2 tracking-wide font-medium select-none">
          GokChat can make mistakes. Verify important info.
        </div>
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
