# GokChat — Task Checklist

> **Track every task.** Check off as you go. Each item maps to the [Implementation Plan](file:///home/aswin/programming/vscode/myProjects/ai_agent_tools/gokchat/implementationplan.md).

---

## Pre-flight Checklist

### System Requirements
- [x] Node.js 18+ installed (`node -v`)
- [x] Bun installed (`bun -v`)
- [x] Rust toolchain installed (`rustc --version`, `cargo --version`)
- [x] Tauri CLI installed (`cargo install tauri-cli` or `bun add -g @tauri-apps/cli`)
- [x] System libraries for Tauri (Linux)
- [x] System libraries for keyring (Linux)
- [x] Git installed and configured

---

## Phase 0: Project Scaffolding & Foundation (Completed)
- [x] Scaffold Tauri + React + TypeScript project
- [x] Tailwind CSS v4 Setup (using `@tailwindcss/vite` and `index.css` import)
- [x] shadcn/ui Setup (initialized, components added)
- [x] Project Structure mapped (stores, components, Rust submodules)
- [x] Rust dependencies (keyring, reqwest, tauri-plugin-sql, tauri-plugin-store)
- [x] Frontend dependencies (zustand, react-markdown, remark-gfm, rehype-highlight, lucide-react)
- [x] SQLite Migration definition (1.sql initial tables)

---

## Phase 1: Rust Backend Core (Completed)
- [x] Core models and structs for messaging & payload serialization
- [x] `ChatProvider` async trait
- [x] OpenAI Provider with SSE stream parsing (`parse_openai_sse_stream`)
- [x] Anthropic Provider with turn preprocessing (`preprocess_for_anthropic`) and stream parsing
- [x] OpenAI Compatible Provider wrapping OpenAI SSE parsing with custom URL
- [x] Secure OS Keychain Manager using the Rust `keyring` crate
- [x] Tauri commands (`send_message`, `stop_generation`, `store_api_key`, `get_api_key`, `delete_api_key`, `validate_api_key`, `list_models`)
- [x] Background task streaming and clean event emissions (`stream_chunk`, `stream_error`, `stream_done`)

---

## Phase 2: Frontend Foundation & Stores (Completed)
- [x] Create Zustand stores (`chatStore` & `settingsStore`) with type safety
- [x] Create Tauri IPC wrapper functions (`lib/tauri.ts`) for commands and event listening
- [x] Create shared type definitions (`lib/types.ts`)
- [x] Full App Shell Layout with flex layouts (sidebar + main view)
- [x] Conversation Sidebar component with scroll list, action dropdowns, and search filter
- [x] Pinned status, rename, delete, and JSON/Markdown export
- [x] Dark/light theme support with Tailwind class modifications

---

## Phase 3: Chat Experience (Completed)
- [x] Message bubble component with Lucide role icons
- [x] Markdown rendering using `react-markdown` + `remark-gfm` + `rehype-highlight` syntax coloring
- [x] Streaming indicator and live token update text accumulation
- [x] Auto-scroll to bottom of conversation
- [x] Stop generation button triggering cancel tokens
- [x] Client-side auto-titling for new chats

---

## Phase 4: Settings & Provider Configuration (Completed)
- [x] Settings Dialog with Tab navigation (General, Providers, Appearance)
- [x] Font size adjuster (12px to 20px range)
- [x] Toggle controls for Send on Enter, Stream Responses, Show Token Usage, Auto-Title, Confirm Delete
- [x] Key storage in keyring and key deletion
- [x] Live API key validation testing ("Test Key" with status feedback)
- [x] Provider selection (OpenAI, Anthropic Claude, OpenAI Compatible)
- [x] Custom API base URL configurations
- [x] Fallback model discovery (dropdown fetches models dynamically from API)

---

## Phase 5: Polish & Advanced Features (Outstanding)
- [x] Keyboard Shortcuts (`Ctrl+N` new chat, `Ctrl+,` open settings, `Ctrl+Enter` send)
- [x] System Tray Integration in Tauri config
- [x] Message Editing (editing user messages & regenerating thread)
- [x] Response Regeneration (one-click refresh response)
- [ ] Micro-animations (hover transitions and slide-in panels)
- [x] Claude/ChatGPT-style UI Redesign (collapsible sidebars, model selector, welcome cards, floating inputs)

---

## Phase 6: Build & Distribution (Outstanding)
- [x] Generate App Icons in `src-tauri/icons/`
- [x] Package build verification (`bun run tauri build`)
