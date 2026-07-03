# GokChat — Changelog

All notable changes to the GokChat project will be documented in this file.

---

## [0.1.0] - 2026-07-03

### Added
- **Initial MVP Release**: Scaffolded and built a complete cross-platform desktop AI chat application using Tauri v2, React 19, Bun, Tailwind CSS v4, and SQLite.
- **Claude/ChatGPT UI Redesign**: Redesigned main workspace screens to align with Claude and ChatGPT interface designs:
  - **Collapsible Sidebar**: Added sidebar collapsed state (`w-16` icon-only column) and expanded state (`w-80` full labels + recents list), controlled by settings state and animated transitions.
  - **Claude-style Welcome Home View**: Implemented a home view (`HomeDashboard.tsx`) with a greeting title ("aswin returns!"), a centered prompt input card, and prompt preset quick-pills (Write, Learn, Code, Life stuff).
  - **ChatGPT-style Floating Input Capsule**: Refactored bottom chat input container in `ChatView.tsx` into a capsule-style card floating above content with a plus button, audio buttons, and clean disclaimer notice.
  - **Unified Model Selector**: Created a dropdown model list component (`ModelSelectorDropdown.tsx`) grouped by provider displaying API configuration indicators, embedded directly inside both welcome card and chat headers.
  - **Pin Conversation Action**: Implemented a SQLite-backed thread pinning feature (`togglePinConversation`) sorting active threads at the top of lists.
  - **Premium Settings Panel**: Remodeled `SettingsDialog.tsx` into a spacious, high-fidelity settings panel mimicking Claude's layout (Image 2):
    - Removed Radix tab component triggers to prevent style conflicts and text overlapping.
    - Added user profile section (full name, preferred name inputs, and circle avatar).
    - Added a dedicated "Instructions" tab allowing configuration of default system instructions.
    - Set up a search settings indicator, credentials sub-cards, password masking/unmasking, theme grids, and connection validating indicators.
- **Claude-style Split Panel 'Artifacts'**: Created a live side-by-side interactive split panel for HTML and SVG code previewing:
  - Custom regex parser (`parseArtifactsFromMessages` in `artifactStore.ts`) to extract `<gok_artifact>` tags on-the-fly.
  - Interactive sandboxed `<iframe>` layout inside a dedicated split container (`ArtifactView.tsx`).
  - Real-time streaming content sync that updates preview rendering word-by-word.
  - Tabbed controls to switch between interactive "Preview" and raw "Code" modes, with full-screen toggle support.
  - Custom system prompt directives prompting cloud/local models to automatically format HTML prototypes inside the custom tag schema.

### Backend Core & Rust Integrations
- **Multi-Provider System**: Implemented the asynchronous `ChatProvider` trait to support multiple backend models.
- **OpenAI Provider**: Full streaming request building, response SSE parsing (`parse_openai_sse_stream`), and model discovery.
- **Anthropic Provider**: Alternating conversation turn validation preprocessor (`preprocess_for_anthropic`), system prompt configuration, and SSE event handlers.
- **OpenAI-Compatible Provider**: Supports local LLM endpoints (Ollama, LM Studio, Groq, OpenRouter) with custom base URLs.
- **Secure Keyring Storage**: Implemented secure API key management using the OS-native credential manager via the `keyring` crate. API keys never cross the IPC boundary or live in web view storage.
- **System Tray Support**: Created programmatic system tray context menus (with Toggle Show/Hide and Quit options) using Tauri's native `TrayIconBuilder`.

### Database & Settings
- **SQLite Database Schema**: Integrated `tauri-plugin-sql` and configured SQLite database tables (`conversations`, `messages`, `provider_configs`, `app_settings`) using automatic migrations.
- **Preferences Storage**: Added `tauri-plugin-store` for client-side configuration persistence.

### Frontend UI & State Management
- **Zustand State Stores**: 
  - `chatStore.ts`: Coordinates conversations loading, cascading deletes, renaming, markdown exports, and optimistic UI additions.
  - `settingsStore.ts`: Coordinates theme classes, font sizes, preferences sync, and keyring API checks.
- **Tauri IPC Bridge**: Created type-safe wrappers for invokes and event listening (`listenToStreamChunk`, `listenToStreamError`, `listenToStreamDone`).
- **Markdown & Syntax Coloring**: Implemented `react-markdown` along with `remark-gfm` (GitHub tables/formatting) and `rehype-highlight` (code syntax highlighting).
- **Interactive Chat Interface**:
  - Message bubble components with model status badges.
  - Text input editor with auto-growing height constraint.
  - Cancel/Stop button to interrupt active token streaming.
  - Quick-edit user messages to prune conversations and resend.
  - Response regeneration button for the latest assistant responses.
  - Pinned conversation sorting and title auto-generation.

### General & Polish
- **Keyboard Shortcuts**: Added global keydown listeners:
  - `Ctrl + N` / `Cmd + N`: Create new conversation.
  - `Ctrl + ,` / `Cmd + ,`: Open Settings.
  - `Escape`: Dismiss settings dialog.
- **Optimized Release Compilation**: Configured compiler flags in `Cargo.toml` (`opt-level = "z"`, `strip = true`, `lto = "thin"`) and restricted parallel build jobs (`jobs = 2`) to ensure low memory and CPU footprint.
