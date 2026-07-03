import { useState } from "react";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Plus,
  Search,
  Settings as SettingsIcon,
  Trash2,
  Edit2,
  Download,
  MoreVertical,
  Pin,
  Sparkles,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  FolderClosed,
  Code2,
  LayoutGrid,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

export function ConversationSidebar() {
  const chat = useChatStore();
  const settings = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = chat.getSortedConversations().filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNewChat = async () => {
    const defaultProv = settings.activeProvider;
    const defaultModel = settings.defaultModel || settings.providers[defaultProv].defaultModel;
    const defaultPrompt = settings.defaultSystemPrompt;

    await chat.createConversation(
      "New Chat",
      defaultProv,
      defaultModel,
      defaultPrompt
    );
  };

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename Conversation:", currentTitle);
    if (newTitle && newTitle.trim()) {
      await chat.renameConversation(id, newTitle.trim());
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = settings.confirmDelete
      ? confirm("Are you sure you want to delete this chat?")
      : true;

    if (shouldDelete) {
      await chat.deleteConversation(id);
    }
  };

  const handleExport = async (id: string, format: "markdown" | "json") => {
    const data = await chat.exportConversation(id, format);
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat_export_${id}.${format === "json" ? "json" : "md"}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Render Collapsed Sidebar (Image 2)
  if (!settings.sidebarExpanded) {
    return (
      <div className="w-16 border-r border-zinc-900 bg-zinc-950 flex flex-col h-full shrink-0 text-zinc-100 items-center py-4 justify-between transition-all duration-300">
        {/* Top icons */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Toggle sidebar button */}
          <button
            onClick={() => settings.toggleSidebar()}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>

          {/* New Chat icon */}
          <button
            onClick={handleCreateNewChat}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-100 transition-colors shadow-lg"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Navigation icons mimicking Image 2 */}
          <div className="flex flex-col gap-4 w-full px-2 mt-2">
            <button
              onClick={() => chat.setActiveConversation(null)}
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-450 hover:text-zinc-200 transition-colors flex items-center justify-center"
              title="Home Dashboard"
            >
              <MessageSquare className="w-4.5 h-4.5" />
            </button>
            <button
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-400 transition-colors flex items-center justify-center"
              title="Projects"
            >
              <FolderClosed className="w-4.5 h-4.5" />
            </button>
            <button
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-400 transition-colors flex items-center justify-center"
              title="Artifacts"
            >
              <Sparkles className="w-4.5 h-4.5" />
            </button>
            <button
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-400 transition-colors flex items-center justify-center"
              title="Code"
            >
              <Code2 className="w-4.5 h-4.5" />
            </button>
            <button
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-400 transition-colors flex items-center justify-center"
              title="Customize"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Bottom items */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Settings gear trigger */}
          <button
            onClick={() => settings.openSettings("general")}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Open Settings"
          >
            <SettingsIcon className="w-4.5 h-4.5" />
          </button>

          {/* Profile Circle Avatar ("A" for Aswin) */}
          <div className="relative">
            <div
              onClick={() => settings.openSettings("general")}
              className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center font-bold text-sm cursor-pointer border border-zinc-700 shadow-md hover:bg-zinc-700 transition-all select-none"
            >
              A
            </div>
            {/* Green Online Dot */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
          </div>
        </div>
      </div>
    );
  }

  // Render Expanded Sidebar (Image 3)
  return (
    <div className="w-80 border-r border-zinc-900 bg-zinc-950 flex flex-col h-full shrink-0 text-zinc-100 transition-all duration-300">
      {/* Top Header Row */}
      <div className="p-4 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-md tracking-tight select-none">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-black">
              G
            </div>
            GokChat
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => settings.toggleSidebar()}
              className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              onClick={handleCreateNewChat}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Nav List Shortcuts */}
      <div className="px-2 mb-2 flex flex-col gap-0.5 shrink-0 select-none">
        <button
          onClick={() => chat.setActiveConversation(null)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 text-left transition-all"
        >
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          Chats
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/40 text-left transition-all">
          <FolderClosed className="w-4 h-4 text-zinc-650" />
          Projects
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/40 text-left transition-all">
          <Sparkles className="w-4 h-4 text-zinc-655" />
          Artifacts
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/40 text-left transition-all">
          <Code2 className="w-4 h-4 text-zinc-655" />
          Code
        </button>
      </div>

      {/* Recents list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">
          Recents
        </div>
        
        {filteredConversations.length === 0 ? (
          <div className="text-xs text-zinc-600 text-center py-4 select-none italic">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = chat.activeConversationId === conv.id;
            const isPinned = conv.pinned;

            return (
              <div
                key={conv.id}
                onClick={() => chat.setActiveConversation(conv.id)}
                className={`group relative flex items-center gap-2.5 py-2.5 pr-3 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? "bg-zinc-900 text-zinc-100 glow-border-active pl-2.5"
                    : "hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 pl-3"
                }`}
              >
                {/* Icon based on provider */}
                <div className="shrink-0">
                  {conv.provider === "openai" ? (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Cpu className="w-3.5 h-3.5 text-orange-400" />
                  )}
                </div>

                {/* Text Title */}
                <div className="flex-1 min-w-0 text-xs font-medium truncate">
                  {conv.title}
                </div>

                {/* Pin indicator */}
                {isPinned && <Pin className="w-3 h-3 text-zinc-500 fill-zinc-500 shrink-0" />}

                {/* Action Dropdown */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-zinc-900 border-zinc-800 text-zinc-200"
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          chat.togglePinConversation(conv.id).catch(() => {});
                        }}
                        className="gap-2 focus:bg-zinc-800 focus:text-zinc-50"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conv.id, conv.title);
                        }}
                        className="gap-2 focus:bg-zinc-800 focus:text-zinc-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(conv.id, "markdown");
                        }}
                        className="gap-2 focus:bg-zinc-800 focus:text-zinc-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(conv.id, "json");
                        }}
                        className="gap-2 focus:bg-zinc-800 focus:text-zinc-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv.id);
                        }}
                        className="gap-2 text-red-400 focus:bg-red-950 focus:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Profile Footer mimicking Image 3 */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950/70 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div
              onClick={() => settings.openSettings("general")}
              className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center font-bold text-sm cursor-pointer border border-zinc-700 shadow-md hover:bg-zinc-700 transition-all select-none"
            >
              A
            </div>
            {/* Green Online Dot */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-200 truncate">aswin</span>
            <span className="text-[10px] text-zinc-500 truncate">Free plan</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Key status */}
          <div className="flex items-center">
            {settings.providers[settings.activeProvider]?.hasKey ||
            settings.activeProvider === "openai_compatible" ? (
              <span title="Key available" className="p-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </span>
            ) : (
              <span title="Key required" className="p-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </span>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => settings.openSettings("general")}
            className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Open Settings"
          >
            <SettingsIcon className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
