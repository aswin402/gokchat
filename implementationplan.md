# GokChat — Implementation Plan

> **Cross-platform AI chat desktop app** — Tauri 2.x · React 19 · Bun · Tailwind CSS v4 · shadcn/ui
>
> Bring your own API keys. Chat with OpenAI, Anthropic, and any OpenAI-compatible provider (Ollama, Groq, OpenRouter, LM Studio, etc.)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Tauri Window                       │
│  ┌────────────┬───────────────────┬───────────────┐  │
│  │  Sidebar   │    Chat View      │  (Optional)   │  │
│  │            │                   │   Settings    │  │
│  │ Convos     │  Messages         │   Panel       │  │
│  │ Search     │  Streaming        │               │  │
│  │ New Chat   │  Markdown         │               │  │
│  │            │  Code Blocks      │               │  │
│  └────────────┴───────────────────┴───────────────┘  │
│                    React 19 + Zustand                 │
│  ─────────────── Tauri IPC (invoke + events) ──────── │
│                    Rust Backend                       │
│  ┌────────────┬───────────────┬───────────────────┐  │
│  │  Provider   │   Database    │    Keychain       │  │
│  │  Router     │   (SQLite)    │    (keyring)      │  │
│  │  + SSE      │   tauri-sql   │                   │  │
│  │  Streaming  │               │                   │  │
│  └────────────┴───────────────┴───────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand         |
| Backend   | Rust, Tauri 2.x, reqwest (streaming), keyring, SQLite             |
| Build     | Bun (package manager + bundler), Cargo (Rust)                     |
| Providers | OpenAI, Anthropic, OpenAI-compatible (Ollama, Groq, OpenRouter…) |

### Key Rust Crates

| Crate              | Purpose                           |
| ------------------- | --------------------------------- |
| `reqwest`           | HTTP client with SSE streaming    |
| `keyring`           | OS keychain for API key storage   |
| `serde` / `serde_json` | Serialization / deserialization |
| `tokio`             | Async runtime                     |
| `futures-util`      | Stream combinators for SSE        |
| `async-trait`       | Async trait methods               |
| `uuid`              | Unique IDs for conversations/msgs |
| `tauri-plugin-sql`  | SQLite via Tauri plugin           |
| `tauri-plugin-store`| Local settings persistence        |
| `chrono`            | Timestamps                        |

### Key Frontend Packages

| Package              | Purpose                          |
| -------------------- | -------------------------------- |
| `zustand`            | Lightweight state management     |
| `react-markdown`     | Markdown rendering               |
| `rehype-highlight`   | Syntax highlighting in code      |
| `remark-gfm`         | GitHub-flavored markdown         |
| `lucide-react`       | Icon set                         |
| `@tauri-apps/api`    | Tauri IPC bridge                 |
| `@tauri-apps/plugin-sql` | SQLite frontend bindings     |

---

## Phase 0: Project Scaffolding & Foundation (Day 1–2)

**Goal:** A running Tauri dev window with React 19, Tailwind v4, shadcn/ui, all Rust crates, and a SQLite database ready to go.

**Dependencies:** None — this is the starting phase.

**Estimated Time:** 1.5–2 days

---

### Task 0.1 — Scaffold Tauri + React + TypeScript project

**Commands:**
```bash
cd /home/aswin/programming/vscode/myProjects/ai_agent_tools/gokchat
bun create tauri-app . --template react-ts --manager bun
```

> If `bun create tauri-app` doesn't support `--template` flags, use the interactive mode or:
> ```bash
> bunx create-tauri-app . --template react-ts --manager bun --yes
> ```

**Expected outcome:** A directory structure with:
```
gokchat/
├── src/               # React frontend
│   ├── App.tsx
│   ├── main.tsx
│   ├── App.css
│   └── index.css
├── src-tauri/         # Rust backend
│   ├── src/
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Verification:** `bun run tauri dev` opens an empty window with React content.

---

### Task 0.2 — Configure Tailwind CSS v4

Tailwind v4 uses the new CSS-first configuration. No `tailwind.config.js` needed.

**Commands:**
```bash
bun add -D tailwindcss @tailwindcss/vite
```

**Files to modify:**

**`vite.config.ts`** — Add Tailwind plugin:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
});
```

**`src/index.css`** — Replace contents with:
```css
@import "tailwindcss";
```

**Verification:** Add a `<p class="text-blue-500">Hello</p>` in `App.tsx` — text should appear blue.

---

### Task 0.3 — Set up shadcn/ui

**Commands:**
```bash
# Initialize shadcn
bunx shadcn@latest init

# When prompted:
# - Style: Default
# - Base color: Neutral or Zinc
# - CSS variables: Yes
# - Path aliases configured
```

This will create:
- `components.json` — shadcn configuration
- `src/lib/utils.ts` — `cn()` utility
- Update `tsconfig.json` with path aliases

**Add initial base components:**
```bash
bunx shadcn@latest add button input textarea scroll-area dialog tabs separator avatar badge tooltip command dropdown-menu popover select switch label card sheet
```

**Expected outcome:** Components available in `src/components/ui/`. The `cn()` utility exists in `src/lib/utils.ts`.

**Verification:** Import and render a `<Button>` — it should display with proper shadcn styling.

---

### Task 0.4 — Set up project directory structure

Create the following directories:

```bash
# Frontend structure
mkdir -p src/components/chat
mkdir -p src/components/sidebar
mkdir -p src/components/settings
mkdir -p src/components/common
mkdir -p src/stores
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/providers

# Rust backend structure
mkdir -p src-tauri/src/commands
mkdir -p src-tauri/src/providers
mkdir -p src-tauri/src/db
mkdir -p src-tauri/src/models
mkdir -p src-tauri/migrations
```

**Target directory tree:**
```
src/
├── components/
│   ├── chat/              # MessageBubble, MessageInput, ChatView, CodeBlock
│   ├── sidebar/           # Sidebar, ConversationItem, SearchBar
│   ├── settings/          # SettingsModal, ProviderCard, ModelSelector
│   ├── common/            # ThemeToggle, AppShell, WelcomeScreen
│   └── ui/                # shadcn components (auto-generated)
├── stores/
│   ├── chatStore.ts       # Conversations, messages, streaming state
│   └── settingsStore.ts   # Theme, providers, models, preferences
├── lib/
│   ├── tauri.ts           # Type-safe IPC wrappers
│   ├── types.ts           # Shared TypeScript types
│   ├── utils.ts           # cn() and other utilities (created by shadcn)
│   └── constants.ts       # Provider defaults, model lists
├── hooks/
│   ├── useStreaming.ts     # Stream event listener hook
│   ├── useAutoScroll.ts   # Auto-scroll during streaming
│   └── useKeyboard.ts     # Keyboard shortcut hook
├── providers/
│   └── ThemeProvider.tsx   # Dark/light theme context
├── App.tsx
├── main.tsx
└── index.css

src-tauri/
├── src/
│   ├── commands/
│   │   ├── mod.rs         # Re-exports
│   │   ├── chat.rs        # send_message, stop_generation
│   │   ├── conversation.rs# CRUD for conversations
│   │   ├── message.rs     # save/get messages
│   │   └── keychain.rs    # API key management
│   ├── providers/
│   │   ├── mod.rs         # Re-exports + ProviderRouter
│   │   ├── traits.rs      # ChatProvider trait
│   │   ├── openai.rs      # OpenAI implementation
│   │   ├── anthropic.rs   # Anthropic implementation
│   │   └── compatible.rs  # OpenAI-compatible provider
│   ├── models/
│   │   ├── mod.rs         # Re-exports
│   │   ├── chat.rs        # ChatMessage, Role, StreamChunk
│   │   └── config.rs      # ChatConfig, ProviderConfig
│   ├── db/
│   │   ├── mod.rs         # Database initialization
│   │   └── migrations.rs  # Schema migrations
│   └── lib.rs             # Tauri app setup, command registration
├── Cargo.toml
├── tauri.conf.json
├── capabilities/
│   └── default.json
└── migrations/
    └── 001_initial.sql
```

**Verification:** All directories exist. No import errors when referencing them.

---

### Task 0.5 — Configure ESLint + Prettier

**Commands:**
```bash
bun add -D eslint prettier eslint-config-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Files to create:**

**`.prettierrc`**:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

**`eslint.config.js`** (flat config):
```js
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
```

**Add scripts to `package.json`:**
```json
{
  "scripts": {
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

**Verification:** `bun run lint` and `bun run format` run without errors.

---

### Task 0.6 — Initialize git repo

**Commands:**
```bash
git init
```

**Create `.gitignore`:**
```gitignore
# Dependencies
node_modules/
target/

# Build output
dist/
src-tauri/target/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Tauri
src-tauri/gen/
WixTools/
```

**Initial commit:**
```bash
git add .
git commit -m "chore: initial scaffold — Tauri 2.x + React 19 + Tailwind v4 + shadcn/ui"
```

---

### Task 0.7 — Add Rust dependencies to Cargo.toml

**File:** `src-tauri/Cargo.toml`

Add these dependencies under `[dependencies]`:
```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-store = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["stream", "json"] }
keyring = { version = "3", features = ["apple-native", "windows-native", "sync-secret-service"] }
tokio = { version = "1", features = ["full"] }
futures-util = "0.3"
async-trait = "0.1"
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "2"
log = "0.4"
```

**Verification:** `cd src-tauri && cargo check` compiles without errors.

> **Risk:** `keyring` crate may need system libraries on Linux (`libsecret-1-dev`). Install with:
> ```bash
> sudo apt install libsecret-1-dev  # Debian/Ubuntu
> ```

---

### Task 0.8 — Add frontend dependencies

**Commands:**
```bash
# State management
bun add zustand

# Markdown rendering
bun add react-markdown rehype-highlight remark-gfm

# Icons
bun add lucide-react

# Tauri plugins (frontend bindings)
bun add @tauri-apps/api @tauri-apps/plugin-sql @tauri-apps/plugin-store

# Syntax highlighting theme
bun add highlight.js
```

**Verification:** `bun install` succeeds. All packages in `node_modules/`.

---

### Task 0.9 — Configure Tauri capabilities/permissions

**File:** `src-tauri/capabilities/default.json`

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for GokChat",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:window:default",
    "core:window:allow-close",
    "core:window:allow-set-title",
    "core:window:allow-set-size",
    "core:window:allow-center",
    "opener:default",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    "store:default"
  ]
}
```

**File:** `src-tauri/tauri.conf.json` — Ensure the app metadata:
```json
{
  "productName": "GokChat",
  "version": "0.1.0",
  "identifier": "com.gokchat.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "bun run dev",
    "beforeBuildCommand": "bun run build"
  },
  "app": {
    "windows": [
      {
        "title": "GokChat",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "center": true,
        "decorations": true,
        "resizable": true
      }
    ],
    "security": {
      "csp": null
    }
  }
}
```

**Verification:** App launches without permission errors.

---

### Task 0.10 — Create SQLite database schema and migration system

**File:** `src-tauri/migrations/001_initial.sql`
```sql
-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    system_prompt TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_archived INTEGER NOT NULL DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    provider TEXT,
    tokens_used INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);
```

**File:** `src-tauri/src/db/mod.rs`
```rust
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
```

**File:** `src-tauri/src/db/migrations.rs` — reserved for future migration helpers.

**Register in `lib.rs`:**
```rust
mod db;

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:gokchat.db", db::get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Verification:** Launch app → check that `gokchat.db` is created in the Tauri data directory. No migration errors in console.

---

### Task 0.11 — Test that `bun run tauri dev` launches the app

**Commands:**
```bash
bun run tauri dev
```

**Expected outcome:**
- Rust compiles without errors
- Frontend dev server starts on port 1420
- A native window opens titled "GokChat"
- React app renders inside the window
- No console errors related to permissions or plugins
- SQLite database file created

**Verification checklist:**
- [ ] Window opens
- [ ] React content visible
- [ ] Tailwind styles working
- [ ] shadcn Button renders correctly
- [ ] No Rust compilation errors
- [ ] No Tauri plugin errors

---

## Phase 1: Rust Backend Core (Day 3–5)

**Goal:** All Rust backend infrastructure — types, provider implementations, keychain management, database commands, streaming — fully implemented and testable.

**Dependencies:** Phase 0 complete (project compiles, SQLite initialized).

**Estimated Time:** 2.5–3 days

---

### Task 1.1 — Define core types

**File:** `src-tauri/src/models/chat.rs`

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Assistant,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub conversation_id: String,
    pub role: Role,
    pub content: String,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub tokens_used: Option<i64>,
    pub created_at: String,
}

impl ChatMessage {
    pub fn new(conversation_id: &str, role: Role, content: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            conversation_id: conversation_id.to_string(),
            role,
            content: content.to_string(),
            model: None,
            provider: None,
            tokens_used: None,
            created_at: Utc::now().to_rfc3339(),
        }
    }
}

/// Emitted to the frontend during streaming
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum StreamEvent {
    /// A chunk of text content
    Chunk { content: String },
    /// Stream completed successfully
    Done {
        full_content: String,
        tokens_used: Option<i64>,
    },
    /// An error occurred
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub provider: String,
    pub model: String,
    pub system_prompt: String,
    pub created_at: String,
    pub updated_at: String,
    pub is_archived: bool,
}

impl Conversation {
    pub fn new(provider: &str, model: &str) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            title: "New Chat".to_string(),
            provider: provider.to_string(),
            model: model.to_string(),
            system_prompt: String::new(),
            created_at: now.clone(),
            updated_at: now,
            is_archived: false,
        }
    }
}
```

**File:** `src-tauri/src/models/config.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ProviderType {
    Openai,
    Anthropic,
    OpenaiCompatible,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatConfig {
    pub provider: ProviderType,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
    pub system_prompt: Option<String>,
    pub base_url: Option<String>,        // For custom providers
    pub api_key_id: Option<String>,      // Keychain identifier
}

impl Default for ChatConfig {
    fn default() -> Self {
        Self {
            provider: ProviderType::Openai,
            model: "gpt-4o-mini".to_string(),
            temperature: 0.7,
            max_tokens: None,
            system_prompt: None,
            base_url: None,
            api_key_id: None,
        }
    }
}

/// Sent from frontend when initiating a chat
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub conversation_id: String,
    pub content: String,
    pub provider: ProviderType,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
    pub system_prompt: Option<String>,
    pub base_url: Option<String>,
    pub messages: Vec<MessagePayload>,  // Conversation history
}

/// Simplified message for API requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagePayload {
    pub role: String,
    pub content: String,
}
```

**File:** `src-tauri/src/models/mod.rs`
```rust
pub mod chat;
pub mod config;

pub use chat::*;
pub use config::*;
```

**Testing:** Ensure `cargo check` passes with all type definitions.

---

### Task 1.2 — Implement ChatProvider trait

**File:** `src-tauri/src/providers/traits.rs`

```rust
use async_trait::async_trait;
use futures_util::stream::BoxStream;
use crate::models::{MessagePayload, StreamEvent};

/// Core trait for all AI providers
#[async_trait]
pub trait ChatProvider: Send + Sync {
    /// Send a message and return a stream of events
    async fn send_message(
        &self,
        api_key: &str,
        model: &str,
        messages: Vec<MessagePayload>,
        system_prompt: Option<String>,
        temperature: f32,
        max_tokens: Option<u32>,
    ) -> Result<BoxStream<'static, StreamEvent>, String>;

    /// Validate that the API key works
    async fn validate_key(&self, api_key: &str) -> Result<bool, String>;

    /// List available models (if the API supports it)
    async fn list_models(&self, api_key: &str) -> Result<Vec<String>, String>;

    /// Get the provider name
    fn name(&self) -> &str;
}
```

**Key design decision:** We return a `BoxStream<StreamEvent>` rather than managing the stream internally. This lets the command layer handle event emission to the frontend via Tauri events.

---

### Task 1.3 — Implement OpenAIProvider

**File:** `src-tauri/src/providers/openai.rs`

Key implementation details:
- **Base URL:** `https://api.openai.com/v1`
- **Auth header:** `Authorization: Bearer {api_key}`
- **Endpoint:** `POST /chat/completions`
- **Streaming:** Set `"stream": true` in request body
- **SSE parsing:** Parse `data: {...}` lines, watch for `data: [DONE]`
- **System prompt:** Include as a message with `"role": "system"` at the start

```rust
use async_trait::async_trait;
use futures_util::{stream, StreamExt, stream::BoxStream};
use reqwest::Client;
use crate::models::{MessagePayload, StreamEvent};
use super::traits::ChatProvider;

pub struct OpenAIProvider {
    client: Client,
    base_url: String,
}

impl OpenAIProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: "https://api.openai.com/v1".to_string(),
        }
    }
}

#[async_trait]
impl ChatProvider for OpenAIProvider {
    async fn send_message(
        &self,
        api_key: &str,
        model: &str,
        messages: Vec<MessagePayload>,
        system_prompt: Option<String>,
        temperature: f32,
        max_tokens: Option<u32>,
    ) -> Result<BoxStream<'static, StreamEvent>, String> {
        // Build messages array with optional system prompt prepended
        let mut api_messages: Vec<serde_json::Value> = Vec::new();

        if let Some(sys) = &system_prompt {
            if !sys.is_empty() {
                api_messages.push(serde_json::json!({
                    "role": "system",
                    "content": sys
                }));
            }
        }

        for msg in &messages {
            api_messages.push(serde_json::json!({
                "role": msg.role,
                "content": msg.content
            }));
        }

        let mut body = serde_json::json!({
            "model": model,
            "messages": api_messages,
            "stream": true,
            "temperature": temperature,
        });

        if let Some(max) = max_tokens {
            body["max_tokens"] = serde_json::json!(max);
        }

        let response = self.client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_body = response.text().await.unwrap_or_default();
            return Err(format!("API error {}: {}", status, error_body));
        }

        // Parse the SSE stream
        let byte_stream = response.bytes_stream();
        let full_content = std::sync::Arc::new(tokio::sync::Mutex::new(String::new()));
        let full_content_clone = full_content.clone();

        let event_stream = byte_stream
            .map(move |chunk_result| {
                let full_content = full_content_clone.clone();
                async move {
                    match chunk_result {
                        Ok(bytes) => {
                            let text = String::from_utf8_lossy(&bytes).to_string();
                            let mut events = Vec::new();

                            for line in text.lines() {
                                let line = line.trim();
                                if line.is_empty() || line.starts_with(':') {
                                    continue;
                                }
                                if let Some(data) = line.strip_prefix("data: ") {
                                    if data == "[DONE]" {
                                        let content = full_content.lock().await.clone();
                                        events.push(StreamEvent::Done {
                                            full_content: content,
                                            tokens_used: None,
                                        });
                                    } else if let Ok(parsed) =
                                        serde_json::from_str::<serde_json::Value>(data)
                                    {
                                        if let Some(content) = parsed["choices"][0]["delta"]["content"]
                                            .as_str()
                                        {
                                            if !content.is_empty() {
                                                full_content.lock().await.push_str(content);
                                                events.push(StreamEvent::Chunk {
                                                    content: content.to_string(),
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                            stream::iter(events)
                        }
                        Err(e) => {
                            stream::iter(vec![StreamEvent::Error {
                                message: format!("Stream error: {}", e),
                            }])
                        }
                    }
                }
            })
            .buffer_unordered(1)
            .flat_map(|s| s);

        Ok(Box::pin(event_stream))
    }

    async fn validate_key(&self, api_key: &str) -> Result<bool, String> {
        let response = self.client
            .get(format!("{}/models", self.base_url))
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| format!("Validation failed: {}", e))?;

        Ok(response.status().is_success())
    }

    async fn list_models(&self, api_key: &str) -> Result<Vec<String>, String> {
        let response = self.client
            .get(format!("{}/models", self.base_url))
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| format!("Failed to list models: {}", e))?;

        let body: serde_json::Value = response.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        let models: Vec<String> = body["data"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|m| m["id"].as_str().map(String::from))
            .filter(|id| id.starts_with("gpt-") || id.starts_with("o"))
            .collect();

        Ok(models)
    }

    fn name(&self) -> &str {
        "openai"
    }
}
```

**Testing approach:** Create a test that sends a simple message with a real API key (gated behind a feature flag or env var).

---

### Task 1.4 — Implement AnthropicProvider

**File:** `src-tauri/src/providers/anthropic.rs`

Key differences from OpenAI:
- **Base URL:** `https://api.anthropic.com/v1`
- **Auth header:** `x-api-key: {api_key}` (NOT Bearer token)
- **Required header:** `anthropic-version: 2023-06-01`
- **System prompt:** Sent as a top-level `"system"` field, NOT as a message
- **SSE events:** Different format — `event: content_block_delta` with `delta.text`
- **Endpoint:** `POST /messages`

```rust
// Key structural differences to implement:
// 1. Request body structure:
//    {
//      "model": "claude-sonnet-4-20250514",
//      "system": "...",          // <-- top-level, not in messages
//      "messages": [...],        // Only user/assistant messages
//      "max_tokens": 4096,       // REQUIRED for Anthropic
//      "stream": true
//    }
//
// 2. SSE event types:
//    - message_start
//    - content_block_start
//    - content_block_delta → delta.type == "text_delta" → delta.text
//    - content_block_stop
//    - message_delta → usage info
//    - message_stop
//
// 3. Response parsing:
//    event: content_block_delta
//    data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}
```

**Critical:** `max_tokens` is required by Anthropic. Default to `4096` if not specified.

**Model validation:** Filter to models starting with `claude-`.

---

### Task 1.5 — Implement OpenAICompatibleProvider

**File:** `src-tauri/src/providers/compatible.rs`

This is essentially `OpenAIProvider` with a configurable `base_url`. Used for:
- **Ollama:** `http://localhost:11434/v1`
- **Groq:** `https://api.groq.com/openai/v1`
- **OpenRouter:** `https://openrouter.ai/api/v1`
- **LM Studio:** `http://localhost:1234/v1`

```rust
pub struct OpenAICompatibleProvider {
    client: Client,
    base_url: String,
    provider_name: String,
}

impl OpenAICompatibleProvider {
    pub fn new(base_url: &str, name: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            provider_name: name.to_string(),
        }
    }
}
```

The `ChatProvider` implementation reuses the same SSE parsing logic as OpenAI, since these providers follow the OpenAI API format.

**Model discovery:** `GET /models` — some providers (Ollama) always return models; others (Groq) require an API key.

---

### Task 1.6 — Implement keychain commands

**File:** `src-tauri/src/commands/keychain.rs`

```rust
use keyring::Entry;

const SERVICE_NAME: &str = "gokchat";

/// Store an API key in the OS keychain
#[tauri::command]
pub async fn store_api_key(provider: String, api_key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &provider)
        .map_err(|e| format!("Keyring error: {}", e))?;
    entry.set_password(&api_key)
        .map_err(|e| format!("Failed to store key: {}", e))?;
    Ok(())
}

/// Retrieve an API key from the OS keychain
#[tauri::command]
pub async fn get_api_key(provider: String) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, &provider)
        .map_err(|e| format!("Keyring error: {}", e))?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to get key: {}", e)),
    }
}

/// Delete an API key from the OS keychain
#[tauri::command]
pub async fn delete_api_key(provider: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &provider)
        .map_err(|e| format!("Keyring error: {}", e))?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(format!("Failed to delete key: {}", e)),
    }
}

/// Check if an API key exists (without revealing it)
#[tauri::command]
pub async fn has_api_key(provider: String) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, &provider)
        .map_err(|e| format!("Keyring error: {}", e))?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check key: {}", e)),
    }
}

/// Validate an API key by making a test request
#[tauri::command]
pub async fn validate_api_key(provider: String, api_key: String) -> Result<bool, String> {
    match provider.as_str() {
        "openai" => {
            let p = crate::providers::openai::OpenAIProvider::new();
            p.validate_key(&api_key).await
        }
        "anthropic" => {
            let p = crate::providers::anthropic::AnthropicProvider::new();
            p.validate_key(&api_key).await
        }
        _ => {
            // For custom providers, just check if we can reach the base URL
            Ok(true)
        }
    }
}
```

**Security note:** API keys are stored in the OS-native keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service/GNOME Keyring). They never touch the filesystem as plaintext.

---

### Task 1.7 — Implement chat commands (streaming)

**File:** `src-tauri/src/commands/chat.rs`

This is the most complex command — it must:
1. Look up the API key from the keychain
2. Construct the provider instance
3. Call `send_message` to get a stream
4. Iterate the stream, emitting Tauri events for each chunk
5. Support cancellation via a shared `AtomicBool`

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use futures_util::StreamExt;
use tokio::sync::Mutex;

use crate::models::{SendMessageRequest, StreamEvent, ProviderType};
use crate::providers::{openai::OpenAIProvider, anthropic::AnthropicProvider, compatible::OpenAICompatibleProvider, traits::ChatProvider};

/// Shared state to control generation cancellation
pub struct GenerationState {
    pub is_generating: Arc<AtomicBool>,
}

#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    state: State<'_, GenerationState>,
    request: SendMessageRequest,
) -> Result<(), String> {
    // 1. Get API key
    let api_key = crate::commands::keychain::get_api_key(
        match request.provider {
            ProviderType::Openai => "openai".to_string(),
            ProviderType::Anthropic => "anthropic".to_string(),
            ProviderType::OpenaiCompatible => {
                request.base_url.clone().unwrap_or("custom".to_string())
            }
        }
    ).await?
    .ok_or("No API key configured for this provider")?;

    // 2. Build provider
    let provider: Box<dyn ChatProvider> = match request.provider {
        ProviderType::Openai => Box::new(OpenAIProvider::new()),
        ProviderType::Anthropic => Box::new(AnthropicProvider::new()),
        ProviderType::OpenaiCompatible => {
            let base_url = request.base_url.as_deref()
                .ok_or("Base URL required for compatible provider")?;
            Box::new(OpenAICompatibleProvider::new(base_url, "custom"))
        }
    };

    // 3. Start streaming
    state.is_generating.store(true, Ordering::SeqCst);

    let mut stream = provider.send_message(
        &api_key,
        &request.model,
        request.messages,
        request.system_prompt,
        request.temperature,
        request.max_tokens,
    ).await?;

    // 4. Emit events to frontend
    let conv_id = request.conversation_id.clone();
    let is_generating = state.is_generating.clone();

    while let Some(event) = stream.next().await {
        // Check for cancellation
        if !is_generating.load(Ordering::SeqCst) {
            let _ = app.emit(&format!("stream_{}", conv_id), StreamEvent::Done {
                full_content: String::new(),
                tokens_used: None,
            });
            break;
        }

        let _ = app.emit(&format!("stream_{}", conv_id), &event);

        if matches!(event, StreamEvent::Done { .. } | StreamEvent::Error { .. }) {
            break;
        }
    }

    state.is_generating.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn stop_generation(
    state: State<'_, GenerationState>,
) -> Result<(), String> {
    state.is_generating.store(false, Ordering::SeqCst);
    Ok(())
}
```

**Event naming convention:** `stream_{conversation_id}` — so the frontend can listen per-conversation.

---

### Task 1.8 — Implement conversation commands

**File:** `src-tauri/src/commands/conversation.rs`

```rust
use tauri::State;
use crate::models::Conversation;

// Note: Uses tauri-plugin-sql for database access
// The frontend will call sql:execute and sql:select directly for simple CRUD,
// or we wrap them in Tauri commands for complex logic.

#[tauri::command]
pub async fn create_conversation(
    provider: String,
    model: String,
) -> Result<Conversation, String> {
    let conv = Conversation::new(&provider, &model);
    Ok(conv)
}

#[tauri::command]
pub async fn update_conversation_title(
    id: String,
    title: String,
) -> Result<(), String> {
    // This will be called after the frontend executes the SQL update
    Ok(())
}
```

**Design note:** For simple CRUD, it may be cleaner to use `@tauri-apps/plugin-sql` directly from the frontend, calling `Database.get().execute()` and `Database.get().select()`. Reserve Tauri commands for operations that need Rust-side logic (e.g., streaming, keychain access).

---

### Task 1.9 — Implement message commands

**File:** `src-tauri/src/commands/message.rs`

Similar to conversation commands — straightforward CRUD. The frontend can use the SQL plugin directly for most operations.

---

### Task 1.10 — Set up SQLite with tauri-plugin-sql

Already configured in Task 0.10. This task is about verifying the database works end-to-end:

1. App starts → migrations run → tables created
2. Insert a test row via Tauri dev console
3. Query it back

**Verification:** Open the SQLite file with `sqlite3` CLI and confirm tables exist:
```bash
sqlite3 ~/.local/share/com.gokchat.app/gokchat.db ".tables"
# Should show: conversations  messages
```

---

### Task 1.11 — Register all commands and plugins in lib.rs

**File:** `src-tauri/src/lib.rs`

```rust
mod commands;
mod db;
mod models;
mod providers;

use commands::chat::GenerationState;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:gokchat.db", db::get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(GenerationState {
            is_generating: Arc::new(AtomicBool::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            commands::keychain::store_api_key,
            commands::keychain::get_api_key,
            commands::keychain::delete_api_key,
            commands::keychain::has_api_key,
            commands::keychain::validate_api_key,
            commands::chat::send_message,
            commands::chat::stop_generation,
            commands::conversation::create_conversation,
            commands::conversation::update_conversation_title,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**File:** `src-tauri/src/commands/mod.rs`
```rust
pub mod chat;
pub mod conversation;
pub mod keychain;
pub mod message;
```

**File:** `src-tauri/src/providers/mod.rs`
```rust
pub mod anthropic;
pub mod compatible;
pub mod openai;
pub mod traits;
```

---

### Task 1.12 — Test each command via Tauri dev console

Run `bun run tauri dev` and test in the browser console (Ctrl+Shift+I):

```js
// Test keychain
await window.__TAURI__.core.invoke('store_api_key', { provider: 'openai', apiKey: 'test-key' });
const key = await window.__TAURI__.core.invoke('get_api_key', { provider: 'openai' });
console.log('Got key:', key);

// Test conversation creation
const conv = await window.__TAURI__.core.invoke('create_conversation', {
    provider: 'openai',
    model: 'gpt-4o-mini'
});
console.log('Created conversation:', conv);
```

**Verification:**
- [ ] Keychain store/get/delete works
- [ ] Conversation CRUD works
- [ ] Streaming works with a real API key
- [ ] Stop generation cancels the stream
- [ ] Error handling returns readable messages

**Risk factors:**
- **Keyring on Linux:** Requires a running Secret Service (GNOME Keyring or KeePassXC). In headless/WSL environments, consider falling back to `tauri-plugin-store` with encryption.
- **SSE parsing edge cases:** Some providers send partial JSON lines or buffer differently. The parser must handle multi-line chunks and partial data.

---

## Phase 2: Frontend Foundation (Day 5–7)

**Goal:** A functional app shell with sidebar, chat view, state management, and Tauri IPC wiring — ready for the chat experience.

**Dependencies:** Phase 1 complete (commands registered, types defined).

**Estimated Time:** 2–2.5 days

---

### Task 2.1 — Create Zustand stores

**File:** `src/stores/chatStore.ts`

```typescript
import { create } from "zustand";
import type { Message, Conversation } from "@/lib/types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // keyed by conversation ID
  isStreaming: boolean;
  streamingContent: string;

  // Actions
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  appendStreamChunk: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  resetStreamingContent: () => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
}
```

**File:** `src/stores/settingsStore.ts`

```typescript
import { create } from "zustand";

interface SettingsState {
  theme: "light" | "dark" | "system";
  fontSize: "sm" | "md" | "lg";
  defaultProvider: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number | null;
  configuredProviders: string[]; // providers with API keys set

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  setFontSize: (size: "sm" | "md" | "lg") => void;
  setDefaultProvider: (provider: string) => void;
  setDefaultModel: (model: string) => void;
}
```

---

### Task 2.2 — Create Tauri IPC wrapper functions

**File:** `src/lib/tauri.ts`

Type-safe wrappers around `invoke()` and `listen()`:

```typescript
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Conversation, StreamEvent, SendMessageRequest } from "./types";

// Keychain commands
export const storeApiKey = (provider: string, apiKey: string) =>
  invoke<void>("store_api_key", { provider, apiKey });

export const getApiKey = (provider: string) =>
  invoke<string | null>("get_api_key", { provider });

export const deleteApiKey = (provider: string) =>
  invoke<void>("delete_api_key", { provider });

export const hasApiKey = (provider: string) =>
  invoke<boolean>("has_api_key", { provider });

export const validateApiKey = (provider: string, apiKey: string) =>
  invoke<boolean>("validate_api_key", { provider, apiKey });

// Chat commands
export const sendMessage = (request: SendMessageRequest) =>
  invoke<void>("send_message", { request });

export const stopGeneration = () =>
  invoke<void>("stop_generation");

// Stream listener
export const onStreamEvent = (
  conversationId: string,
  callback: (event: StreamEvent) => void
): Promise<UnlistenFn> =>
  listen<StreamEvent>(`stream_${conversationId}`, (e) => callback(e.payload));

// Conversation commands
export const createConversation = (provider: string, model: string) =>
  invoke<Conversation>("create_conversation", { provider, model });
```

---

### Task 2.3 — Create shared types

**File:** `src/lib/types.ts`

Mirror Rust types in TypeScript. These must match exactly.

```typescript
export type Role = "user" | "assistant" | "system";

export type ProviderType = "openai" | "anthropic" | "openai_compatible";

export interface Message {
  id: string;
  conversation_id: string;
  role: Role;
  content: string;
  model?: string;
  provider?: string;
  tokens_used?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export type StreamEvent =
  | { type: "Chunk"; data: { content: string } }
  | { type: "Done"; data: { full_content: string; tokens_used?: number } }
  | { type: "Error"; data: { message: string } };

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  provider: ProviderType;
  model: string;
  temperature: number;
  max_tokens?: number;
  system_prompt?: string;
  base_url?: string;
  messages: MessagePayload[];
}

export interface MessagePayload {
  role: string;
  content: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl?: string;
  models: string[];
  isConfigured: boolean;
}
```

---

### Task 2.4 — Build the app shell layout

**File:** `src/App.tsx`

3-panel layout: sidebar (fixed width) + chat (flex grow) + optional settings panel.

```tsx
// Layout structure:
// ┌───────────┬──────────────────────────┐
// │  Sidebar  │       Chat View          │
// │  250px    │       flex-1             │
// │           │                          │
// │  Convos   │  Messages                │
// │  New Chat │  Input                   │
// │           │                          │
// └───────────┴──────────────────────────┘
```

Use Tailwind's `flex`, `h-screen`, `overflow-hidden` for the shell. The sidebar should be resizable or collapsible.

---

### Task 2.5–2.7 — Sidebar components

Build `Sidebar`, `ConversationItem`, and New Conversation button.

**Components:**
- `src/components/sidebar/Sidebar.tsx` — Main sidebar container with shadcn `ScrollArea`
- `src/components/sidebar/ConversationItem.tsx` — Single conversation row (title, date, delete button on hover)
- New conversation button at the top of the sidebar

**Behavior:**
- Conversations sorted by `updated_at` descending
- Click to switch active conversation
- Hover to reveal delete/rename actions
- Active conversation highlighted with accent color

---

### Task 2.8 — Implement basic chat view

**File:** `src/components/chat/ChatView.tsx`

```tsx
// Structure:
// ┌────────────────────────────┐
// │  Header (model name)       │
// ├────────────────────────────┤
// │                            │
// │  Message List              │
// │  (scrollable)              │
// │                            │
// ├────────────────────────────┤
// │  Message Input             │
// └────────────────────────────┘
```

---

### Task 2.9 — Connect sidebar to chatStore

Wire up:
- Loading conversations from SQLite on app start
- Creating new conversations
- Switching active conversation → loading its messages
- Deleting conversations

---

### Task 2.10 — Dark/light theme setup

**File:** `src/providers/ThemeProvider.tsx`

Use the `class` strategy (add `dark` class to `<html>`). Integrate with `settingsStore`.

```css
/* In index.css, after @import "tailwindcss" */
@custom-variant dark (&:is(.dark *));
```

shadcn/ui components already support dark mode via CSS variables. Ensure the CSS variables are properly set for both themes.

**Verification:**
- [ ] Dark mode: dark backgrounds, light text
- [ ] Light mode: light backgrounds, dark text
- [ ] Toggle switches instantly without flash

---

## Phase 3: Chat Experience (Day 7–10)

**Goal:** A fully functional chat interface with streaming, markdown rendering, code blocks, and error handling.

**Dependencies:** Phase 2 complete (app shell, stores, IPC wiring).

**Estimated Time:** 3 days

---

### Task 3.1 — Build MessageBubble component

**File:** `src/components/chat/MessageBubble.tsx`

Two visual styles:
- **User messages:** Right-aligned (or left with distinct color), subtle background
- **Assistant messages:** Left-aligned, different background, includes model badge

Display metadata: timestamp, model name, token count (if available).

Include action buttons on hover: Copy, Edit (user only), Regenerate (assistant only).

---

### Task 3.2 — Build MessageInput component

**File:** `src/components/chat/MessageInput.tsx`

- Expandable `<textarea>` (auto-grows with content, max height)
- Send button (becomes Stop button during streaming)
- Model selector dropdown (inline or above input)
- `Ctrl+Enter` or `Enter` to send (configurable)
- Disabled state when streaming

---

### Task 3.3 — Implement streaming display

**File:** `src/hooks/useStreaming.ts`

```typescript
import { useEffect, useRef } from "react";
import { onStreamEvent } from "@/lib/tauri";
import { useChatStore } from "@/stores/chatStore";
import type { StreamEvent } from "@/lib/types";

export function useStreaming(conversationId: string | null) {
  const unlistenRef = useRef<(() => void) | null>(null);
  const { appendStreamChunk, setStreaming, addMessage } = useChatStore();

  useEffect(() => {
    if (!conversationId) return;

    const setup = async () => {
      // Clean up previous listener
      unlistenRef.current?.();

      unlistenRef.current = await onStreamEvent(conversationId, (event) => {
        switch (event.type) {
          case "Chunk":
            appendStreamChunk(event.data.content);
            break;
          case "Done":
            // Save complete message to store and DB
            setStreaming(false);
            break;
          case "Error":
            setStreaming(false);
            // Show error toast
            break;
        }
      });
    };

    setup();

    return () => {
      unlistenRef.current?.();
    };
  }, [conversationId]);
}
```

**Key behavior:** During streaming, the assistant message is rendered from `streamingContent` in the store. When `Done` is received, the full content replaces the streaming content and is persisted to SQLite.

---

### Task 3.4 — Implement MarkdownRenderer

**File:** `src/components/chat/MarkdownRenderer.tsx`

```tsx
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          if (!inline && match) {
            return (
              <CodeBlock
                language={match[1]}
                code={String(children).replace(/\n$/, "")}
              />
            );
          }
          return <code className={className} {...props}>{children}</code>;
        },
        // Custom renderers for tables, links, etc.
      }}
    />
  );
}
```

---

### Task 3.5 — Build CodeBlock component

**File:** `src/components/chat/CodeBlock.tsx`

Features:
- Language label in top bar
- Copy button with success feedback (checkmark animation)
- Syntax highlighting via highlight.js theme
- Horizontal scroll for long lines
- Dark background regardless of theme

---

### Task 3.6 — StreamingIndicator

**File:** `src/components/chat/StreamingIndicator.tsx`

Animated blinking cursor or three-dot animation shown at the end of streaming content.

---

### Task 3.7 — Connect chat to send_message command

Wire up the full flow:
1. User types message → presses Send
2. User message saved to store and DB
3. `sendMessage()` IPC called with conversation history
4. Stream listener updates UI in real-time
5. On completion, assistant message saved to store and DB

---

### Task 3.8 — Stop generation button

When streaming is active:
- Send button becomes a Stop button (square icon)
- Clicking calls `stopGeneration()` IPC command
- Partial response is saved as the assistant message

---

### Task 3.9 — Message copy functionality

Click to copy the full message content to clipboard. Use `navigator.clipboard.writeText()`.

---

### Task 3.10 — Auto-scroll during streaming

**File:** `src/hooks/useAutoScroll.ts`

- Auto-scroll to bottom as new chunks arrive
- Stop auto-scrolling if user manually scrolls up
- Resume auto-scrolling if user scrolls back to bottom
- Smooth scrolling behavior

---

### Task 3.11 — Conversation auto-titling

After the first assistant response, generate a title:
- **Option A:** Use the first ~50 chars of the user's first message
- **Option B:** Make a separate API call to generate a title (e.g., "Summarize this conversation in 5 words")

Start with Option A for simplicity, implement Option B as a Phase 5 enhancement.

---

### Task 3.12 — Error handling

Handle and display:
- **Network errors:** "Failed to connect. Check your internet connection."
- **Invalid API key:** "API key is invalid or expired. Update it in Settings."
- **Rate limits:** "Rate limit exceeded. Please wait before sending another message."
- **Model not found:** "Model X is not available. Select a different model."
- **Stream interrupted:** "Response was interrupted. Try regenerating."

Display errors inline in the chat as a system message with error styling.

**Verification for Phase 3:**
- [ ] Send a message → see streaming response appear word by word
- [ ] Markdown renders correctly (headers, lists, bold, italic, links)
- [ ] Code blocks have syntax highlighting and copy button
- [ ] Stop button cancels mid-stream
- [ ] Scroll to bottom works during streaming
- [ ] Error messages display correctly
- [ ] Conversation title updates after first message

---

## Phase 4: Settings & Provider Configuration (Day 10–12)

**Goal:** Complete settings interface for managing API keys, providers, models, and app preferences.

**Dependencies:** Phase 3 complete (chat works end-to-end).

**Estimated Time:** 2–2.5 days

---

### Task 4.1 — Build SettingsModal

**File:** `src/components/settings/SettingsModal.tsx`

Use shadcn `Dialog` + `Tabs`:
- **API Keys** tab — manage provider keys
- **Providers** tab — configure custom endpoints
- **Appearance** tab — theme, font size, density
- **Data** tab — export, clear, storage info

Full-screen modal or slide-out sheet on mobile-like width.

---

### Task 4.2 — Build ProviderCard components

**File:** `src/components/settings/ProviderCard.tsx`

For each provider (OpenAI, Anthropic, Custom):
- Provider logo/icon
- Status indicator (configured ✅ / not configured ⚠️)
- API key input (masked by default, toggle to reveal)
- Validate button with loading spinner
- Save / Delete key buttons
- Default model selector

---

### Task 4.3 — API key input flow

1. User enters API key in masked input
2. Clicks "Validate" → spinner appears
3. `validate_api_key` IPC called → test request to provider
4. Success → green checkmark, "Save" button enabled
5. Error → red X with error message
6. Save → `store_api_key` IPC → key stored in OS keychain
7. Input cleared (key is now safely stored)

---

### Task 4.4 — Key validation UI

Animated transitions between states:
- **Idle:** Input + "Validate" button
- **Validating:** Input disabled + spinner
- **Valid:** Green checkmark + "Save" button
- **Invalid:** Red X + error message + "Retry" button

---

### Task 4.5 — Provider Settings tab

Configure per-provider:
- Custom base URL (for OpenAI-compatible providers)
- Default model
- Temperature slider (0.0–2.0)
- Max tokens input
- System prompt textarea

**Preset buttons** for common providers:
- Ollama: `http://localhost:11434/v1`
- Groq: `https://api.groq.com/openai/v1`
- OpenRouter: `https://openrouter.ai/api/v1`
- LM Studio: `http://localhost:1234/v1`

---

### Task 4.6 — ModelSelector component

**File:** `src/components/settings/ModelSelector.tsx`

Use shadcn `Command` (combobox) with:
- Search/filter functionality
- Grouped by provider
- "Fetch models" button to pull from API
- Manual model entry for unlisted models

Default model lists:
- **OpenAI:** gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1, o1-mini
- **Anthropic:** claude-sonnet-4-20250514, claude-3-5-sonnet, claude-3-haiku, claude-3-opus
- **Custom:** Fetched from `/models` endpoint

---

### Task 4.7 — Appearance tab

- Theme toggle: Light / Dark / System
- Font size: Small / Medium / Large
- Message density: Comfortable / Compact
- Code theme selector (for syntax highlighting)

---

### Task 4.8 — Data tab

- Export all conversations (JSON / Markdown)
- Clear all history (with confirmation dialog)
- Storage usage display (DB size, number of conversations/messages)
- Reset settings to defaults

---

### Task 4.9 — System prompt editor

Per-conversation system prompt:
- Textarea in a slide-out panel or inline above the chat
- Saved to the conversation record in SQLite
- Sent with every API request for that conversation
- Preset system prompts (e.g., "You are a helpful assistant", "You are a code reviewer")

---

### Task 4.10 — Welcome/Onboarding screen

**File:** `src/components/common/WelcomeScreen.tsx`

Shown when:
- No conversations exist (first launch)
- No API keys configured

Content:
- App logo and tagline
- Quick setup guide: "Add your first API key"
- Provider cards with "Configure" buttons
- Link to get API keys (OpenAI, Anthropic)
- Sample prompts to try after setup

**Verification for Phase 4:**
- [ ] Settings modal opens/closes smoothly
- [ ] API key can be entered, validated, saved, and deleted
- [ ] Theme switching works
- [ ] Model selector shows provider-specific models
- [ ] Custom provider can be configured with base URL
- [ ] Onboarding screen appears on first launch
- [ ] System prompt is saved and used in API requests

---

## Phase 5: Polish & Advanced Features (Day 12–15)

**Goal:** Refinement, advanced features, and quality-of-life improvements that make the app feel premium.

**Dependencies:** Phase 4 complete (all core features working).

**Estimated Time:** 3 days

---

### Task 5.1 — Conversation search

Search bar in the sidebar:
- Searches conversation titles
- Also searches message content (full-text search via SQLite `LIKE` or FTS5)
- Results highlighted in the sidebar list
- Debounced input (300ms)
- Clear button

**SQL query:**
```sql
SELECT DISTINCT c.* FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.title LIKE '%query%' OR m.content LIKE '%query%'
ORDER BY c.updated_at DESC
```

---

### Task 5.2 — Export conversation

Export formats:
- **Markdown:** Each message as a heading (User/Assistant) with content
- **JSON:** Full conversation data including metadata

Trigger: Right-click conversation → "Export" or button in chat header.

Use Tauri's file dialog to choose save location:
```rust
// tauri-plugin-dialog for save dialog
```

---

### Task 5.3 — Keyboard shortcuts

| Shortcut          | Action                    |
| ----------------- | ------------------------- |
| `Ctrl+N`          | New conversation          |
| `Ctrl+K`          | Focus search              |
| `Ctrl+,`          | Open settings             |
| `Ctrl+Enter`      | Send message (if configured) |
| `Escape`          | Stop generation / close modal |
| `Ctrl+Shift+C`    | Copy last assistant message |
| `Ctrl+Backspace`  | Delete conversation       |

**File:** `src/hooks/useKeyboard.ts`

Register global keyboard listeners. Ensure they don't fire when typing in inputs (except `Ctrl+Enter`).

---

### Task 5.4 — System tray

Tauri system tray integration:
- Minimize to tray on close (optional setting)
- Tray icon with context menu:
  - Show/Hide window
  - New Chat
  - Quit
- Click tray icon to toggle window visibility

**Requires:** `tauri-plugin-tray` or built-in Tauri tray API.

---

### Task 5.5 — Micro-animations

Add subtle animations throughout:
- **Message appear:** Slide up + fade in
- **Sidebar hover:** Slight scale + background change
- **Modal transitions:** Fade + slide
- **Button press:** Scale down on click
- **Theme toggle:** Smooth color transition
- **Stream cursor:** Blinking animation

Use CSS transitions and `@keyframes`. Keep animations under 200ms for snappiness.

---

### Task 5.6 — Message editing

User messages can be edited:
- Click "Edit" on a user message
- Message turns into an editable textarea
- "Save & Resend" button
- All subsequent messages (after the edited one) are removed
- A new API request is made with the updated history

---

### Task 5.7 — Regenerate last response

"Regenerate" button on the last assistant message:
- Removes the last assistant message
- Re-sends the same request
- New response streams in

---

### Task 5.8 — Token usage display

Show per-message token count (if returned by the API):
- Small badge on each assistant message
- Total conversation tokens in header or sidebar

---

### Task 5.9 — Error recovery and retry

- Retry button on failed messages
- Automatic retry with exponential backoff (optional)
- Network status indicator in the footer

---

### Task 5.10 — Cross-platform testing

Test on available platforms:
- **Linux:** Primary development platform
- **macOS:** If available, test keychain integration
- **Windows:** If available, test Credential Manager

Document any platform-specific issues and fixes.

**Verification for Phase 5:**
- [ ] Search finds conversations by title and content
- [ ] Export produces valid Markdown/JSON files
- [ ] All keyboard shortcuts work
- [ ] System tray icon appears with working menu
- [ ] Animations feel smooth, not janky
- [ ] Message editing re-generates correctly
- [ ] Regenerate replaces the last response
- [ ] Token counts display when available

---

## Phase 6: Build & Distribution (Day 15–16)

**Goal:** Production-ready build, app icons, CI pipeline, and documentation.

**Dependencies:** Phase 5 complete (all features implemented and polished).

**Estimated Time:** 1–1.5 days

---

### Task 6.1 — Configure tauri.conf.json for production

Finalize all metadata:
```json
{
  "productName": "GokChat",
  "version": "0.1.0",
  "identifier": "com.gokchat.app",
  "app": {
    "windows": [{
      "title": "GokChat",
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "center": true
    }]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "linux": {
      "deb": { "depends": ["libsecret-1-0"] },
      "appimage": { "bundleMediaFramework": true }
    }
  }
}
```

---

### Task 6.2 — Generate app icons

Create icons in all required sizes:
- 32x32 PNG
- 128x128 PNG
- 128x128@2x PNG (256x256)
- icon.icns (macOS)
- icon.ico (Windows)

Use `tauri icon` command or manually create with an image editor.

```bash
bunx tauri icon src-tauri/icons/app-icon.png
```

---

### Task 6.3 — Build for current platform

```bash
bun run tauri build
```

This produces:
- **Linux:** `.deb`, `.AppImage`
- **macOS:** `.dmg`, `.app`
- **Windows:** `.msi`, `.exe`

---

### Task 6.4 — Test the production build

Run the built binary:
- All features work as in dev mode
- SQLite database creates correctly
- Keychain integration works
- No missing assets or broken paths
- Window opens at correct size

---

### Task 6.5 — GitHub Actions CI

**File:** `.github/workflows/build.yml`

```yaml
name: Build
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-22.04, macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - uses: dtolnay/rust-toolchain@stable
      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libsecret-1-dev libappindicator3-dev
      - run: bun install
      - run: bun run tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: gokchat-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/**
```

---

### Task 6.6 — Create README.md

Include:
- App description and screenshots
- Feature list
- Download/install instructions
- Build from source instructions
- Provider setup guide (how to get API keys)
- Tech stack and architecture
- Contributing guide
- License

---

### Task 6.7 — Create CHANGELOG.md

```markdown
# Changelog

## [0.1.0] — 2025-XX-XX

### Added
- Multi-provider AI chat (OpenAI, Anthropic, OpenAI-compatible)
- Streaming responses with real-time display
- Markdown rendering with syntax-highlighted code blocks
- OS keychain API key storage
- SQLite conversation history
- Dark/light theme
- Conversation search
- Export conversations (Markdown/JSON)
- Keyboard shortcuts
- System tray
```

**Verification for Phase 6:**
- [ ] Production build completes without errors
- [ ] Built app launches and all features work
- [ ] Icons display correctly in OS
- [ ] CI pipeline passes on all platforms
- [ ] README covers all necessary information
- [ ] CHANGELOG documents all features

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
| ---- | ------ | ----------- | ---------- |
| `keyring` fails on headless Linux | High | Medium | Fall back to encrypted file storage via `tauri-plugin-store` |
| SSE parsing breaks on some providers | Medium | High | Add per-provider SSE parsers; extensive testing with each provider |
| Tailwind v4 + shadcn/ui conflicts | Medium | Low | Pin versions; test early in Phase 0 |
| Large conversation history slows DB | Medium | Low | Add SQLite indexes; paginate message loading |
| Tauri 2.x plugin compatibility | High | Low | Use only stable, well-maintained plugins |
| Streaming memory leaks | Medium | Medium | Proper cleanup of event listeners; test with long sessions |
| Cross-platform keychain differences | Medium | Medium | Test on all platforms; document platform-specific behavior |
| API rate limiting | Low | Medium | Add rate limit detection and user-facing warnings |

---

## Milestones & Timeline

| Day | Milestone                | Deliverable                                    |
| --- | ------------------------ | ---------------------------------------------- |
| 2   | Phase 0 Complete         | Running app window, all dependencies installed  |
| 5   | Phase 1 Complete         | Backend fully functional, commands testable     |
| 7   | Phase 2 Complete         | App shell with sidebar, basic chat view         |
| 10  | Phase 3 Complete         | **Full chat experience** — streaming, markdown  |
| 12  | Phase 4 Complete         | Settings, API key management, onboarding        |
| 15  | Phase 5 Complete         | Polish, animations, advanced features           |
| 16  | Phase 6 Complete         | **Production build**, CI, documentation         |

---

> **Total estimated time:** 14–16 working days
>
> **MVP (Phases 0–3):** 10 days — A functional chat app with streaming
>
> **Full v0.1.0 (Phases 0–6):** 16 days — Production-ready with all features
