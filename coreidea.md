# GokChat — Core Idea

> **One native desktop app. Every AI provider. Your keys, your data, your control.**

---

## 1. Problem Statement

The AI chat landscape is fragmented — and it's getting worse.

Today, a typical power user who relies on multiple AI providers faces a painfully disjointed experience:

### The Daily Reality

- **Tab sprawl.** You have ChatGPT open in one tab, Claude in another, maybe a Groq playground in a third. Each has its own UI, its own history, its own quirks. Switching between them breaks flow and scatters context.
- **No unified history.** You had a brilliant conversation about system architecture last week — but was it with GPT-4o or Claude? Good luck searching across three separate web apps to find it.
- **Web UIs are bloated.** ChatGPT's web interface ships megabytes of JavaScript, takes seconds to become interactive, and fights you with aggressive upsells, rate limits, and "Plus" nudges. Claude's web UI is cleaner but still a browser tab competing for memory with everything else.
- **Privacy is an afterthought.** Your conversations live on someone else's servers. Your API keys are stored in browser local storage or pasted into random web apps. You don't truly *own* your data.
- **Subscription fatigue.** ChatGPT Plus ($20/mo) + Claude Pro ($20/mo) + Gemini Advanced ($20/mo) = $60/mo for access to models you could use via API at a fraction of the cost.
- **No local model story.** You've got Ollama running locally with Llama 3, but there's no good native client that treats local models as first-class citizens alongside cloud providers.

### The Core Tension

AI is becoming the most important tool in a developer's workflow — but the interfaces for accessing it are stuck in the browser era. We deserve better.

---

## 2. Solution

**GokChat** is a lightweight, native desktop application that unifies all your AI conversations into a single interface.

You bring your own API keys. GokChat connects directly to the providers — OpenAI, Anthropic, Ollama, Groq, OpenRouter, LM Studio, or any OpenAI-compatible endpoint. No middleman. No subscription markup. No data leaving your machine (except the API calls themselves).

```
┌─────────────────────────────────────────────────┐
│                   GokChat                       │
│                                                 │
│  ┌──────────┐  ┌────────────────────────────┐   │
│  │ Sidebar  │  │       Chat Area             │   │
│  │          │  │                              │   │
│  │ ▸ Today  │  │  You: Explain Rust lifetimes │   │
│  │  Chat 1  │  │                              │   │
│  │  Chat 2  │  │  Claude 3.5 Sonnet:          │   │
│  │ ▸ Week   │  │  Lifetimes are Rust's way... │   │
│  │  Chat 3  │  │                              │   │
│  │          │  │  [streaming ▌]               │   │
│  │          │  │                              │   │
│  │          │  ├────────────────────────────┤   │
│  │          │  │  [Model: Claude 3.5] [Send] │   │
│  └──────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### How It Works

1. **Add your API keys** — stored securely in your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). Never in plaintext. Never transmitted anywhere except to the provider's API endpoint.
2. **Start chatting** — pick a model from any configured provider and go. Switch models mid-conversation if you want.
3. **Everything is local** — conversations are stored in a local SQLite database. Search across all of them. Export anytime. Delete anytime. It's your data.
4. **Streaming responses** — real-time token streaming via the Rust backend. No JavaScript-based HTTP handling. Native performance.

---

## 3. Core Value Propositions

### 🔗 One App, All Providers — Unified Interface

Stop juggling tabs. GokChat gives you a single, consistent chat interface that works with:

| Provider | Models | Connection |
|----------|--------|------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3, etc. | Official API |
| **Anthropic** | Claude 4 Sonnet, Claude 3.5 Haiku, etc. | Official API |
| **Ollama** | Llama 3, Mistral, Phi-3, Gemma, etc. | Local (OpenAI-compat) |
| **Groq** | Llama 3, Mixtral, Gemma (ultra-fast) | OpenAI-compat API |
| **OpenRouter** | 100+ models from multiple providers | OpenAI-compat API |
| **LM Studio** | Any GGUF model | Local (OpenAI-compat) |
| **Any custom** | Your own endpoint | OpenAI-compat API |

One UI. One history. One search. All models.

### 🔒 Privacy-First — Your Keys Never Leave Your Machine

- API keys are stored in the **OS-level keychain** using the `keyring` crate — the same secure storage that your SSH keys and passwords use.
- Zero telemetry. Zero analytics. Zero tracking.
- No data leaves your device except the API requests you explicitly make.
- No account creation. No sign-up. No "sign in with Google."
- The app works fully offline with local models (Ollama, LM Studio).

### ⚡ Native Performance — Not Another Electron App

GokChat is built with **Tauri 2.x**, which means:

| Metric | GokChat (Tauri) | Typical Electron App |
|--------|-----------------|---------------------|
| **Bundle size** | 3–10 MB | 150–300 MB |
| **Startup time** | <200ms | 2–5 seconds |
| **Idle memory** | ~50 MB | 200–500 MB |
| **Runtime** | System WebView + Rust | Bundled Chromium |

The Rust backend handles all heavy lifting — HTTP streaming, database queries, key management — while the React frontend stays lean and responsive. No bundled browser engine. No wasted resources.

### 🌐 Offline-Capable — Works With Local Models

Running Ollama or LM Studio? GokChat treats local models as first-class citizens:

- Auto-discover running Ollama instances
- Browse and select from locally available models
- Zero-latency local inference with streaming
- No internet connection required
- Same polished UI whether you're hitting GPT-4o or a local Llama 3

### 💾 Own Your Data — Everything Stays Local

- All conversations stored in a local **SQLite** database
- Full-text search across all conversations, all providers
- Export to Markdown or JSON at any time
- Delete conversations and they're actually deleted — no "soft delete" on someone's server
- Back up your data by copying a single file
- No vendor lock-in. Your conversations are yours.

### 💰 Cost-Effective — No Subscription Markup

| Approach | Monthly Cost (typical usage) |
|----------|------|
| ChatGPT Plus + Claude Pro | $40/mo |
| GokChat + API keys | $5–15/mo (pay per token) |

Use the APIs directly. Pay only for what you use. No artificial rate limits. No "you've hit your GPT-4 cap, try again in 3 hours."

---

## 4. Target Users

### Primary: Developers & Engineers

- Use AI daily for code generation, debugging, architecture decisions
- Already have API keys for multiple providers
- Value native performance and keyboard-driven workflows
- Comfortable with technical setup (adding API keys, configuring endpoints)
- Want to use local models for sensitive/proprietary code

### Secondary: AI Researchers & Power Users

- Compare model outputs across providers for evaluation
- Need searchable history of hundreds/thousands of conversations
- Want to experiment with different system prompts and model configurations
- Care about reproducibility (exact model, temperature, system prompt)

### Tertiary: Privacy-Conscious Professionals

- Lawyers, doctors, consultants handling sensitive client data
- Need assurance that conversations don't leave their machine
- Want local model support for confidential work
- Require data export capabilities for compliance

### Quaternary: Cost-Optimizing Freelancers

- Use AI heavily but find subscriptions expensive
- Want granular usage tracking and cost estimation
- Need to allocate AI costs to specific clients/projects
- Prefer pay-per-use over flat subscriptions

---

## 5. Competitive Landscape

### Direct Competitors

| App | Strengths | GokChat Differentiator |
|-----|-----------|----------------------|
| **ChatGPT Desktop** | Official, polished | Single provider only. Subscription required. No local models. |
| **Claude Desktop** | Clean UI, Artifacts | Single provider only. Subscription required. No GPT access. |
| **TypingMind** | Multi-provider, feature-rich | Web-based (browser tab). Paid license ($39+). Heavier UI. |
| **Big-AGI** | Open source, many features | Web-based. Complex setup. Feature bloat. |
| **Chatbox** | Desktop, multi-provider | Electron-based (large bundle). Less polished streaming. |
| **Jan.ai** | Local-first, open source | Focused on local models. Cloud provider support is secondary. Complex model management. |
| **Msty** | Desktop, clean UI | Electron-based. Closed source. Limited customization. |

### GokChat's Unique Position

```
                    Native Desktop
                         ▲
                         │
            GokChat ★    │    ChatGPT App
                         │    Claude App
        Multi ───────────┼──────────── Single
        Provider         │              Provider
                         │
            TypingMind   │
            Big-AGI      │
                         │
                    Web-Based
```

GokChat occupies a unique quadrant: **native desktop + multi-provider**. No other app combines Tauri's lightweight native performance with comprehensive multi-provider support and privacy-first local storage.

---

## 6. Non-Goals (What GokChat Is NOT)

To maintain focus and ship a great v1, GokChat explicitly will **not** pursue:

- **❌ Mobile app** — Desktop-first. Mobile may come later, but it's not in scope for v1 or v2. The desktop experience must be excellent before expanding platforms.
- **❌ SaaS / hosted service** — GokChat does not proxy API calls through our servers. No backend. No accounts. No cloud sync. The app is the product.
- **❌ Model hosting** — We don't run models. We connect to providers that do. If you want to run local models, use Ollama/LM Studio — GokChat is the client.
- **❌ Agentic workflows** — No tool use, function calling orchestration, or multi-step agent loops in v1. Pure chat interface.
- **❌ Plugin/extension marketplace** — Planned for the future, but not v1. Ship core UX first.
- **❌ Collaborative/team features** — Single-user desktop app. Shared workspaces and team features are a future consideration.
- **❌ Real-time sync across devices** — Local-first means local-only for now. Cross-device sync is a future possibility, not a v1 feature.

---

## 7. Name Origin — Why "GokChat"?

**Gok** (கோக்) — inspired by the Tamil word for "sky" or "heavens" (கோகனம்/ஆகாயம்), reflecting the idea of reaching skyward to access the most powerful AI models from a single place.

But practically, it also works as:

- **Gok** = a short, punchy, memorable syllable
- **GokChat** = instantly communicates what the app does (it's a chat app)
- Easy to type, easy to say, easy to remember
- Domain-friendly and namespace-friendly

The spirit: *reach for the sky from the comfort of your desktop.*

---

## 8. Tech Stack — Why These Choices?

| Layer | Technology | Why |
|-------|-----------|-----|
| **App framework** | Tauri 2.x | Native performance, tiny bundle, security-focused, Rust backend |
| **Backend** | Rust | Memory safety, blazing performance, great HTTP/streaming libraries |
| **Frontend** | React 19 | Component model, massive ecosystem, developer familiarity |
| **Language** | TypeScript | Type safety for frontend, better DX |
| **Bundler/Runtime** | Bun | Fast installs, fast builds, modern tooling |
| **Styling** | Tailwind CSS v4 | Utility-first, design system consistency, tiny CSS output |
| **Components** | shadcn/ui | Beautiful, accessible, customizable components (not a dependency) |
| **Database** | SQLite (via rusqlite) | Embedded, zero-config, battle-tested, local-first |
| **HTTP** | reqwest | Rust HTTP client with streaming support |
| **Key storage** | keyring | OS-native keychain integration |
| **Serialization** | serde + serde_json | Rust's standard for JSON handling |
| **IPC** | Tauri Commands + Events | Type-safe Rust↔JS communication |

---

## 9. Long-Term Vision

### Phase 1: Foundation (v1.0) — *Ship the core*

- Multi-provider chat with streaming
- Secure API key management
- Local conversation history with search
- Clean, native-feeling UI
- Dark/light themes

### Phase 2: Power User Features (v1.x) — *Delight power users*

- Conversation export (Markdown, JSON)
- Keyboard-driven workflows
- Token usage tracking and cost estimation
- System tray integration
- Auto-updating
- Image/vision model support

### Phase 3: Advanced Capabilities (v2.0) — *Expand the platform*

- **Prompt Template Library** — save, organize, and share reusable prompts
- **Split View** — compare model outputs side-by-side
- **Conversation Branching** — fork conversations to explore alternative paths
- **Custom Model Profiles** — save model + system prompt + temperature as reusable profiles
- **Import/Export** — bring in conversations from ChatGPT, Claude exports

### Phase 4: Ecosystem (v3.0) — *Build the platform*

- **Plugin System** — extend GokChat with community-built plugins
  - Custom tools (web search, code execution, file reading)
  - Custom providers (connect to any API)
  - UI extensions (custom renderers, visualization)
- **Prompt Marketplace** — discover and share prompt templates
- **Team Features** — shared conversations, prompt libraries, usage policies
- **Cross-Device Sync** — optional, encrypted, user-controlled sync

---

## 10. Guiding Principles

1. **Local-first, always.** Data lives on the user's machine. Cloud is optional, never required.
2. **Performance is a feature.** Every interaction should feel instant. If the UI lags, it's a bug.
3. **Simplicity over features.** Do fewer things, but do them exceptionally well.
4. **User agency.** The user controls their keys, their data, their models. No lock-in.
5. **Privacy by architecture.** Privacy isn't a toggle — it's how the app is built.
6. **Native feel.** The app should feel like it belongs on your OS, not like a website in a wrapper.

---

> *"The best AI interface is the one that gets out of your way and lets you think."*
>
> — The GokChat Philosophy
