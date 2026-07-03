import { useEffect } from "react";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { ChatView } from "./components/ChatView";
import { SettingsDialog } from "./components/SettingsDialog";
import { ArtifactView } from "./components/ArtifactView";
import { useChatStore } from "./stores/chatStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useArtifactStore } from "./stores/artifactStore";
import {
  listenToStreamChunk,
  listenToStreamError,
  listenToStreamDone,
} from "./lib/tauri";

function App() {
  const chat = useChatStore();
  const settings = useSettingsStore();
  const artifactStore = useArtifactStore();

  // Load stores on mount
  useEffect(() => {
    settings.loadSettings();
    chat.loadConversations();
  }, []);

  // Setup streaming event listeners
  useEffect(() => {
    let unlistenChunk: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;
    let unlistenDone: (() => void) | null = null;

    async function registerListeners() {
      unlistenChunk = await listenToStreamChunk((payload) => {
        chat.handleStreamChunk(payload);
      });
      unlistenError = await listenToStreamError((payload) => {
        chat.handleStreamError(payload);
      });
      unlistenDone = await listenToStreamDone((payload) => {
        chat.handleStreamDone(payload);
      });
    }

    registerListeners();

    return () => {
      if (unlistenChunk) unlistenChunk();
      if (unlistenError) unlistenError();
      if (unlistenDone) unlistenDone();
    };
  }, [chat]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl + N / Cmd + N -> New Conversation
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const defaultProv = settings.activeProvider;
        const defaultModel = settings.providers[defaultProv]?.defaultModel || "gpt-4o";
        const defaultPrompt = settings.defaultSystemPrompt;
        chat.createConversation(
          "New Chat",
          defaultProv,
          defaultModel,
          defaultPrompt
        );
      }

      // 2. Ctrl + , / Cmd + , -> Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        settings.openSettings("general");
      }

      // 3. Escape -> Close Settings
      if (e.key === "Escape" && settings.isSettingsOpen) {
        e.preventDefault();
        settings.closeSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [chat, settings]);

  // Sync and parse artifacts when messages or streaming text updates
  useEffect(() => {
    if (chat.activeConversationId) {
      const activeMsgs = chat.getActiveMessages();
      artifactStore.parseArtifactsFromMessages(
        chat.activeConversationId,
        activeMsgs,
        chat.streamingText
      );
    }
  }, [chat.activeConversationId, chat.messages, chat.streamingText]);

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans antialiased">
      {/* Sidebar */}
      <ConversationSidebar />

      {/* Main chat window */}
      <ChatView />

      {/* Artifact side panel */}
      {chat.activeConversationId && (
        <ArtifactView conversationId={chat.activeConversationId} />
      )}

      {/* Dialogs */}
      <SettingsDialog />
    </div>
  );
}

export default App;
