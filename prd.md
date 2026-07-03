# GokChat — Product Requirements Document (PRD)

> **Version:** 1.0 (MVP)
> **Status:** Draft
> **Last Updated:** 2026-07-02
> **Author:** GokChat Team

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [Feature Requirements](#3-feature-requirements)
   - [P0 — Must Have (MVP)](#p0--must-have-mvp)
   - [P1 — Should Have](#p1--should-have)
   - [P2 — Nice to Have](#p2--nice-to-have)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Architecture Overview](#5-architecture-overview)
6. [Data Models](#6-data-models)
7. [IPC Contract](#7-ipc-contract)
8. [Success Metrics](#8-success-metrics)
9. [Risks & Mitigations](#9-risks--mitigations)
10. [Out of Scope](#10-out-of-scope)
11. [Release Criteria](#11-release-criteria)

---

## 1. Product Overview

### 1.1 Product Name

**GokChat** — A cross-platform AI chat desktop application.

### 1.2 Version

**v1.0 MVP** — First public release targeting core chat functionality with multi-provider support.

### 1.3 Target Platforms

| Platform | Minimum Version | WebView Runtime |
|----------|----------------|-----------------|
| **Windows** | Windows 10 (1803+) | WebView2 (Edge Chromium) |
| **macOS** | macOS 11 (Big Sur)+ | WKWebView (Safari) |
| **Linux** | Ubuntu 20.04+ / Fedora 36+ | WebKitGTK 4.1+ |

### 1.4 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| App Framework | Tauri | 2.x |
| Frontend Framework | React | 19 |
| Language (Frontend) | TypeScript | 5.x |
| Package Manager / Runtime | Bun | latest |
| CSS Framework | Tailwind CSS | v4 |
| Component Library | shadcn/ui | latest |
| Backend Language | Rust | 2024 edition |
| Database | SQLite (via rusqlite) | 3.x |
| HTTP Client | reqwest | latest (with `stream` feature) |
| Key Management | keyring | latest |
| Serialization | serde + serde_json | latest |
| IPC | Tauri Commands + Events | — |

### 1.5 Product Summary

GokChat is a lightweight, privacy-first desktop application that provides a unified chat interface for multiple AI providers. Users bring their own API keys to connect to OpenAI, Anthropic, and any OpenAI-compatible endpoint (Ollama, Groq, OpenRouter, LM Studio). All data is stored locally, API keys are secured in the OS keychain, and the app delivers native performance through Tauri's Rust backend.

---

## 2. User Personas

### Persona 1: Priya — Full-Stack Developer

| Attribute | Detail |
|-----------|--------|
| **Role** | Senior Full-Stack Developer at a startup |
| **Age** | 29 |
| **AI Usage** | 4–6 hours daily |
| **Providers** | OpenAI (GPT-4o for coding), Anthropic (Claude for writing docs & architecture) |
| **Pain Points** | Constantly switching between ChatGPT and Claude tabs. Loses track of which conversation had that one great code snippet. Both web UIs feel sluggish. Paying $40/mo for two subscriptions when API usage would cost ~$10/mo. |
| **Goals** | Single app for all AI interactions. Fast, keyboard-driven interface. Searchable history across all providers. Lower monthly costs. |
| **Technical Comfort** | Expert — comfortable with API keys, CLI tools, environment variables |

**Priya's Day:**
> She starts her morning by asking GPT-4o to help debug a tricky React hook, then switches to Claude to draft a technical RFC. By afternoon, she's used both models across 8 different conversations and can't remember which one had the database schema suggestion. She wishes she could just search "database schema" across everything.

---

### Persona 2: Dr. Marcus — AI Researcher

| Attribute | Detail |
|-----------|--------|
| **Role** | AI/ML Researcher at a university |
| **Age** | 34 |
| **AI Usage** | Research evaluation, 3–4 hours daily |
| **Providers** | OpenAI, Anthropic, Groq (for speed comparisons), local Ollama models |
| **Pain Points** | Needs to compare how different models respond to the same prompt. Currently copies prompts between multiple browser tabs. No easy way to export structured conversation data for analysis. |
| **Goals** | Side-by-side model comparison. Export conversations as structured data (JSON). Track which model/temperature/system prompt produced each response. Reproducible experiments. |
| **Technical Comfort** | Expert — runs local models, familiar with APIs, Python scripting |

**Marcus's Day:**
> He's evaluating how GPT-4o, Claude 3.5 Sonnet, and Llama 3 70B handle a specific reasoning benchmark. He needs to send the exact same prompt to all three and compare outputs. Currently, he has three browser tabs open and a spreadsheet to track results. He dreams of a single app with a "compare" view.

---

### Persona 3: Elena — Privacy-Conscious Consultant

| Attribute | Detail |
|-----------|--------|
| **Role** | Independent Management Consultant |
| **Age** | 41 |
| **AI Usage** | 2–3 hours daily for client deliverables |
| **Providers** | Ollama (local Llama 3 for client work), OpenAI (GPT-4o for non-sensitive tasks) |
| **Pain Points** | Cannot use cloud AI for client-sensitive data due to NDAs. Web UIs store data on external servers. Needs absolute confidence that sensitive conversations never leave her laptop. Current Ollama terminal interface is not user-friendly. |
| **Goals** | Beautiful chat UI for local models. Guarantee that client data stays local. Easy switching between local (sensitive) and cloud (general) models. Professional-looking exports for client deliverables. |
| **Technical Comfort** | Moderate — can run Ollama, comfortable with desktop apps, not a developer |

**Elena's Day:**
> She's preparing a strategy document for a Fortune 500 client. She uses her local Llama 3 model to brainstorm and refine ideas — the data can't leave her machine due to the NDA. For general research (market trends, public data), she switches to GPT-4o. She needs a clean interface that makes this workflow seamless.

---

### Persona 4: Raj — Cost-Conscious Freelancer

| Attribute | Detail |
|-----------|--------|
| **Role** | Freelance Content Writer & Marketer |
| **Age** | 26 |
| **AI Usage** | 5–8 hours daily across multiple client projects |
| **Providers** | OpenAI (GPT-4o-mini for bulk work, GPT-4o for quality), Groq (fast drafts) |
| **Pain Points** | Paying $20/mo for ChatGPT Plus but hitting rate limits constantly. Can't track how much each client project costs in AI usage. Wants to bill clients for AI costs but has no granular data. |
| **Goals** | Pay-per-use via API (much cheaper than subscription). See token counts and estimated costs per conversation. Organize conversations by client/project. Export conversations as deliverables. |
| **Technical Comfort** | Moderate — can follow setup guides, not a developer |

**Raj's Day:**
> He's writing blog posts for three different clients. For Client A, he uses GPT-4o for high-quality long-form content. For Client B, he uses GPT-4o-mini for quick social media drafts. He wants to know exactly how many tokens (and dollars) each client's work consumed so he can add it to his invoice.

---

## 3. Feature Requirements

---

### P0 — Must Have (MVP)

These features are **required** for the initial release. The app does not ship without them.

---

#### P0-1: Multi-Provider Chat

**Description:**
Users can chat with AI models from multiple providers through a single, unified interface. The app supports three provider types: OpenAI (official API), Anthropic (official API), and any OpenAI-compatible endpoint (custom URL + API key).

**User Stories:**

- *As a developer, I want to chat with GPT-4o and Claude in the same app, so that I don't need to switch between browser tabs.*
- *As a researcher, I want to configure a custom OpenAI-compatible endpoint (e.g., Groq, OpenRouter), so that I can access additional models.*
- *As a privacy-conscious user, I want to connect to my local Ollama instance, so that I can chat with local models through a polished UI.*

**Acceptance Criteria:**

- [ ] User can add and configure an OpenAI provider with API key and base URL
- [ ] User can add and configure an Anthropic provider with API key
- [ ] User can add and configure a custom OpenAI-compatible provider with API key and base URL
- [ ] User can select a provider and model before starting a new conversation
- [ ] User can switch models between messages within the same conversation
- [ ] Each message in the conversation history displays which model generated it
- [ ] At least 3 provider types are supported: `openai`, `anthropic`, `openai-compatible`
- [ ] Messages are sent to the correct provider API endpoint based on the selected model
- [ ] Error states are handled gracefully (invalid key, network error, rate limit, model not found)

---

#### P0-2: Streaming Responses with Real-Time Display

**Description:**
AI responses are streamed token-by-token to the UI in real-time as they arrive from the provider API. Users see text appear progressively rather than waiting for the full response.

**User Stories:**

- *As a user, I want to see the AI's response appear word-by-word as it's generated, so that I get immediate feedback and can start reading before the full response is complete.*
- *As a user chatting with a slow model, I want visual confirmation that the response is being generated, so that I don't think the app has frozen.*

**Acceptance Criteria:**

- [ ] OpenAI responses stream via SSE (`stream: true`) and tokens appear in UI within 50ms of receipt
- [ ] Anthropic responses stream via SSE (`stream: true`) and tokens appear in UI within 50ms of receipt
- [ ] OpenAI-compatible endpoints stream via SSE and tokens appear in UI within 50ms of receipt
- [ ] A typing/loading indicator is shown while waiting for the first token
- [ ] The chat area auto-scrolls as new tokens appear (unless user has scrolled up)
- [ ] If the user scrolls up during streaming, a "scroll to bottom" button appears
- [ ] Streaming errors (network disconnect, API error mid-stream) display an error message inline
- [ ] The complete response is saved to the database after streaming finishes
- [ ] UI remains responsive (no jank, no frozen frames) during active streaming
- [ ] Rust backend handles SSE parsing and emits Tauri events to the frontend

---

#### P0-3: API Key Management

**Description:**
Users can add, edit, delete, and validate API keys for each provider. Keys are stored securely in the OS-level keychain — never in plaintext files, browser storage, or the SQLite database.

**User Stories:**

- *As a new user, I want to add my OpenAI API key during initial setup, so that I can start chatting immediately.*
- *As a user, I want to validate that my API key works before saving it, so that I don't encounter errors when I try to chat.*
- *As a security-conscious user, I want my API keys stored in the OS keychain, so that they are protected by OS-level encryption and access controls.*
- *As a user, I want to delete a provider's API key, so that I can revoke access if the key is compromised.*

**Acceptance Criteria:**

- [ ] User can add API keys for OpenAI, Anthropic, and custom OpenAI-compatible providers
- [ ] API keys are stored using the `keyring` crate in the OS-native credential store
- [ ] API keys are **never** written to disk in plaintext (no config files, no SQLite, no logs)
- [ ] User can validate an API key by making a lightweight test request (e.g., list models)
- [ ] Validation result is displayed clearly (✓ valid / ✗ invalid with error message)
- [ ] User can edit (update) an existing API key
- [ ] User can delete an API key, which removes it from the OS keychain
- [ ] API key input field uses `type="password"` with a show/hide toggle
- [ ] If no API keys are configured, the app shows a welcoming setup flow guiding the user to add their first key

---

#### P0-4: Conversation Management

**Description:**
Users can create, rename, delete, and browse conversations. Conversations are organized chronologically in a sidebar and each conversation is associated with a provider/model.

**User Stories:**

- *As a user, I want to create a new conversation, so that I can start a fresh chat with any model.*
- *As a user, I want to see all my past conversations in a sidebar, so that I can quickly return to previous discussions.*
- *As a user, I want to rename a conversation, so that I can give it a meaningful title instead of "New Chat."*
- *As a user, I want to delete a conversation I no longer need, so that I can keep my history clean.*

**Acceptance Criteria:**

- [ ] A "New Chat" button creates a new conversation and opens it in the chat area
- [ ] Conversations are listed in a sidebar, grouped by date (Today, Yesterday, Previous 7 Days, Previous 30 Days, Older)
- [ ] Each conversation entry in the sidebar shows: title, model/provider icon, and last message timestamp
- [ ] User can rename a conversation by clicking on its title or via a context menu
- [ ] User can delete a conversation via a context menu with a confirmation prompt
- [ ] Deleting a conversation removes all associated messages from the database
- [ ] Clicking a conversation in the sidebar loads its full message history in the chat area
- [ ] The currently active conversation is visually highlighted in the sidebar
- [ ] New conversations start with a default title ("New Chat") or an auto-generated title
- [ ] The sidebar is scrollable when conversations exceed the visible area
- [ ] Empty state: when no conversations exist, the sidebar shows a welcome message and prompts the user to start a new chat

---

#### P0-5: Chat History Persistence (SQLite)

**Description:**
All conversations and messages are persisted in a local SQLite database. Data survives app restarts, updates, and OS reboots. The database is stored in the Tauri app data directory.

**User Stories:**

- *As a user, I want my conversations to be saved automatically, so that I never lose my chat history.*
- *As a user, I want conversations to load instantly when I open the app, so that I can pick up where I left off.*
- *As a user, I want my data stored locally on my machine, so that it never leaves my control.*

**Acceptance Criteria:**

- [ ] All messages (user + assistant) are written to SQLite immediately after they are finalized
- [ ] Conversations persist across app restarts — all data is restored on launch
- [ ] The SQLite database file is located in the Tauri app data directory (`app_data_dir()`)
- [ ] Database schema includes tables for: `providers`, `conversations`, `messages`
- [ ] Each message stores: role, content, model, provider, token counts (if available), timestamp
- [ ] Each conversation stores: title, created_at, updated_at, default model/provider
- [ ] Database migrations are handled automatically on app startup
- [ ] The database is created automatically on first launch if it doesn't exist
- [ ] Database operations do not block the UI thread (async Rust commands)
- [ ] Data integrity is maintained — no partial writes, no orphaned messages

---

#### P0-6: Markdown Rendering with Syntax-Highlighted Code Blocks

**Description:**
AI responses often contain Markdown formatting (headers, lists, bold, italic, links) and code blocks. The app must render Markdown faithfully with syntax highlighting for code in all major programming languages.

**User Stories:**

- *As a developer, I want code blocks in AI responses to have syntax highlighting, so that I can read code easily.*
- *As a user, I want Markdown formatting (headers, lists, bold, links) to render properly, so that responses are readable and well-structured.*
- *As a developer, I want to copy code from highlighted code blocks with one click, so that I can paste it directly into my editor.*

**Acceptance Criteria:**

- [ ] Standard Markdown elements render correctly: `# headers`, `**bold**`, `*italic*`, `[links](url)`, `> blockquotes`, `- lists`, `1. ordered lists`, `---` horizontal rules
- [ ] Fenced code blocks (` ``` `) render with syntax highlighting
- [ ] Language detection: code blocks with language identifiers (` ```python `, ` ```rust `, etc.) use the correct syntax highlighter
- [ ] At minimum, syntax highlighting supports: JavaScript, TypeScript, Python, Rust, Go, Java, C, C++, HTML, CSS, SQL, JSON, YAML, Bash, Markdown
- [ ] Each code block has a "Copy" button that copies the code content to the clipboard
- [ ] Copy button shows a brief confirmation state (e.g., checkmark or "Copied!")
- [ ] Inline code (`` `code` ``) renders with a distinct background
- [ ] Tables render as formatted HTML tables
- [ ] LaTeX/math rendering is **not** required for MVP (P2 stretch goal)
- [ ] Long code blocks are scrollable horizontally without breaking the page layout
- [ ] Markdown renders correctly during streaming (partial markdown is handled gracefully)

---

#### P0-7: Dark / Light Theme

**Description:**
The app supports both dark and light color themes. The user can explicitly select a theme or use the system preference.

**User Stories:**

- *As a user who works at night, I want a dark theme, so that the app doesn't strain my eyes.*
- *As a user, I want the app to follow my OS theme preference by default, so that it matches my system aesthetics.*
- *As a user, I want to manually override the theme regardless of my system setting.*

**Acceptance Criteria:**

- [ ] Three theme options: Light, Dark, System (follow OS preference)
- [ ] Default on first launch: System
- [ ] Theme preference is persisted across app restarts
- [ ] Theme toggle is accessible from the settings page and optionally from the sidebar header
- [ ] All UI components (sidebar, chat area, input, settings, dialogs, scrollbars) respect the active theme
- [ ] Theme transition is smooth (no flash of unstyled content)
- [ ] Dark theme uses a carefully designed color palette — not just "inverted colors"
- [ ] Light theme is clean and professional
- [ ] Code block syntax highlighting adapts to the active theme (dark background for dark theme, light background for light theme)
- [ ] Tailwind CSS v4 theming capabilities are used for implementation

---

#### P0-8: System Prompt Configuration Per Conversation

**Description:**
Users can set a custom system prompt for each conversation. The system prompt is sent as the first message in the API request and influences the AI's behavior throughout the conversation.

**User Stories:**

- *As a developer, I want to set a system prompt like "You are a senior Rust engineer. Always write idiomatic Rust code with error handling," so that the AI's responses are tailored to my needs.*
- *As a user, I want each conversation to have its own system prompt, so that different conversations can have different AI behaviors.*
- *As a user, I want to edit the system prompt at any time during a conversation.*

**Acceptance Criteria:**

- [ ] Each conversation has an optional system prompt field
- [ ] System prompt can be set when creating a new conversation
- [ ] System prompt can be edited at any time via a conversation settings panel or modal
- [ ] The system prompt is included as the first message (role: "system") in every API request for that conversation
- [ ] System prompt is persisted in the database with the conversation
- [ ] An empty system prompt means no system message is sent (provider default behavior)
- [ ] System prompt input is a multi-line textarea with reasonable height
- [ ] Changing the system prompt does NOT retroactively affect previous messages — it applies to subsequent API calls
- [ ] A character count or token estimate is shown for the system prompt

---

#### P0-9: Model Selector Per Provider

**Description:**
Users can select which AI model to use for each conversation or message. The available models are determined by the configured provider.

**User Stories:**

- *As a user, I want to choose which model to use (e.g., GPT-4o vs GPT-4o-mini), so that I can balance quality and cost.*
- *As a user, I want to see only the models available for my selected provider, so that I don't get confused by irrelevant options.*
- *As a user, I want to switch models mid-conversation, so that I can try a different model for a follow-up question.*

**Acceptance Criteria:**

- [ ] A model selector dropdown is visible in the chat input area
- [ ] The dropdown shows only models available for the currently selected provider
- [ ] For OpenAI: fetch available models from the API (`GET /v1/models`) and display a curated default list as fallback
- [ ] For Anthropic: display a hardcoded list of known models (Anthropic doesn't expose a model list API) with the latest defaults
- [ ] For OpenAI-compatible: attempt to fetch from `/v1/models` endpoint; fall back to user-configured model list
- [ ] The selected model name is displayed clearly in the input area
- [ ] Model selection can be changed between messages within the same conversation
- [ ] The model used for each message is stored in the database
- [ ] Each message bubble displays the model name that generated it
- [ ] The model selector is searchable/filterable when the list is long

---

#### P0-10: Copy Code Blocks and Messages

**Description:**
Users can copy the content of individual code blocks or entire messages to the clipboard with a single click.

**User Stories:**

- *As a developer, I want to copy a code block from an AI response with one click, so that I can paste it into my editor without manually selecting text.*
- *As a user, I want to copy an entire AI message, so that I can share it with a colleague or paste it into a document.*
- *As a user, I want to copy my own messages, so that I can refine and resend a prompt.*

**Acceptance Criteria:**

- [ ] Each fenced code block has a visible "Copy" button (icon) in the top-right corner
- [ ] Clicking the code block copy button copies only the code content (without the language identifier or markdown formatting)
- [ ] Each message (user and assistant) has a "Copy" action (visible on hover or via a menu)
- [ ] Copying a message copies the raw Markdown content
- [ ] Copy actions show a brief visual confirmation (e.g., icon changes to checkmark for 2 seconds, or tooltip says "Copied!")
- [ ] Copy works via the system clipboard (Ctrl/Cmd+C also works when text is manually selected)
- [ ] Copy functionality works across all themes

---

### P1 — Should Have

These features significantly improve the user experience and are targeted for v1.x releases shortly after MVP.

---

#### P1-1: Conversation Search

**Description:**
Users can search across all conversations by keyword. Search matches conversation titles and message content.

**User Stories:**

- *As a user with hundreds of conversations, I want to search for a specific topic, so that I can find the conversation where I discussed it.*
- *As a developer, I want to search for a code snippet I remember receiving from an AI, so that I can reuse it.*

**Acceptance Criteria:**

- [ ] A search input field is accessible from the sidebar (always visible or toggled via icon/shortcut)
- [ ] Search queries are matched against conversation titles and message content
- [ ] Results are displayed as a filtered list of conversations with matching text highlighted
- [ ] Clicking a search result opens the conversation and scrolls to the matching message
- [ ] Search is performed locally against the SQLite database (FTS5 full-text search)
- [ ] Search is fast: <200ms for databases with up to 10,000 messages
- [ ] Empty search results show a "No results found" message
- [ ] Search supports basic queries (exact match, partial match) — regex is not required
- [ ] Keyboard shortcut: `Ctrl/Cmd + K` or `Ctrl/Cmd + F` opens search

---

#### P1-2: Export Conversations

**Description:**
Users can export individual conversations or all conversations in Markdown or JSON format.

**User Stories:**

- *As a user, I want to export a conversation as Markdown, so that I can include it in documentation or share it.*
- *As a researcher, I want to export conversations as JSON, so that I can analyze them programmatically.*
- *As a user, I want to back up all my conversations, so that I can restore them if I switch devices.*

**Acceptance Criteria:**

- [ ] Export option is available in the conversation context menu and conversation settings
- [ ] Supported export formats: Markdown (`.md`), JSON (`.json`)
- [ ] Markdown export includes: conversation title, model info, system prompt, and all messages with timestamps
- [ ] JSON export includes: full conversation metadata, messages array with all fields (role, content, model, tokens, timestamp)
- [ ] User can choose the save location via the OS native file dialog
- [ ] Bulk export: user can export all conversations at once (as a zip or folder)
- [ ] Export completes without blocking the UI

---

#### P1-3: System Tray with Quick Access

**Description:**
The app runs in the system tray and can be quickly accessed via a tray icon. This allows the app to stay running in the background without occupying taskbar space.

**User Stories:**

- *As a user, I want the app to minimize to the system tray when I close the window, so that it stays running and I can quickly access it.*
- *As a power user, I want a global hotkey to show/hide the app, so that I can start a chat from anywhere instantly.*

**Acceptance Criteria:**

- [ ] App icon appears in the system tray on all platforms
- [ ] Right-clicking the tray icon shows a context menu with: Show/Hide, New Chat, Quit
- [ ] Clicking the tray icon toggles app visibility
- [ ] Closing the window minimizes to tray instead of quitting (configurable)
- [ ] A global hotkey (e.g., `Ctrl/Cmd + Shift + G`) shows/hides the app from anywhere
- [ ] The tray icon respects OS dark/light theme

---

#### P1-4: Keyboard Shortcuts

**Description:**
Comprehensive keyboard shortcuts for power users to navigate and interact without a mouse.

**User Stories:**

- *As a power user, I want keyboard shortcuts for common actions, so that I can work faster without reaching for the mouse.*
- *As a developer, I want Ctrl+Enter to send messages (instead of Enter), so that I can write multi-line prompts easily.*

**Acceptance Criteria:**

- [ ] `Ctrl/Cmd + N` — New conversation
- [ ] `Ctrl/Cmd + K` or `Ctrl/Cmd + P` — Open search / command palette
- [ ] `Ctrl/Cmd + ,` — Open settings
- [ ] `Ctrl/Cmd + W` — Close current conversation
- [ ] `Ctrl/Cmd + 1-9` — Switch to Nth conversation
- [ ] `Enter` — Send message (configurable)
- [ ] `Shift + Enter` — New line in message input
- [ ] `Ctrl/Cmd + Shift + C` — Copy last AI response
- [ ] `Escape` — Close modal / cancel current action
- [ ] `Ctrl/Cmd + L` — Clear conversation (with confirmation)
- [ ] Shortcuts are discoverable via a help modal (`Ctrl/Cmd + ?`)
- [ ] Shortcuts are configurable in settings (P2 stretch)

---

#### P1-5: Custom OpenAI-Compatible Endpoint Configuration

**Description:**
Users can add custom API endpoints that follow the OpenAI API format. This enables connecting to services like Ollama, Groq, OpenRouter, LM Studio, Together AI, and self-hosted models.

**User Stories:**

- *As a user running Ollama locally, I want to add `http://localhost:11434/v1` as a custom endpoint, so that I can chat with my local models.*
- *As a user, I want to connect to OpenRouter with my API key, so that I can access 100+ models through a single provider.*
- *As a user, I want to configure multiple custom endpoints, so that I can use different providers for different use cases.*

**Acceptance Criteria:**

- [ ] User can add a custom provider with: display name, base URL, API key (optional for local), and default model
- [ ] User can add multiple custom providers
- [ ] Base URL validation: ensure the URL is well-formed and optionally test the connection
- [ ] For local endpoints (localhost), API key is optional
- [ ] Custom providers appear in the provider selector alongside built-in providers
- [ ] User can edit and delete custom providers
- [ ] Provider configurations are stored in the SQLite database (keys in keychain)
- [ ] Preset templates for common providers: Ollama (`http://localhost:11434/v1`), Groq, OpenRouter, LM Studio (`http://localhost:1234/v1`), Together AI

---

#### P1-6: Token Usage Display Per Message

**Description:**
Each AI response displays the number of tokens used (prompt tokens + completion tokens) so users can monitor usage and estimate costs.

**User Stories:**

- *As a cost-conscious user, I want to see how many tokens each response used, so that I can estimate my API costs.*
- *As a researcher, I want to see prompt vs. completion token counts, so that I can optimize my prompts.*

**Acceptance Criteria:**

- [ ] Each assistant message displays total token count (prompt + completion) when available
- [ ] Token breakdown (prompt tokens / completion tokens) is visible on hover or expand
- [ ] Token data is extracted from the API response's `usage` field
- [ ] Token counts are stored in the database with each message
- [ ] If the API does not return usage data (e.g., some OpenAI-compatible endpoints), the field is hidden gracefully
- [ ] Token display is subtle and non-intrusive (shown below the message or in a tooltip)

---

#### P1-7: Auto-Title Conversations Using AI

**Description:**
After the first user message and AI response in a new conversation, the app automatically generates a concise title using the AI model.

**User Stories:**

- *As a user, I want conversations to be automatically titled based on the topic, so that I can find them later without manual renaming.*

**Acceptance Criteria:**

- [ ] After the first assistant response in a new "New Chat" conversation, a title generation request is sent to the same model
- [ ] The generated title is concise (3–7 words) and descriptive
- [ ] Title generation uses a separate, minimal API call (system prompt: "Generate a concise title for this conversation in 3-7 words. Respond with only the title.")
- [ ] Title generation runs in the background and does not block the UI
- [ ] If title generation fails, the conversation keeps its default title
- [ ] User can still manually rename the conversation after auto-titling
- [ ] Title generation uses the cheapest available model from the same provider (e.g., GPT-4o-mini for OpenAI)

---

#### P1-8: Stop Generation Button

**Description:**
Users can stop an in-progress AI response at any time.

**User Stories:**

- *As a user, I want to stop a response that's going in the wrong direction, so that I don't waste tokens and time.*
- *As a user, I want to stop generation if I realize I asked the wrong question.*

**Acceptance Criteria:**

- [ ] A visible "Stop" button replaces the "Send" button while a response is streaming
- [ ] Clicking "Stop" immediately halts the streaming connection
- [ ] The partial response received so far is kept and saved to the database
- [ ] The message is marked as "stopped" or "incomplete" visually (subtle indicator)
- [ ] After stopping, the user can send a new message normally
- [ ] Keyboard shortcut: `Escape` stops generation
- [ ] Stop is graceful — no error messages, no broken state

---

#### P1-9: Regenerate Last Response

**Description:**
Users can regenerate the AI's last response to get a different answer.

**User Stories:**

- *As a user, I want to regenerate a response if I'm not satisfied with it, so that I can get a better answer without retyping my prompt.*
- *As a researcher, I want to regenerate responses to see the model's variability.*

**Acceptance Criteria:**

- [ ] A "Regenerate" button/icon is available on the last assistant message
- [ ] Clicking "Regenerate" sends the same conversation context to the API and replaces the last response
- [ ] The previous response is discarded (or optionally saved — P2 stretch)
- [ ] Regeneration uses the same model and settings as the original request
- [ ] The regenerate action works with streaming
- [ ] User can regenerate multiple times

---

#### P1-10: Message Editing

**Description:**
Users can edit previously sent messages and resubmit them.

**User Stories:**

- *As a user, I want to edit a message I already sent, so that I can fix a typo or rephrase my question without starting a new conversation.*

**Acceptance Criteria:**

- [ ] User messages show an "Edit" action on hover
- [ ] Clicking "Edit" turns the message into an editable textarea pre-filled with the original content
- [ ] Saving the edit resubmits the message to the AI from that point
- [ ] All messages after the edited message are removed (conversation is "branched" from the edit point)
- [ ] User can cancel the edit and restore the original message
- [ ] The edit action is only available for user messages (not assistant messages)

---

### P2 — Nice to Have

These features enhance the product significantly but are not required for initial releases.

---

#### P2-1: Image Input (Vision Models)

**Description:**
Users can attach images to messages for use with vision-capable models (GPT-4o, Claude 3.5 Sonnet, etc.).

**User Stories:**

- *As a developer, I want to paste a screenshot of an error into the chat, so that the AI can help me debug visually.*
- *As a user, I want to drag and drop an image into the chat input, so that I can ask the AI about it.*

**Acceptance Criteria:**

- [ ] Users can attach images via: file picker, drag-and-drop, clipboard paste (Ctrl/Cmd+V)
- [ ] Supported formats: PNG, JPEG, GIF, WebP
- [ ] Image preview is shown in the message before sending
- [ ] Images are sent to the API in the correct format (base64 for OpenAI, base64 for Anthropic)
- [ ] Images are stored locally (in app data directory) and referenced in the database
- [ ] Image input is only enabled when the selected model supports vision
- [ ] Multiple images per message are supported (up to provider limits)
- [ ] Maximum file size: 20MB per image (matching provider limits)

---

#### P2-2: Multiple Chat Tabs

**Description:**
Users can have multiple conversations open simultaneously in tabs, similar to browser tabs.

**User Stories:**

- *As a power user, I want to have multiple chats open in tabs, so that I can quickly switch between ongoing conversations.*

**Acceptance Criteria:**

- [ ] Conversations open in tabs at the top of the chat area
- [ ] Users can open a conversation from the sidebar in a new tab (middle-click or context menu)
- [ ] Tabs can be closed, reordered, and scrolled
- [ ] Active tab is visually highlighted
- [ ] Keyboard shortcuts: `Ctrl/Cmd + Tab` cycles tabs, `Ctrl/Cmd + W` closes current tab
- [ ] Each tab maintains its own scroll position and state
- [ ] Maximum 10 open tabs (configurable)

---

#### P2-3: Cost Estimation / Tracking

**Description:**
The app estimates and tracks API costs based on token usage and known provider pricing.

**User Stories:**

- *As a freelancer, I want to see the estimated cost of each conversation, so that I can bill my clients accurately.*
- *As a cost-conscious user, I want a dashboard showing my total spending per provider per day/week/month.*

**Acceptance Criteria:**

- [ ] Cost estimates are shown per message based on token counts × model pricing
- [ ] Pricing data is stored locally (hardcoded defaults with ability to customize)
- [ ] A usage dashboard shows: total tokens, estimated cost, broken down by provider/model/time period
- [ ] Costs are displayed in USD (with potential for other currencies in future)
- [ ] Cost data is stored in the database and queryable

---

#### P2-4: Prompt Template Library

**Description:**
Users can save, organize, and reuse prompt templates.

**User Stories:**

- *As a user, I want to save my frequently used system prompts as templates, so that I can reuse them without retyping.*
- *As a developer, I want a "Code Review" template that sets up the system prompt and initial context.*

**Acceptance Criteria:**

- [ ] Users can create, edit, and delete prompt templates
- [ ] Templates include: name, system prompt, and optional first user message
- [ ] Templates can be applied when creating a new conversation
- [ ] Templates are stored locally in the SQLite database
- [ ] A default set of starter templates is pre-loaded (Code Assistant, Writing Assistant, Translator, etc.)

---

#### P2-5: Auto-Updater

**Description:**
The app checks for and installs updates automatically.

**User Stories:**

- *As a user, I want the app to update itself, so that I always have the latest features and security fixes.*

**Acceptance Criteria:**

- [ ] App checks for updates on launch (with configurable interval)
- [ ] User is notified of available updates with release notes
- [ ] User can choose to install now or later
- [ ] Update is downloaded and installed in the background
- [ ] Tauri's built-in updater plugin is used
- [ ] Updates are signed and verified

---

#### P2-6: Import Conversations

**Description:**
Users can import conversations from ChatGPT and Claude exports.

**User Stories:**

- *As a user switching from ChatGPT, I want to import my conversation history, so that I don't lose my past work.*

**Acceptance Criteria:**

- [ ] Support import of ChatGPT export format (JSON from "Export data" feature)
- [ ] Support import of Claude export format (if available)
- [ ] Imported conversations appear in the sidebar with original titles and dates
- [ ] Duplicate detection: warn if a conversation appears to already exist
- [ ] Import progress indicator for large exports

---

#### P2-7: Split View — Compare Models Side-by-Side

**Description:**
Users can send the same prompt to two or more models simultaneously and compare responses side-by-side.

**User Stories:**

- *As a researcher, I want to compare how GPT-4o and Claude 3.5 Sonnet respond to the same prompt, so that I can evaluate model quality.*
- *As a developer, I want to see which model gives the best code suggestion for my specific problem.*

**Acceptance Criteria:**

- [ ] User can open a "Compare" view with 2 or 3 model columns
- [ ] The same user message is sent to all selected models simultaneously
- [ ] Each column shows the streaming response from its model independently
- [ ] Responses are aligned vertically for easy comparison
- [ ] Each column shows the model name, token count, and response time
- [ ] Compare view conversations are saved in the database
- [ ] User can select any combination of providers/models for comparison

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **App startup time** | <500ms to interactive (cold start) | Time from process start to first interactive frame |
| **UI interaction latency** | <100ms for all user actions | Time from click/keypress to visual feedback |
| **Streaming overhead** | <50ms added latency per token | Difference between network receipt and UI render |
| **Time to first token display** | <200ms after API first token | Time from first SSE chunk to rendered text |
| **Conversation load time** | <200ms for conversations with <1000 messages | Time from sidebar click to full render |
| **Search latency** | <200ms for 10,000+ messages | Time from query to results display |
| **Database write latency** | <50ms per message write | Time for SQLite insert |
| **Memory (idle)** | <100MB | Measured via OS task manager after 5 min idle |
| **Memory (active)** | <300MB | Measured during active streaming with 10+ conversations loaded |
| **Bundle size** | <15MB (installed) | Total app size after installation |

### 4.2 Security

| Requirement | Implementation |
|-------------|---------------|
| **API key storage** | OS-native keychain via `keyring` crate. Never in config files, SQLite, env vars, or logs. |
| **API key transmission** | Keys are sent only to their respective provider API endpoints over HTTPS. Never to any third-party. |
| **Data at rest** | SQLite database in Tauri's app data directory with OS file permissions. No encryption at rest for v1 (P2 consideration). |
| **No telemetry** | Zero analytics, tracking, or usage reporting. The app makes zero network requests except user-initiated API calls. |
| **No data exfiltration** | No data ever leaves the device except through explicit API calls and user-initiated exports. |
| **Content Security Policy** | Strict CSP headers on the webview to prevent XSS and code injection. |
| **Tauri security** | Follow Tauri security best practices: allowlist-based IPC, no `dangerousRemoteContent`, scoped file access. |
| **Dependency auditing** | Regular `cargo audit` and `npm audit` checks in CI/CD. |

### 4.3 Accessibility

| Requirement | Standard |
|-------------|----------|
| **Keyboard navigation** | All interactive elements are reachable and operable via keyboard |
| **Focus management** | Visible focus indicators on all interactive elements. Focus trapped in modals. |
| **Screen reader support** | Semantic HTML, ARIA labels for custom components, live regions for streaming text |
| **Color contrast** | WCAG 2.1 AA minimum (4.5:1 for text, 3:1 for large text) |
| **Text scaling** | UI remains usable at 150% and 200% zoom |
| **Motion sensitivity** | Respect `prefers-reduced-motion` OS setting |
| **Font sizing** | Configurable font size in settings |

### 4.4 Reliability

| Requirement | Target |
|-------------|--------|
| **Crash rate** | <0.1% of sessions |
| **Data integrity** | Zero data loss under normal operation. SQLite WAL mode for crash recovery. |
| **Graceful degradation** | Network errors, API failures, and invalid responses are handled without crashing |
| **Recovery** | App recovers cleanly from force-quit, OS sleep/wake, and network changes |

### 4.5 Compatibility

| Requirement | Details |
|-------------|---------|
| **OS support** | Windows 10+, macOS 11+, Ubuntu 20.04+ / Fedora 36+ |
| **Screen sizes** | Responsive from 1024×768 to 4K displays |
| **HiDPI** | Proper scaling on Retina and high-DPI displays |
| **Locale** | UTF-8 support for all text. UI language: English (i18n is P2) |

---

## 5. Architecture Overview

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     GokChat App                         │
│                                                         │
│  ┌──────────────────────┐   ┌────────────────────────┐  │
│  │    React Frontend     │   │     Rust Backend        │  │
│  │                       │   │                         │  │
│  │  ┌─────────────────┐  │   │  ┌──────────────────┐  │  │
│  │  │   Chat UI        │  │   │  │  Tauri Commands   │  │  │
│  │  │   Sidebar        │◄─┼──►│  │  (IPC Handlers)   │  │  │
│  │  │   Settings       │  │   │  └──────┬───────────┘  │  │
│  │  │   Model Selector │  │   │         │              │  │
│  │  └─────────────────┘  │   │  ┌──────▼───────────┐  │  │
│  │                       │   │  │  Provider Router   │  │  │
│  │  ┌─────────────────┐  │   │  │  (OpenAI/Anthropic │  │  │
│  │  │  State Mgmt      │  │   │  │   /Custom)        │  │  │
│  │  │  (Zustand/       │  │   │  └──────┬───────────┘  │  │
│  │  │   Context)       │  │   │         │              │  │
│  │  └─────────────────┘  │   │  ┌──────▼───────────┐  │  │
│  │                       │   │  │  SQLite (rusqlite) │  │  │
│  │  ┌─────────────────┐  │   │  └──────────────────┘  │  │
│  │  │  Tailwind CSS v4 │  │   │                         │  │
│  │  │  + shadcn/ui     │  │   │  ┌──────────────────┐  │  │
│  │  └─────────────────┘  │   │  │  Keyring (OS)     │  │  │
│  │                       │   │  └──────────────────┘  │  │
│  └──────────────────────┘   └────────────────────────┘  │
│                                                         │
│           Tauri IPC (invoke + events)                    │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────┐           ┌──────────────────────┐
│  OS WebView   │           │  OS Keychain          │
│  (System)     │           │  (Keyring/Credential) │
└──────────────┘           └──────────────────────┘
```

### 5.2 Backend Responsibility Breakdown

| Module | Responsibilities |
|--------|-----------------|
| **IPC Handlers** | Expose Tauri commands for frontend consumption. Input validation. Error mapping. |
| **Provider Router** | Route chat requests to the correct provider API. Handle provider-specific request/response formats. |
| **OpenAI Provider** | Build OpenAI-format requests. Parse SSE streams. Handle errors. Support `/v1/chat/completions` and `/v1/models`. |
| **Anthropic Provider** | Build Anthropic-format requests (different from OpenAI). Parse SSE streams. Handle Anthropic-specific errors. |
| **Custom Provider** | Same as OpenAI provider but with configurable base URL and optional API key. |
| **Database** | SQLite schema management, migrations, CRUD operations for conversations/messages/providers. |
| **Key Manager** | Interface with OS keychain via `keyring`. Store, retrieve, delete, and validate API keys. |
| **Streaming** | Use `reqwest` with streaming response body. Parse SSE lines. Emit Tauri events with token chunks. |

### 5.3 Frontend Responsibility Breakdown

| Module | Responsibilities |
|--------|-----------------|
| **Chat View** | Render messages, handle streaming display, auto-scroll, markdown rendering |
| **Sidebar** | Conversation list, date grouping, search, new chat button |
| **Settings** | Provider/key management, theme toggle, preferences |
| **Input Area** | Message composition, model selector, send/stop buttons, file attachments (P2) |
| **State Management** | Conversation state, UI state, theme state. Zustand or React Context. |
| **IPC Layer** | Typed wrapper functions around `invoke()` and `listen()` for type-safe backend communication |

---

## 6. Data Models

### 6.1 Database Schema

```sql
-- Provider configurations (keys stored in OS keychain, NOT here)
CREATE TABLE providers (
    id          TEXT PRIMARY KEY,    -- UUID
    name        TEXT NOT NULL,       -- Display name (e.g., "OpenAI", "My Ollama")
    type        TEXT NOT NULL,       -- "openai" | "anthropic" | "openai-compatible"
    base_url    TEXT NOT NULL,       -- API base URL
    is_enabled  INTEGER DEFAULT 1,  -- Active/inactive toggle
    created_at  TEXT NOT NULL,       -- ISO 8601 timestamp
    updated_at  TEXT NOT NULL        -- ISO 8601 timestamp
);

-- Conversations
CREATE TABLE conversations (
    id              TEXT PRIMARY KEY,    -- UUID
    title           TEXT NOT NULL,       -- Display title
    system_prompt   TEXT,                -- Optional system prompt
    provider_id     TEXT,                -- Default provider FK
    model           TEXT,                -- Default model name
    created_at      TEXT NOT NULL,       -- ISO 8601 timestamp
    updated_at      TEXT NOT NULL,       -- ISO 8601 timestamp
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

-- Messages
CREATE TABLE messages (
    id              TEXT PRIMARY KEY,    -- UUID
    conversation_id TEXT NOT NULL,       -- FK to conversations
    role            TEXT NOT NULL,       -- "user" | "assistant" | "system"
    content         TEXT NOT NULL,       -- Message text (Markdown)
    model           TEXT,                -- Model used (for assistant messages)
    provider_id     TEXT,                -- Provider used (for assistant messages)
    prompt_tokens   INTEGER,            -- Token usage from API response
    completion_tokens INTEGER,          -- Token usage from API response
    total_tokens    INTEGER,            -- prompt + completion
    is_complete     INTEGER DEFAULT 1,  -- 0 if streaming was stopped
    created_at      TEXT NOT NULL,       -- ISO 8601 timestamp
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

-- Full-text search index
CREATE VIRTUAL TABLE messages_fts USING fts5(
    content,
    content='messages',
    content_rowid='rowid'
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

### 6.2 TypeScript Types (Frontend)

```typescript
// Provider types
type ProviderType = "openai" | "anthropic" | "openai-compatible";

interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Conversation types
interface Conversation {
  id: string;
  title: string;
  systemPrompt: string | null;
  providerId: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
}

// Message types
type MessageRole = "user" | "assistant" | "system";

interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  model: string | null;
  providerId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  isComplete: boolean;
  createdAt: string;
}

// Streaming event payload
interface StreamChunk {
  conversationId: string;
  messageId: string;
  delta: string;          // Text chunk
  isComplete: boolean;    // True on final chunk
  usage?: TokenUsage;     // Present on final chunk
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### 6.3 Rust Types (Backend)

```rust
// Provider
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub base_url: String,
    pub is_enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderType {
    Openai,
    Anthropic,
    OpenaiCompatible,
}

// Conversation
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub system_prompt: Option<String>,
    pub provider_id: Option<String>,
    pub model: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Message
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
    pub model: Option<String>,
    pub provider_id: Option<String>,
    pub prompt_tokens: Option<i64>,
    pub completion_tokens: Option<i64>,
    pub total_tokens: Option<i64>,
    pub is_complete: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}
```

---

## 7. IPC Contract

### 7.1 Tauri Commands (invoke)

These are the Rust functions exposed to the React frontend via `invoke()`.

#### Provider Management

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `list_providers` | — | `Vec<Provider>` | List all configured providers |
| `add_provider` | `AddProviderInput` | `Provider` | Add a new provider (key goes to keychain) |
| `update_provider` | `UpdateProviderInput` | `Provider` | Update provider config |
| `delete_provider` | `{ id: String }` | `()` | Delete provider and remove key from keychain |
| `validate_api_key` | `{ provider_id: String }` | `ValidationResult` | Test API key by hitting the models endpoint |
| `list_models` | `{ provider_id: String }` | `Vec<ModelInfo>` | Fetch available models for a provider |

#### Conversation Management

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `list_conversations` | — | `Vec<Conversation>` | List all conversations (sorted by updated_at DESC) |
| `create_conversation` | `CreateConversationInput` | `Conversation` | Create a new conversation |
| `update_conversation` | `UpdateConversationInput` | `Conversation` | Update title, system prompt, default model |
| `delete_conversation` | `{ id: String }` | `()` | Delete conversation and all its messages |
| `get_conversation_messages` | `{ id: String }` | `Vec<Message>` | Get all messages for a conversation |
| `search_conversations` | `{ query: String }` | `Vec<SearchResult>` | Full-text search across messages |

#### Chat

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `send_message` | `SendMessageInput` | `Message` | Save user message and initiate AI response |
| `stop_generation` | `{ conversation_id: String }` | `()` | Cancel an in-progress streaming response |
| `regenerate_response` | `{ message_id: String }` | `()` | Regenerate the last assistant response |

#### Settings

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `get_settings` | — | `AppSettings` | Get app settings |
| `update_settings` | `AppSettings` | `()` | Save app settings |

### 7.2 Tauri Events (listen)

These events are emitted from Rust to React during streaming operations.

| Event Name | Payload | Description |
|------------|---------|-------------|
| `stream-chunk` | `StreamChunk` | A text chunk during streaming. Emitted for each SSE data line. |
| `stream-complete` | `StreamComplete` | Streaming finished successfully. Contains final token usage. |
| `stream-error` | `StreamError` | An error occurred during streaming. Contains error details. |
| `title-generated` | `TitleGenerated` | Auto-generated title for a conversation. |

---

## 8. Success Metrics

### 8.1 Core UX Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| **Time to first message after install** | <2 minutes | From download completion to first AI response received |
| **App startup time** | <500ms | Cold start to interactive UI (measured with OS profiling) |
| **Streaming perceived latency** | <100ms overhead | Delta between API first-token and UI first-render (instrumented) |
| **Conversation switch time** | <200ms | Time from sidebar click to full conversation render |
| **Search response time** | <200ms | Time from query submission to results display |

### 8.2 Adoption Metrics (Post-Launch)

| Metric | Target (90-day) | Notes |
|--------|-----------------|-------|
| **GitHub stars** | 1,000+ | Open-source traction |
| **Downloads** | 5,000+ | Across all platforms |
| **Daily active users** | 500+ | Via opt-in anonymous ping (if implemented) |
| **Conversations per user per day** | 5+ | Indicates stickiness |
| **Retention (D7)** | >40% | Users returning after 7 days |

### 8.3 Quality Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **Crash rate** | <0.1% | Measured via error logs (if opted-in) |
| **P0 bugs open** | 0 | Critical bugs resolved within 48 hours |
| **Provider compatibility** | 100% | All configured providers work as documented |

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **API format changes** | Provider API breaks | Medium | Abstract provider interfaces. Version-pin API schemas. Monitor changelogs. |
| **Keychain access failures** | Can't store/retrieve keys | Low | Fallback to encrypted file storage with user warning. Detailed error messages. |
| **WebView inconsistencies** | UI bugs across platforms | Medium | Test on all three OS platforms. Use polyfills. CI matrix builds. |
| **Anthropic streaming format** | Different SSE format than OpenAI | Low (known) | Separate parser for Anthropic's format. Well-tested. |
| **Large conversation performance** | UI lag with 1000+ messages | Medium | Virtual scrolling for message list. Paginated message loading. |
| **SQLite corruption** | Data loss | Very Low | WAL mode. Regular integrity checks. Export as backup mechanism. |
| **Tauri 2.x stability** | Framework bugs | Low | Pin Tauri version. Maintain compatibility with stable releases. |
| **Rate limiting** | Provider rejects requests | Medium | Display rate limit errors clearly. Implement client-side backoff. Show retry estimates. |

---

## 10. Out of Scope

The following are explicitly **not** part of v1.0 or near-term plans:

- ❌ **Mobile apps** (iOS/Android)
- ❌ **Web version** (SaaS / hosted)
- ❌ **User accounts or authentication** (no login required)
- ❌ **Cloud sync** (conversations are local-only)
- ❌ **Agentic workflows** (tool use, function calling, multi-step agents)
- ❌ **Plugin/extension system**
- ❌ **Real-time collaboration** (multiplayer/shared conversations)
- ❌ **Voice input/output** (speech-to-text / text-to-speech)
- ❌ **Fine-tuning or model training** (purely an inference client)
- ❌ **LaTeX/math rendering** (handled in P2)
- ❌ **Internationalization** (English-only for v1)
- ❌ **End-to-end encryption for data at rest** (OS file permissions only for v1)

---

## 11. Release Criteria

### 11.1 MVP Launch Checklist

Before v1.0 can ship, **all** of the following must be true:

**Functionality:**

- [ ] All P0 features implemented and working on Windows, macOS, and Linux
- [ ] Chat works with OpenAI, Anthropic, and at least one OpenAI-compatible endpoint (Ollama)
- [ ] Streaming works reliably across all three provider types
- [ ] API keys are stored and retrieved from the OS keychain successfully
- [ ] Conversations persist across app restarts
- [ ] Markdown and code syntax highlighting render correctly

**Quality:**

- [ ] Zero known P0 bugs
- [ ] All P0 acceptance criteria verified
- [ ] Manual testing completed on all three platforms
- [ ] Performance targets met (startup <500ms, streaming overhead <50ms)
- [ ] Bundle size <15MB on all platforms

**Security:**

- [ ] API keys never written to disk in plaintext — verified via audit
- [ ] No telemetry or analytics code in the codebase
- [ ] CSP headers configured on the webview
- [ ] `cargo audit` and `bun audit` pass with no critical vulnerabilities

**Distribution:**

- [ ] Signed builds for Windows (.msi / .exe), macOS (.dmg), and Linux (.AppImage / .deb)
- [ ] GitHub release with binaries and checksums
- [ ] README with installation instructions, screenshots, and getting started guide
- [ ] LICENSE file (open source license TBD — likely MIT or Apache 2.0)

---

## Appendix A: Open Questions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Should we use Zustand, Jotai, or React Context for state management? | Open | — |
| 2 | Should the default send behavior be `Enter` or `Ctrl+Enter`? | Open | — |
| 3 | Should conversations store full message history in SQLite or use a separate file store for long conversations? | Open | Leaning SQLite for simplicity |
| 4 | Should the app auto-discover running Ollama instances, or require manual configuration? | Open | — |
| 5 | What open source license should we use? | Open | Leaning MIT |
| 6 | Should we ship a "Welcome" walkthrough or just a settings page on first launch? | Open | — |
| 7 | Should model pricing data be bundled or fetched from a public API? | Open | Leaning bundled with manual update |

---

## Appendix B: UI Wireframe Reference

### Main Chat View

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ GokChat                                    ⚙ ☀/🌙  ─ □ ✕ │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  🔍 Search   │              Chat: Rust Lifetimes             │
│              │              Claude 3.5 Sonnet                │
│  ▾ Today     │  ─────────────────────────────────────────── │
│    Chat 1    │                                               │
│    Chat 2 ◄──│  👤 You                            12:34 PM  │
│              │  Can you explain Rust lifetimes?              │
│  ▾ Yesterday │                                               │
│    Chat 3    │  🤖 Claude 3.5 Sonnet               12:34 PM │
│    Chat 4    │  Lifetimes in Rust are a way for the         │
│              │  compiler to track how long references        │
│  ▾ Last 7d   │  are valid...                                │
│    Chat 5    │                                               │
│              │  ```rust                          [📋 Copy]  │
│              │  fn longest<'a>(x: &'a str,                  │
│              │                 y: &'a str) -> &'a str {      │
│              │      if x.len() > y.len() { x }              │
│              │      else { y }                               │
│              │  }                                            │
│              │  ```                                          │
│              │                                 42 tokens     │
│              │                       [📋 Copy] [🔄 Regen]   │
│              │                                               │
│  ────────────│───────────────────────────────────────────────│
│  [+ New Chat]│  [Model: Claude 3.5 ▼]                       │
│              │  ┌───────────────────────────────────┐        │
│              │  │ Type a message...           [Send] │        │
│              │  └───────────────────────────────────┘        │
└──────────────┴───────────────────────────────────────────────┘
```

### Settings View

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Chat          Settings                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Providers                                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  🟢 OpenAI              API Key: sk-...****          │    │
│  │     Base URL: https://api.openai.com/v1   [Validate] │    │
│  │                                    [Edit] [Delete]   │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  🟢 Anthropic           API Key: sk-ant-...****      │    │
│  │                                   [Validate]         │    │
│  │                                    [Edit] [Delete]   │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  🟢 Ollama (local)      URL: http://localhost:11434  │    │
│  │                                   [Validate]         │    │
│  │                                    [Edit] [Delete]   │    │
│  └──────────────────────────────────────────────────────┘    │
│  [+ Add Provider]                                            │
│                                                              │
│  Appearance                                                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Theme:  ○ Light  ● Dark  ○ System                   │    │
│  │  Font Size:  [14px ▼]                                 │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Chat                                                        │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Send with:  ● Enter  ○ Ctrl+Enter                   │    │
│  │  Auto-title conversations:  [✓]                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  About                                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  GokChat v1.0.0                                       │    │
│  │  Built with Tauri 2.x + React 19 + Rust               │    │
│  │  github.com/gokchat/gokchat                           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> **Document Status:** This PRD is a living document. It will be updated as decisions are made on open questions and as the product evolves through development.
