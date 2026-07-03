import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  isComplete: boolean;
}

interface ArtifactStore {
  // --- State ---
  activeArtifactId: string | null;
  artifacts: Record<string, Artifact[]>; // Keyed by conversationId
  isPanelOpen: boolean;

  // --- Actions ---
  parseArtifactsFromMessages: (conversationId: string, messages: Array<{ role: string; content: string }>, streamingText?: string) => void;
  setActiveArtifact: (id: string | null) => void;
  togglePanel: (open?: boolean) => void;
  reset: () => void;
}

export const useArtifactStore = create<ArtifactStore>()(
  immer((set) => ({
    activeArtifactId: null,
    artifacts: {},
    isPanelOpen: false,

    parseArtifactsFromMessages(conversationId, messages, streamingText = "") {
      const allText = messages
        .filter((m) => m.role === "assistant")
        .map((m) => m.content)
        .join("\n") + "\n" + streamingText;

      // Regex to extract <gok_artifact> tags
      // Supports partial content while streaming
      const regex = /<gok_artifact\s+id="([^"]+)"\s+type="([^"]+)"\s+title="([^"]+)"\s*>([\s\S]*?)(<\/gok_artifact>|$)/g;
      
      const parsed: Artifact[] = [];
      let match;

      while ((match = regex.exec(allText)) !== null) {
        const id = match[1];
        const type = match[2];
        const title = match[3];
        const content = match[4];
        const isComplete = match[5] === "</gok_artifact>";

        // Avoid adding duplicates (keep latest version if id is identical)
        const existingIdx = parsed.findIndex((a) => a.id === id);
        if (existingIdx !== -1) {
          parsed[existingIdx] = { id, type, title, content, isComplete };
        } else {
          parsed.push({ id, type, title, content, isComplete });
        }
      }

      set((state) => {
        state.artifacts[conversationId] = parsed;
        
        // If there's an active artifact but it's no longer in the list, clear it
        if (state.activeArtifactId && !parsed.some((a) => a.id === state.activeArtifactId)) {
          state.activeArtifactId = null;
          state.isPanelOpen = false;
        }

        // Auto-open panel on first artifact found if not already open
        if (parsed.length > 0 && !state.activeArtifactId) {
          state.activeArtifactId = parsed[parsed.length - 1].id;
          state.isPanelOpen = true;
        }
      });
    },

    setActiveArtifact(id) {
      set((state) => {
        state.activeArtifactId = id;
        if (id) {
          state.isPanelOpen = true;
        }
      });
    },

    togglePanel(open) {
      set((state) => {
        state.isPanelOpen = open !== undefined ? open : !state.isPanelOpen;
      });
    },

    reset() {
      set({
        activeArtifactId: null,
        artifacts: {},
        isPanelOpen: false,
      });
    },
  }))
);
