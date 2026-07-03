# ✴️ GokChat

GokChat is a premium, ultra-fast, and secure cross-platform desktop AI chat assistant designed to resemble modern Claude.ai and ChatGPT interfaces. Built using **Tauri v2**, **React 19**, **Bun**, **Tailwind CSS v4**, and **SQLite**.

![Screenshot Mockup](https://raw.githubusercontent.com/aswin402/gokchat/main/src-tauri/icons/128x128.png)

---

## 🌟 Key Features

* **Claude-style Welcome Home View**: Centered greeting dashboard ("aswin returns!"), preset prompt cards, and inline model selectors.
* **Collapsible Sidebar Layout**: Transition-animated sidebar switcher supporting a compact vertical icon bar (`w-16`) and an expanded conversation recents list (`w-80`).
* **ChatGPT-style Chat View**: Pill-shaped floating bottom input container with attachment selectors and audio icons.
* **Model Selector Dropdown**: Reusable group-based selector supporting OpenAI, Anthropic Claude, and custom local endpoints (Ollama/LM Studio) with configuration key status badges.
* **Claude-style Split Panel "Artifacts"**: Dynamic regex parser that detects HTML or SVG tags in LLM streaming completions and previews them live inside a sandboxed split-screen `<iframe>`.
* **Zero-Trust Credential Keyring**: API keys are securely saved directly inside the OS native credential manager (GNOME Keyring / macOS Keychain) using Rust's `keyring` crate. Credentials never touch web-view local storage.
* **Persistent SQLite History**: Full database schemas storing conversation threads, messages log, and custom prompts using automated migrations.
* **Desktop Quality of Life**:
  * Global keyboard shortcuts (`Ctrl+N` new chat, `Ctrl+,` open settings, `Escape` dismiss modal).
  * Streaming SSE chunk completions with Tokyo background thread spawns.
  * Stop/Abort generation triggers.
  * Response regeneration and prompt history editing.
  * System Tray window show/hide toggles.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Zustand (with Immer), Lucide icons.
* **Markdown Rendering**: `react-markdown`, `remark-gfm` (GitHub tables/formatting), `rehype-highlight` (code syntax highlighting).
* **Backend**: Rust, Tauri v2.
* **Database**: `tauri-plugin-sql` (SQLite driver).
* **Store**: `tauri-plugin-store` (client configuration persistence).

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed the following requirements on your OS:
1. [Rust & Cargo](https://www.rust-lang.org/tools/install) (for Tauri compilation).
2. [Bun](https://bun.sh) (recommended package manager).
3. System libraries (e.g. `libsecret-1-dev` on Linux for credential storage support).

### Installation & Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/aswin402/gokchat.git
   cd gokchat
   ```

2. **Install Dependencies**:
   ```bash
   bun install
   ```

3. **Run Development Server**:
   ```bash
   bun run tauri dev
   ```

4. **Build Production Bundle**:
   ```bash
   bun run tauri build
   ```

---

## 🔒 Security Architecture

GokChat prioritizes key safety. The UI never stores API keys in `localStorage`, `IndexedDB`, or cleartext JSON files. Instead, keys are piped directly into the Rust backend via tauri commands and stored inside the OS keychain wrapper. When completing requests, keys are retrieved in memory and sent via server-side endpoints, protecting them from web-view attacks.
