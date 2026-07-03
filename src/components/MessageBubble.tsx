import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Message, ProviderType } from "../lib/types";
import { useChatStore } from "../stores/chatStore";
import { Check, Copy, Cpu, Sparkles, User, Edit2, RotateCcw } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  provider: ProviderType;
  fontSize: number;
  isLast?: boolean;
}

export function MessageBubble({ message, provider, fontSize, isLast = false }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const chat = useChatStore();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    const activeConv = chat.getActiveConversation();
    if (!activeConv) return;
    await chat.regenerateResponse(null); // Settings base_url will be fetched inside store or from config
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    await chat.editAndResendMessage(message.id, editText.trim(), null);
  };

  return (
    <div
      className={`group flex gap-4 p-5 transition-all leading-relaxed ${
        isAssistant
          ? "bg-zinc-950/20 border-y border-zinc-900/50"
          : "bg-transparent"
      }`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
          isAssistant
            ? "bg-zinc-900 border-zinc-800 text-zinc-300"
            : "bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
        }`}
      >
        {isAssistant ? (
          provider === "openai" ? (
            <Sparkles className="w-4 h-4 text-emerald-500" />
          ) : provider === "anthropic" ? (
            <Cpu className="w-4 h-4 text-orange-500" />
          ) : (
            <Cpu className="w-4 h-4 text-indigo-500" />
          )
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 capitalize tracking-wide">
            {isAssistant ? `${provider} / ${message.model}` : "You"}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {/* Copy Button */}
            <button
              onClick={copyToClipboard}
              className="hover:text-zinc-300 text-zinc-500 p-1"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Edit Button (User only) */}
            {!isAssistant && !chat.isStreaming && (
              <button
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(true);
                }}
                className="hover:text-zinc-300 text-zinc-500 p-1"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Regenerate Button (Last Assistant message only) */}
            {isAssistant && isLast && !chat.isStreaming && (
              <button
                onClick={handleRegenerate}
                className="hover:text-zinc-300 text-zinc-500 p-1"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full min-h-[80px] bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 resize-y"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:bg-zinc-900 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg transition-all"
              >
                Save & Resend
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children, ...props }) => (
                  <pre className="relative group p-4 my-3 overflow-x-auto rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200" {...props}>
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-zinc-900/60 text-emerald-400 border border-zinc-800/80 px-1.5 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {isAssistant && message.tokensUsed && (
          <div className="text-[10px] text-zinc-600 font-mono tracking-wider pt-2">
            Tokens used: {message.tokensUsed}
          </div>
        )}
      </div>
    </div>
  );
}
