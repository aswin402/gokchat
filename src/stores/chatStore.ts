import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Database from "@tauri-apps/plugin-sql";
import { Conversation, Message, ProviderType, ChatMessage } from "../lib/types";
import { sendChatMessage, stopGeneration as tauriStopGeneration } from "../lib/tauri";

interface ChatStore {
  // --- State ---
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // keyed by conversationId
  isStreaming: boolean;
  streamingText: string;
  streamingConversationId: string | null;
  error: string | null;

  // --- Selectors ---
  getActiveConversation: () => Conversation | null;
  getActiveMessages: () => Message[];
  getSortedConversations: () => Conversation[];

  // --- Actions ---
  loadConversations: () => Promise<void>;
  createConversation: (
    title: string,
    provider: ProviderType,
    model: string,
    systemPrompt?: string | null
  ) => Promise<Conversation>;
  setActiveConversation: (id: string | null) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, baseUrl?: string | null) => Promise<void>;
  stopGeneration: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  updateConversationModel: (id: string, provider: ProviderType, model: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  exportConversation: (id: string, format: "markdown" | "json") => Promise<string>;
  regenerateResponse: (baseUrl?: string | null) => Promise<void>;
  editAndResendMessage: (messageId: string, newContent: string, baseUrl?: string | null) => Promise<void>;

  // --- Stream Event Handlers ---
  handleStreamChunk: (payload: { conversationId: string; text: string; index: number }) => void;
  handleStreamError: (payload: {
    conversationId: string;
    errorMessage: string;
    errorCode: string;
  }) => void;
  handleStreamDone: (payload: {
    conversationId: string;
    fullText: string;
    usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  }) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

async function getDb() {
  return await Database.load("sqlite:gokchat.db");
}

export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    // Initial State
    conversations: [],
    activeConversationId: null,
    messages: {},
    isStreaming: false,
    streamingText: "",
    streamingConversationId: null,
    error: null,

    // Selectors
    getActiveConversation() {
      const { conversations, activeConversationId } = get();
      return conversations.find((c) => c.id === activeConversationId) ?? null;
    },

    getActiveMessages() {
      const { messages, activeConversationId } = get();
      if (!activeConversationId) return [];
      return messages[activeConversationId] ?? [];
    },

    getSortedConversations() {
      const { conversations } = get();
      return [...conversations].sort((a, b) => {
        // Map true/false or 1/0
        const aPinned = a.pinned ? 1 : 0;
        const bPinned = b.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    },

    async loadConversations() {
      try {
        const db = await getDb();
        const rows = await db.select<any[]>(
          "SELECT id, title, provider, model, system_prompt as systemPrompt, created_at as createdAt, updated_at as updatedAt, pinned, archived FROM conversations ORDER BY pinned DESC, updated_at DESC"
        );
        const conversations: Conversation[] = rows.map((r) => ({
          id: r.id,
          title: r.title,
          provider: r.provider as ProviderType,
          model: r.model,
          systemPrompt: r.systemPrompt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          pinned: r.pinned === 1,
          archived: r.archived === 1,
        }));
        set({ conversations });
      } catch (err: any) {
        set({ error: `Failed to load conversations: ${err.message || err}` });
      }
    },

    async createConversation(title, provider, model, systemPrompt = null) {
      const db = await getDb();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO conversations (id, title, provider, model, system_prompt, created_at, updated_at, pinned, archived)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, 0)`,
        [id, title, provider, model, systemPrompt, now, now]
      );

      const conversation: Conversation = {
        id,
        title,
        provider,
        model,
        systemPrompt,
        createdAt: now,
        updatedAt: now,
        pinned: false,
        archived: false,
      };

      set((state) => {
        state.conversations.unshift(conversation);
        state.activeConversationId = id;
        state.messages[id] = [];
      });

      return conversation;
    },

    setActiveConversation(id) {
      set({ activeConversationId: id });
      if (id) {
        get().loadMessages(id).catch(() => {});
      }
    },

    async loadMessages(conversationId) {
      try {
        const db = await getDb();
        const rows = await db.select<any[]>(
          "SELECT id, conversation_id as conversationId, role, content, tokens_used as tokensUsed, model, created_at as createdAt FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC",
          [conversationId]
        );
        const msgs: Message[] = rows.map((r) => ({
          id: r.id,
          conversationId: r.conversationId,
          role: r.role,
          content: r.content,
          tokensUsed: r.tokensUsed,
          model: r.model,
          createdAt: r.createdAt,
        }));

        set((state) => {
          state.messages[conversationId] = msgs;
        });
      } catch (err: any) {
        set({ error: `Failed to load messages: ${err.message || err}` });
      }
    },

    async sendMessage(content, baseUrl = null) {
      const activeConversation = get().getActiveConversation();
      const activeMessages = get().getActiveMessages();
      if (!activeConversation) return;

      const db = await getDb();
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 1. Optimistically add user message to state
      const userMessage: Message = {
        id: messageId,
        conversationId: activeConversation.id,
        role: "user",
        content,
        model: activeConversation.model,
        createdAt: now,
      };

      set((state) => {
        const convMessages = state.messages[activeConversation.id] ?? [];
        convMessages.push(userMessage);
        state.messages[activeConversation.id] = convMessages;
        state.isStreaming = true;
        state.streamingText = "";
        state.streamingConversationId = activeConversation.id;
      });

      // 2. Save user message to database
      await db.execute(
        `INSERT INTO messages (id, conversation_id, role, content, model, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        [
          messageId,
          activeConversation.id,
          "user",
          content,
          activeConversation.model,
          now,
        ]
      );

      // 3. Build full history for LLM
      const history: ChatMessage[] = [];
      
      // Add system prompt if configured
      if (activeConversation.systemPrompt) {
        history.push({
          role: "system",
          content: activeConversation.systemPrompt,
        });
      }

      // Add actual messages
      for (const msg of activeMessages) {
        history.push({
          role: msg.role,
          content: msg.content,
        });
      }
      // Add current user message
      history.push({
        role: "user",
        content,
      });

      // 4. Trigger streaming invoke in background
      try {
        await sendChatMessage({
          messages: history,
          provider: activeConversation.provider,
          model: activeConversation.model,
          conversationId: activeConversation.id,
          systemPrompt: null, // Already embedded in messages history
          temperature: null,  // Use default
          maxTokens: null,     // Use default
          baseUrl,
        });
      } catch (err: any) {
        set({
          isStreaming: false,
          streamingConversationId: null,
          error: `API Invoke error: ${err.message || err}`,
        });
      }
    },

    async stopGeneration() {
      const { streamingConversationId } = get();
      if (streamingConversationId) {
        await tauriStopGeneration(streamingConversationId);
        set({ isStreaming: false, streamingConversationId: null });
      }
    },

    handleStreamChunk(payload) {
      if (payload.conversationId !== get().streamingConversationId) return;
      set((state) => {
        state.streamingText += payload.text;
      });
    },

    handleStreamError(payload) {
      if (payload.conversationId !== get().streamingConversationId) return;
      set({
        isStreaming: false,
        streamingConversationId: null,
        error: payload.errorMessage,
      });
    },

    async handleStreamDone(payload) {
      if (payload.conversationId !== get().streamingConversationId) return;

      const activeConversation = get().getActiveConversation();
      if (!activeConversation) return;

      const db = await getDb();
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 1. Save assistant message to database
      await db.execute(
        `INSERT INTO messages (id, conversation_id, role, content, tokens_used, model, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        [
          messageId,
          payload.conversationId,
          "assistant",
          payload.fullText,
          payload.usage.totalTokens || null,
          activeConversation.model,
          now,
        ]
      );

      // 2. Update conversation updated_at
      await db.execute(
        "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
        [now, payload.conversationId]
      );

      // 3. Update store state
      const assistantMessage: Message = {
        id: messageId,
        conversationId: payload.conversationId,
        role: "assistant",
        content: payload.fullText,
        tokensUsed: payload.usage.totalTokens,
        model: activeConversation.model,
        createdAt: now,
      };

      set((state) => {
        const convMessages = state.messages[payload.conversationId] ?? [];
        convMessages.push(assistantMessage);
        state.messages[payload.conversationId] = convMessages;
        state.isStreaming = false;
        state.streamingText = "";
        state.streamingConversationId = null;
        
        // Update conversation in local list
        const conv = state.conversations.find((c) => c.id === payload.conversationId);
        if (conv) {
          conv.updatedAt = now;
        }
      });

      // 4. Trigger auto-titling if conversation title is default 'New Chat'
      if (activeConversation.title === "New Chat" && payload.fullText.trim().length > 0) {
        // Simple client side auto-title for MVP: use first 25 characters of user message
        const userMsg = get().getActiveMessages().find(m => m.role === 'user');
        if (userMsg) {
          const generatedTitle = userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? "..." : "");
          await get().renameConversation(payload.conversationId, generatedTitle);
        }
      }
    },

    async deleteConversation(id) {
      try {
        const db = await getDb();
        await db.execute("DELETE FROM conversations WHERE id = ?1", [id]);
        
        set((state) => {
          state.conversations = state.conversations.filter((c) => c.id !== id);
          delete state.messages[id];
          if (state.activeConversationId === id) {
            state.activeConversationId = state.conversations[0]?.id ?? null;
          }
        });
      } catch (err: any) {
        set({ error: `Failed to delete conversation: ${err.message || err}` });
      }
    },

    async renameConversation(id, title) {
      try {
        const db = await getDb();
        await db.execute("UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3", [
          title,
          new Date().toISOString(),
          id,
        ]);
        
        set((state) => {
          const conv = state.conversations.find((c) => c.id === id);
          if (conv) {
            conv.title = title;
            conv.updatedAt = new Date().toISOString();
          }
        });
      } catch (err: any) {
        set({ error: `Failed to rename conversation: ${err.message || err}` });
      }
    },

    async updateConversationModel(id, provider, model) {
      try {
        const db = await getDb();
        await db.execute("UPDATE conversations SET provider = ?1, model = ?2, updated_at = ?3 WHERE id = ?4", [
          provider,
          model,
          new Date().toISOString(),
          id,
        ]);
        
        set((state) => {
          const conv = state.conversations.find((c) => c.id === id);
          if (conv) {
            conv.provider = provider;
            conv.model = model;
            conv.updatedAt = new Date().toISOString();
          }
        });
      } catch (err: any) {
        set({ error: `Failed to update conversation model: ${err.message || err}` });
      }
    },

    async togglePinConversation(id) {
      try {
        const db = await getDb();
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;
        
        const newPinned = !conv.pinned;
        await db.execute("UPDATE conversations SET pinned = ?1, updated_at = ?2 WHERE id = ?3", [
          newPinned ? 1 : 0,
          new Date().toISOString(),
          id,
        ]);
        
        set((state) => {
          const c = state.conversations.find((x) => x.id === id);
          if (c) {
            c.pinned = newPinned;
            c.updatedAt = new Date().toISOString();
          }
        });
      } catch (err: any) {
        set({ error: `Failed to toggle pin conversation: ${err.message || err}` });
      }
    },

    async exportConversation(id, format) {
      const db = await getDb();
      const rows = await db.select<any[]>(
        "SELECT role, content FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC",
        [id]
      );
      
      if (format === "json") {
        return JSON.stringify(rows, null, 2);
      } else {
        // Format as Markdown
        let markdown = "";
        for (const r of rows) {
          const roleLabel = r.role === "user" ? "### User" : r.role === "system" ? "### System" : "### Assistant";
          markdown += `${roleLabel}\n\n${r.content}\n\n---\n\n`;
        }
        return markdown;
      }
    },

    async regenerateResponse(baseUrl = null) {
      const activeConversation = get().getActiveConversation();
      if (!activeConversation) return;

      const activeMessages = get().getActiveMessages();
      if (activeMessages.length === 0) return;

      const lastMsg = activeMessages[activeMessages.length - 1];
      if (lastMsg.role === "assistant") {
        const db = await getDb();
        await db.execute("DELETE FROM messages WHERE id = ?1", [lastMsg.id]);

        set((state) => {
          const convMessages = state.messages[activeConversation.id] ?? [];
          convMessages.pop();
          state.messages[activeConversation.id] = convMessages;
          state.isStreaming = true;
          state.streamingText = "";
          state.streamingConversationId = activeConversation.id;
        });
      } else {
        set((state) => {
          state.isStreaming = true;
          state.streamingText = "";
          state.streamingConversationId = activeConversation.id;
        });
      }

      const updatedMessages = get().getActiveMessages();
      const history: ChatMessage[] = [];
      if (activeConversation.systemPrompt) {
        history.push({
          role: "system",
          content: activeConversation.systemPrompt,
        });
      }
      for (const msg of updatedMessages) {
        history.push({
          role: msg.role,
          content: msg.content,
        });
      }

      try {
        await sendChatMessage({
          messages: history,
          provider: activeConversation.provider,
          model: activeConversation.model,
          conversationId: activeConversation.id,
          systemPrompt: null,
          temperature: null,
          maxTokens: null,
          baseUrl,
        });
      } catch (err: any) {
        set({
          isStreaming: false,
          streamingConversationId: null,
          error: `API Invoke error: ${err.message || err}`,
        });
      }
    },

    async editAndResendMessage(messageId, newContent, baseUrl = null) {
      const activeConversation = get().getActiveConversation();
      if (!activeConversation) return;

      const activeMessages = get().getActiveMessages();
      const msgIndex = activeMessages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      const db = await getDb();
      const idsToDelete = activeMessages.slice(msgIndex + 1).map((m) => m.id);
      for (const id of idsToDelete) {
        await db.execute("DELETE FROM messages WHERE id = ?1", [id]);
      }

      await db.execute("UPDATE messages SET content = ?1 WHERE id = ?2", [newContent, messageId]);

      set((state) => {
        const convMessages = state.messages[activeConversation.id] ?? [];
        const truncated = convMessages.slice(0, msgIndex + 1);
        if (truncated[msgIndex]) {
          truncated[msgIndex].content = newContent;
        }
        state.messages[activeConversation.id] = truncated;
        state.isStreaming = true;
        state.streamingText = "";
        state.streamingConversationId = activeConversation.id;
      });

      const updatedMessages = get().getActiveMessages();
      const history: ChatMessage[] = [];
      if (activeConversation.systemPrompt) {
        history.push({
          role: "system",
          content: activeConversation.systemPrompt,
        });
      }
      for (const msg of updatedMessages) {
        history.push({
          role: msg.role,
          content: msg.content,
        });
      }

      try {
        await sendChatMessage({
          messages: history,
          provider: activeConversation.provider,
          model: activeConversation.model,
          conversationId: activeConversation.id,
          systemPrompt: null,
          temperature: null,
          maxTokens: null,
          baseUrl,
        });
      } catch (err: any) {
        set({
          isStreaming: false,
          streamingConversationId: null,
          error: `API Invoke error: ${err.message || err}`,
        });
      }
    },

    clearError() {
      set({ error: null });
    },
    
    reset() {
      set({
        conversations: [],
        activeConversationId: null,
        messages: {},
        isStreaming: false,
        streamingText: "",
        streamingConversationId: null,
        error: null,
      });
    },
  }))
);
