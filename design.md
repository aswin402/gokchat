# GokChat — UI/UX Design Specification

> **Version:** 1.0.0  
> **Last Updated:** 2026-07-02  
> **Stack:** Tauri 2.x · React 19 · Bun · Tailwind CSS v4 · shadcn/ui  
> **Platforms:** macOS, Windows, Linux

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Screen Layouts](#3-screen-layouts)
4. [Component Design Specs](#4-component-design-specs)
5. [Responsive Behavior](#5-responsive-behavior)
6. [Keyboard Shortcuts](#6-keyboard-shortcuts)
7. [Animations & Micro-interactions](#7-animations--micro-interactions)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|---|---|
| **Premium Minimalism** | Every pixel earns its place. No gratuitous chrome, no visual noise. Inspired by Linear's density, Raycast's speed, and Arc Browser's spatial elegance. |
| **Dark-First** | The default experience is a carefully crafted dark theme. Light mode is a first-class citizen, not an afterthought. |
| **Focus on Content** | The AI's response is the hero. UI elements recede; conversation text dominates. |
| **Quiet Confidence** | Animations are subtle and purposeful — they communicate state, not show off. A 150ms fade says "done"; a 3-second bounce says "look at me." We choose the former. |
| **Provider Agnostic, Provider Aware** | The UI treats all providers equally in layout but uses subtle color cues so users always know which model they're talking to. |

### Design Inspirations

- **Linear** — Information density without clutter; monochrome palette with a single accent
- **Raycast** — Speed, keyboard-first interaction, command palette UX
- **Arc Browser** — Spatial sidebar, fluid transitions, playful-yet-professional tone
- **ChatGPT Desktop** — Conversational layout patterns, streaming UX
- **Warp Terminal** — Code block treatment, dark theme craftsmanship

### Typography

- **Primary Font:** `Inter` (fallback: `Geist Sans`, system-ui, sans-serif)
- **Monospace Font:** `Geist Mono` (fallback: `JetBrains Mono`, `Fira Code`, monospace)
- Both loaded via `@fontsource/inter` and `@fontsource/geist-mono` (no external CDN — Tauri apps are offline-capable)

### Iconography

- **Icon Set:** Lucide React (`lucide-react`) — consistent, clean, 24×24 default
- **Style:** 1.5px stroke weight, rounded caps, no fill
- **Usage:** Icons accompany text labels in settings; standalone icons only in toolbar positions where meaning is unambiguous (e.g., `+` for new chat, `⚙` for settings)

---

## 2. Design System

### 2.1 Color Palette

All colors defined in HSL. Applied via CSS custom properties in Tailwind CSS v4's `@theme` layer.

#### Dark Theme (Default)

```css
/* tailwind.css — @theme block */
@theme {
  /* ── Background Layers ── */
  --color-bg-base:       hsl(240 10% 4%);        /* #09090b — deepest background */
  --color-bg-sidebar:    hsl(240 10% 6%);        /* #0f0f12 — sidebar panel */
  --color-bg-main:       hsl(240 10% 8%);        /* #141418 — main chat area */
  --color-bg-elevated:   hsl(240 10% 12%);       /* #1e1e24 — cards, dropdowns, modals */
  --color-bg-hover:      hsl(240 10% 14%);       /* #232329 — hover states */
  --color-bg-active:     hsl(240 10% 16%);       /* #28282f — active/pressed states */
  --color-bg-input:      hsl(240 10% 10%);       /* #19191f — input fields */

  /* ── Text Colors ── */
  --color-text-primary:   hsl(0 0% 95%);         /* #f2f2f2 — headings, primary content */
  --color-text-secondary: hsl(240 5% 65%);       /* #a1a1aa — body text, descriptions */
  --color-text-muted:     hsl(240 4% 46%);       /* #71717a — timestamps, placeholders */
  --color-text-inverse:   hsl(240 10% 4%);       /* #09090b — text on light backgrounds */

  /* ── Border Colors ── */
  --color-border-default: hsl(240 6% 16%);       /* #27272a — subtle borders */
  --color-border-hover:   hsl(240 5% 26%);       /* #3f3f46 — hovered borders */
  --color-border-focus:   hsl(240 5% 48%);       /* #737380 — focused input rings */

  /* ── Brand Accent ── */
  --color-accent:         hsl(262 83% 64%);      /* #8b5cf6 — primary brand purple */
  --color-accent-hover:   hsl(262 83% 58%);      /* #7c3aed — hovered accent */
  --color-accent-muted:   hsl(262 40% 20%);      /* subtle accent bg for badges */

  /* ── Semantic Colors ── */
  --color-success:        hsl(142 71% 45%);      /* #22c55e — validation pass, connected */
  --color-success-muted:  hsl(142 40% 15%);      /* success background */
  --color-warning:        hsl(38 92% 50%);       /* #f59e0b — rate limits, caution */
  --color-warning-muted:  hsl(38 50% 15%);       /* warning background */
  --color-error:          hsl(0 84% 60%);        /* #ef4444 — invalid key, errors */
  --color-error-muted:    hsl(0 50% 15%);        /* error background */
  --color-info:           hsl(217 91% 60%);      /* #3b82f6 — informational */

  /* ── Provider Accents ── */
  --color-provider-openai:    hsl(160 84% 39%);  /* #10a37f — OpenAI teal-green */
  --color-provider-anthropic: hsl(25 95% 53%);   /* #f97316 — Claude warm orange */
  --color-provider-custom:    hsl(217 91% 60%);  /* #3b82f6 — custom/compatible blue */
  --color-provider-ollama:    hsl(240 5% 65%);   /* #a1a1aa — Ollama neutral gray */
  --color-provider-groq:      hsl(35 100% 50%);  /* #ff9900 — Groq amber */
}
```

#### Light Theme

```css
/* Applied via [data-theme="light"] or .light class */
@theme {
  --color-bg-base:       hsl(0 0% 100%);        /* #ffffff */
  --color-bg-sidebar:    hsl(240 5% 96%);       /* #f4f4f5 */
  --color-bg-main:       hsl(0 0% 100%);        /* #ffffff */
  --color-bg-elevated:   hsl(0 0% 100%);        /* #ffffff — with shadow instead */
  --color-bg-hover:      hsl(240 5% 93%);       /* #ececef */
  --color-bg-active:     hsl(240 5% 90%);       /* #e4e4e7 */
  --color-bg-input:      hsl(240 5% 96%);       /* #f4f4f5 */

  --color-text-primary:   hsl(240 10% 4%);      /* #09090b */
  --color-text-secondary: hsl(240 4% 46%);      /* #71717a */
  --color-text-muted:     hsl(240 5% 65%);      /* #a1a1aa */
  --color-text-inverse:   hsl(0 0% 100%);       /* #ffffff */

  --color-border-default: hsl(240 6% 90%);      /* #e4e4e7 */
  --color-border-hover:   hsl(240 5% 78%);      /* #c4c4cc */
  --color-border-focus:   hsl(262 83% 64%);     /* accent ring */

  /* Accent & semantic colors remain the same */
}
```

### 2.2 Typography Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text-2xl` | 24px / 1.5rem | 700 | 32px | Page titles (Settings header) |
| `text-xl` | 20px / 1.25rem | 600 | 28px | Section headers |
| `text-lg` | 18px / 1.125rem | 600 | 28px | Modal titles |
| `text-base` | 16px / 1rem | 400 | 24px | Message body text |
| `text-sm` | 14px / 0.875rem | 400 | 20px | Sidebar items, secondary UI |
| `text-xs` | 12px / 0.75rem | 500 | 16px | Timestamps, badges, labels |
| `text-code` | 14px / 0.875rem | 400 | 22px | Code blocks (Geist Mono) |
| `text-code-sm` | 13px / 0.8125rem | 400 | 20px | Inline code |

### 2.3 Spacing Scale

Using Tailwind's default spacing (1 unit = 4px):

| Token | Value | Usage |
|---|---|---|
| `space-0.5` | 2px | Micro gaps (icon-to-text in badges) |
| `space-1` | 4px | Tight padding (badge inner) |
| `space-1.5` | 6px | Compact list gaps |
| `space-2` | 8px | Component inner padding |
| `space-3` | 12px | Card padding, section gaps |
| `space-4` | 16px | Standard padding, sidebar item padding |
| `space-5` | 20px | Message bubble padding |
| `space-6` | 24px | Section separation |
| `space-8` | 32px | Major section gaps |
| `space-10` | 40px | Modal body padding |
| `space-12` | 48px | Empty state vertical spacing |

### 2.4 Border Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 4px | Inline code, small badges |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Cards, message bubbles |
| `rounded-xl` | 12px | Modals, larger containers |
| `rounded-2xl` | 16px | Welcome cards, onboarding |
| `rounded-full` | 9999px | Avatars, pills, provider badges |

### 2.5 Shadow Tokens

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px hsl(0 0% 0% / 0.15)` | Subtle lift for inputs |
| `shadow-md` | `0 4px 6px -1px hsl(0 0% 0% / 0.2), 0 2px 4px -2px hsl(0 0% 0% / 0.15)` | Dropdowns, popovers |
| `shadow-lg` | `0 10px 15px -3px hsl(0 0% 0% / 0.25), 0 4px 6px -4px hsl(0 0% 0% / 0.15)` | Modals, overlay panels |
| `shadow-glow` | `0 0 20px hsl(262 83% 64% / 0.15)` | Focused accent elements |

> **Note:** In dark mode, shadows are subtle — borders carry more visual weight. In light mode, shadows are more prominent and borders more subdued.

### 2.6 Animation Tokens

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `duration-fast` | 100ms | `ease-out` | Hover states, color transitions |
| `duration-normal` | 150ms | `ease-out` | Fades, slide-ins |
| `duration-slow` | 300ms | `ease-in-out` | Theme transitions, modal open/close |
| `duration-spring` | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Modal scale, bounce effects |
| `duration-stream` | 50ms | `linear` | Streaming text cursor blink |

```css
@theme {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 300ms;
  --duration-spring: 200ms;
}
```

---

## 3. Screen Layouts

### 3.1 Main Chat View (Three-Panel Layout)

This is the primary screen. Users spend 95% of their time here.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ TITLE BAR (DRAGGABLE, TAURI) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ GokChat                                                    ─  □  ✕  (controls) │
├─────────────────────┬────────────────────────────────────────┬───────────────────┤
│                     │                                        │                   │
│  ┌───────────────┐  │  ┌──────────────────────────────────┐  │  ┌─────────────┐  │
│  │  ✦ GokChat    │  │  │         Model: GPT-4o ▾          │  │  │ Model Info  │  │
│  │               │  │  │    Provider: OpenAI   ●          │  │  │             │  │
│  ├───────────────┤  │  └──────────────────────────────────┘  │  │ gpt-4o      │  │
│  │               │  │                                        │  │ ─────────── │  │
│  │  [+ New Chat] │  │  ┌──────────────────────────────────┐  │  │ Context:    │  │
│  │               │  │  │  ┌─ 🧑 ──────────────────────┐   │  │  │  128K tok   │  │
│  ├───────────────┤  │  │  │ How do I set up a Tauri   │   │  │  │             │  │
│  │ 🔍 Search...  │  │  │  │ project with React?       │   │  │  │ Pricing:    │  │
│  ├───────────────┤  │  │  └────────────────────────────┘   │  │  │  $5/1M in   │  │
│  │               │  │  │                                    │  │  │  $15/1M out │  │
│  │  TODAY        │  │  │  ┌─ 🤖 ──────────────────────┐   │  │  │             │  │
│  │  ├─ Tauri     │  │  │  │ I'd be happy to help!     │   │  │  ├─────────────┤  │
│  │  │  Setup ●   │  │  │  │                            │   │  │  │ Token Usage │  │
│  │  ├─ React     │  │  │  │ First, install the Tauri  │   │  │  │             │  │
│  │  │  Hooks ●   │  │  │  │ CLI:                      │   │  │  │ Prompt:     │  │
│  │  │            │  │  │  │                            │   │  │  │  ████░ 342  │  │
│  │  YESTERDAY    │  │  │  │ ```bash                    │   │  │  │             │  │
│  │  ├─ API       │  │  │  │ bun add -D @tauri-apps/   │   │  │  │ Response:   │  │
│  │  │  Design ●  │  │  │  │          cli@latest        │   │  │  │  ██░░░ 128  │  │
│  │  ├─ CSS       │  │  │  │ ```                        │   │  │  │             │  │
│  │  │  Grid  ●   │  │  │  │                    📋 Copy │   │  │  │ Total:      │  │
│  │  │            │  │  │  │ Then create your app...    │   │  │  │  470 tokens │  │
│  │  LAST WEEK    │  │  │  │                        ▌   │   │  │  │  ~$0.0024   │  │
│  │  ├─ Python    │  │  │  └────────────────────────────┘   │  │  │             │  │
│  │  │  ML    ●   │  │  │                                    │  │  └─────────────┘  │
│  │  └─ Docker    │  │  │  ┌─ 🧑 ──────────────────────┐   │  │                   │
│  │     Tips  ●   │  │  │  │ What about hot reload?    │   │  │                   │
│  │               │  │  │  └────────────────────────────┘   │  │                   │
│  │               │  │  │                                    │  │                   │
│  │               │  │  │  ┌─ 🤖 ──────────────────────┐   │  │                   │
│  │               │  │  │  │ ●●● Generating...         │   │  │                   │
│  │               │  │  │  └────────────────────────────┘   │  │                   │
│  │               │  │  └──────────────────────────────────┘  │                   │
│  │               │  │                                        │                   │
│  │               │  │  ┌──────────────────────────────────┐  │                   │
│  │               │  │  │                                  │  │                   │
│  ├───────────────┤  │  │  Ask anything...          ▲  ➤  │  │                   │
│  │               │  │  │                           │     │  │                   │
│  │  ⚙ Settings   │  │  │  📎  GPT-4o ▾       Ctrl+Enter │  │                   │
│  │               │  │  └──────────────────────────────────┘  │                   │
│  └───────────────┘  │                                        │                   │
│                     │                                        │                   │
│    SIDEBAR (240px)  │           CHAT AREA (flex-1)           │  INFO PANEL       │
│                     │                                        │   (280px, opt.)   │
└─────────────────────┴────────────────────────────────────────┴───────────────────┘
```

#### Layout Specifications

| Region | Width | Behavior |
|---|---|---|
| Sidebar | `w-60` (240px) fixed | Collapsible via toggle or `Ctrl+[` |
| Chat Area | `flex-1` (fills remaining) | Min width: 400px |
| Info Panel | `w-70` (280px) fixed | Toggle via button, hidden by default |
| Title Bar | Full width, 36px height | Tauri draggable region, `data-tauri-drag-region` |

#### Sidebar Structure (Top to Bottom)

```
┌─────────────────────┐
│  ✦ GokChat          │  ← Logo + app name (h-12, flex items-center px-4)
├─────────────────────┤
│  [+ New Chat    ⌘N] │  ← Primary CTA button (w-full mx-3 my-2)
├─────────────────────┤
│  🔍 Search...   ⌘K  │  ← Search input (mx-3 my-1)
├─────────────────────┤
│                      │
│  TODAY               │  ← Date group label (text-xs text-muted uppercase px-4)
│  ├─ Tauri Setup ● ─│  │  ← ConversationItem with provider dot
│  ├─ React Hooks ● ─│  │     ● colored by provider
│                      │
│  YESTERDAY           │
│  ├─ API Design  ● ─│  │
│  ├─ CSS Grid    ● ─│  │
│                      │
│  (scrollable area)   │
│                      │
├─────────────────────┤
│  ⚙ Settings     ⌘,  │  ← Bottom-pinned settings button
└─────────────────────┘
```

#### Chat Area Structure (Top to Bottom)

```
┌────────────────────────────────────────┐
│  Model: GPT-4o ▾   Provider: OpenAI ● │  ← Top bar (h-12, border-b, flex items-center justify-center)
├────────────────────────────────────────┤
│                                        │
│     (scrollable message area)          │  ← overflow-y-auto, flex-1
│     max-w-3xl mx-auto                  │  ← Content constrained to ~768px center
│                                        │
│     ┌── User Message ──────────────┐   │
│     │ ...                          │   │
│     └──────────────────────────────┘   │
│                                        │
│     ┌── Assistant Message ─────────┐   │
│     │ ...                          │   │
│     └──────────────────────────────┘   │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │  ← Input area (border-t, p-4)
│  │  Textarea (auto-grow, max 200px)│  │
│  │                             ➤   │  │  ← Send button (right-aligned inside)
│  ├──────────────────────────────────┤  │
│  │  📎 Attach  │  GPT-4o ▾  │ ⌘⏎  │  │  ← Bottom toolbar row
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

### 3.2 Settings Modal (Multi-Tab)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ╳                      Settings                          │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌──────────┬───────────┬────────────┬──────────┐         │  │
│  │  │ 🔑 Keys  │ 🔌 Provs  │ 🎨 Look   │ 💾 Data  │         │  │
│  │  └──────────┴───────────┴────────────┴──────────┘         │  │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─          │  │
│  │                                                            │  │
│  │  ═══════════════════════════════════════════════            │  │
│  │  ║  ACTIVE TAB: API Keys                     ║            │  │
│  │  ═══════════════════════════════════════════════            │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────┐             │  │
│  │  │  ● OpenAI                    ✓ Connected │             │  │
│  │  │  ─────────────────────────────────────── │             │  │
│  │  │  API Key                                 │             │  │
│  │  │  ┌──────────────────────────┐            │             │  │
│  │  │  │ sk-●●●●●●●●●●●●●●●3kF9  │ 👁        │             │  │
│  │  │  └──────────────────────────┘            │             │  │
│  │  │                                          │             │  │
│  │  │  [Validate Key]        Last checked: 2m  │             │  │
│  │  └──────────────────────────────────────────┘             │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────┐             │  │
│  │  │  ● Anthropic                ✓ Connected  │             │  │
│  │  │  ─────────────────────────────────────── │             │  │
│  │  │  API Key                                 │             │  │
│  │  │  ┌──────────────────────────┐            │             │  │
│  │  │  │ sk-ant-●●●●●●●●●●●●xN2  │ 👁        │             │  │
│  │  │  └──────────────────────────┘            │             │  │
│  │  │                                          │             │  │
│  │  │  [Validate Key]        Last checked: 5m  │             │  │
│  │  └──────────────────────────────────────────┘             │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────┐             │  │
│  │  │  ● Custom Endpoint           ○ Not Set   │             │  │
│  │  │  ─────────────────────────────────────── │             │  │
│  │  │  Endpoint URL                            │             │  │
│  │  │  ┌──────────────────────────┐            │             │  │
│  │  │  │ http://localhost:11434   │            │             │  │
│  │  │  └──────────────────────────┘            │             │  │
│  │  │  API Key (optional)                      │             │  │
│  │  │  ┌──────────────────────────┐            │             │  │
│  │  │  │                          │ 👁        │             │  │
│  │  │  └──────────────────────────┘            │             │  │
│  │  │                                          │             │  │
│  │  │  [+ Add Endpoint]                        │             │  │
│  │  └──────────────────────────────────────────┘             │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Settings Tab: Providers

```
┌────────────────────────────────────────────────────────┐
│  🔌 Providers                                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  OpenAI                                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Default Model    ┌──────────────────────────┐   │  │
│  │                   │  gpt-4o               ▾  │   │  │
│  │                   └──────────────────────────┘   │  │
│  │                                                  │  │
│  │  Temperature      ┌──●────────────────────┐      │  │
│  │                   0.0   0.7         2.0         │  │
│  │                         ▲ current               │  │
│  │                                                  │  │
│  │  Max Tokens       ┌──────────────────────────┐   │  │
│  │                   │  4096                    │   │  │
│  │                   └──────────────────────────┘   │  │
│  │                                                  │  │
│  │  System Prompt    ┌──────────────────────────┐   │  │
│  │   (optional)      │  You are a helpful...   │   │  │
│  │                   │                          │   │  │
│  │                   └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Anthropic                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  (same structure as above)                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Custom Endpoints                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ollama (localhost:11434)                        │  │
│  │  Default Model: llama3.1:8b                      │  │
│  │  [Edit]  [Remove]                                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  [+ Add Custom Provider]                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Settings Tab: Appearance

```
┌────────────────────────────────────────────────────────┐
│  🎨 Appearance                                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Theme                                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ ████████ │  │ ░░░░░░░░ │  │ ▓▓ Auto  │     │    │
│  │  │ ████████ │  │ ░░░░░░░░ │  │ ▓▓       │     │    │
│  │  │  Dark ●  │  │  Light   │  │  System  │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  Font Size                                             │
│  ┌────────────────────────────────────────────────┐    │
│  │  ◉ Small (14px)                                │    │
│  │  ○ Medium (16px) — Default                     │    │
│  │  ○ Large (18px)                                │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  Message Density                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │  ○ Compact  — Less padding, more messages      │    │
│  │  ◉ Default  — Balanced spacing                 │    │
│  │  ○ Relaxed  — More breathing room              │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  Code Theme                                            │
│  ┌────────────────────────────────────────────┐        │
│  │  GitHub Dark ▾                             │        │
│  └────────────────────────────────────────────┘        │
│                                                        │
│  Send Message With                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  ◉ Ctrl/Cmd + Enter                           │    │
│  │  ○ Enter (Shift+Enter for new line)            │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Settings Tab: Data

```
┌────────────────────────────────────────────────────────┐
│  💾 Data & Privacy                                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Storage                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  💬 Conversations:  47 chats, 2.3 MB             │  │
│  │  🔑 API Keys:       3 providers configured       │  │
│  │  ⚙ Settings:        1.2 KB                       │  │
│  │                                                  │  │
│  │  Data location: ~/Library/Application Support/   │  │
│  │                 com.gokchat.app/                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Export                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [📥 Export All Conversations (JSON)]            │  │
│  │  [📥 Export Current Chat (Markdown)]             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Danger Zone                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [🗑 Clear All Conversations]                    │  │
│  │  [🗑 Delete All API Keys]                        │  │
│  │  [🔄 Reset All Settings]                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  About                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  GokChat v1.0.0                                  │  │
│  │  Built with Tauri 2.x + React 19                 │  │
│  │  github.com/user/gokchat                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.3 Empty State / Welcome Screen

```
┌─────────────────────┬────────────────────────────────────────────────────────────┐
│                     │                                                            │
│  ┌───────────────┐  │                                                            │
│  │  ✦ GokChat    │  │                                                            │
│  ├───────────────┤  │           ┌──────────────────────────────┐                 │
│  │               │  │           │                              │                 │
│  │  [+ New Chat] │  │           │       ✦  GokChat             │                 │
│  │               │  │           │                              │                 │
│  ├───────────────┤  │           │   Your AI, Your Keys,       │                 │
│  │               │  │           │   Your Privacy.             │                 │
│  │  No chats yet │  │           │                              │                 │
│  │               │  │           └──────────────────────────────┘                 │
│  │               │  │                                                            │
│  │  Start a new  │  │     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  conversation │  │     │              │ │              │ │              │    │
│  │  to get       │  │     │  ● OpenAI    │ │  ● Claude    │ │  ● Custom    │    │
│  │  going!       │  │     │              │ │              │ │              │    │
│  │               │  │     │  GPT-4o      │ │  Sonnet 4    │ │  Ollama,     │    │
│  │               │  │     │  GPT-4o-mini │ │  Haiku       │ │  Groq,       │    │
│  │               │  │     │  o1          │ │  Opus        │ │  OpenRouter  │    │
│  │               │  │     │              │ │              │ │              │    │
│  │               │  │     │  ○ Not Set   │ │  ○ Not Set   │ │  ○ Not Set   │    │
│  │               │  │     │              │ │              │ │              │    │
│  │               │  │     │ [Add Key →]  │ │ [Add Key →]  │ │ [Setup →]    │    │
│  │               │  │     │              │ │              │ │              │    │
│  │               │  │     └──────────────┘ └──────────────┘ └──────────────┘    │
│  │               │  │                                                            │
│  │               │  │     ───────────────── or ──────────────────                │
│  │               │  │                                                            │
│  │               │  │              [⚙ Open Settings (⌘,)]                       │
│  │               │  │                                                            │
│  │               │  │     ┌─────────────────────────────────────────────┐        │
│  │               │  │     │  💡 Tip: Your API keys are stored locally  │        │
│  │               │  │     │  and never leave your machine.             │        │
│  │               │  │     └─────────────────────────────────────────────┘        │
│  │               │  │                                                            │
│  ├───────────────┤  │                                                            │
│  │  ⚙ Settings   │  │                                                            │
│  └───────────────┘  │                                                            │
│                     │                                                            │
└─────────────────────┴────────────────────────────────────────────────────────────┘
```

### 3.4 Onboarding Flow (First Launch)

Displayed as a centered modal overlay on first launch, guiding the user through setup.

```
STEP 1 of 3 — Welcome
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                       ✦  GokChat                           │
│                                                            │
│              Welcome to GokChat!                           │
│                                                            │
│    A private AI chat client that works with                │
│    your own API keys. Nothing leaves your machine          │
│    except the API calls you make.                          │
│                                                            │
│    Let's set up your first provider.                       │
│                                                            │
│                                                            │
│              ● ○ ○                                         │
│                                                            │
│                      [Get Started →]                       │
│                                                            │
└────────────────────────────────────────────────────────────┘

STEP 2 of 3 — Choose Provider
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ← Back                  Add a Provider              Skip  │
│                                                            │
│  Choose at least one provider to start chatting:           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ● OpenAI                                            │  │
│  │  ChatGPT, GPT-4o, o1-pro                             │  │
│  │                                                      │  │
│  │  API Key                                             │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  sk-                                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  [Validate & Save]               ✓ Key is valid!     │  │
│  │                                                      │  │
│  │  💡 Get your key: platform.openai.com/api-keys       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ● Anthropic                           [+ Add Key]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ● Custom Endpoint (Ollama, Groq...)   [+ Setup]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│              ● ● ○                                         │
│                                                            │
│                      [Continue →]                          │
│                                                            │
└────────────────────────────────────────────────────────────┘

STEP 3 of 3 — Ready
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                     🎉 You're all set!                     │
│                                                            │
│         Connected to: OpenAI (GPT-4o)                      │
│                                                            │
│    ┌────────────────────────────────────────────────────┐  │
│    │  Quick Shortcuts                                   │  │
│    │                                                    │  │
│    │  ⌘ N        New conversation                       │  │
│    │  ⌘ K        Search chats                           │  │
│    │  ⌘ ,        Settings                               │  │
│    │  ⌘ Enter    Send message                           │  │
│    │  ⌘ Shift T  Toggle theme                           │  │
│    └────────────────────────────────────────────────────┘  │
│                                                            │
│              ● ● ●                                         │
│                                                            │
│                [Start Chatting →]                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Component Design Specs

### 4.1 MessageBubble

The core unit of conversation display.

#### Visual Appearance

```
USER MESSAGE:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                  How do I set up a Tauri ───── text-base │
│                  project with React 19?      text-primary│
│                                                          │
│                                    12:34 PM ─── text-xs  │
│                                              text-muted  │
└──────────────────────────────────────────────────────────┘
                                         ┌──┐
                                         │🧑│ ← Avatar (right-aligned)
                                         └──┘

ASSISTANT MESSAGE:
┌──┐
│🤖│ ← Avatar (left-aligned, provider-colored ring)
└──┘
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  I'd be happy to help you set up Tauri with React!       │
│                                                          │
│  First, create a new project:                            │
│                                                          │
│  ┌─ bash ────────────────────────────────── 📋 ─┐       │
│  │  bun create tauri-app my-app                  │       │
│  │  cd my-app                                    │       │
│  │  bun install                                  │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  Then configure your `tauri.conf.json`:                  │
│                                                          │
│  ┌─ json ────────────────────────────────── 📋 ─┐       │
│  │  {                                            │       │
│  │    "build": {                                 │       │
│  │      "devUrl": "http://localhost:5173"         │       │
│  │    }                                          │       │
│  │  }                                            │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  ─────────────────────────────────────                   │
│  📋 Copy  │  ♻ Regenerate  │  12:34 PM  │  470 tokens   │
└──────────────────────────────────────────────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Default** | Rendered markdown, full opacity |
| **Streaming** | Text appears character-by-character. Blinking `▌` cursor at the end. Bottom action bar hidden until complete. |
| **Hover** | Action toolbar (Copy, Regenerate) fades in at bottom-right with `opacity 0→1` over 100ms |
| **Error** | Red left border (`border-l-2 border-error`), error icon, retry button |
| **Loading (skeleton)** | 3 animated pulse bars (`animate-pulse bg-bg-hover rounded`) |

#### shadcn/ui Components Used

- `Avatar` — user and assistant avatars
- `Button` (ghost variant) — copy, regenerate actions
- `Tooltip` — hover labels for action buttons
- `Separator` — between message body and action toolbar

#### Tailwind Classes

```tsx
// User message container
<div className="flex justify-end gap-3 px-4 py-3">
  <div className="max-w-[80%] rounded-lg rounded-br-sm bg-accent/10 px-4 py-3 text-text-primary">
    {/* message content */}
  </div>
  <Avatar className="size-8 shrink-0" />
</div>

// Assistant message container
<div className="flex justify-start gap-3 px-4 py-3">
  <Avatar className="size-8 shrink-0 ring-2 ring-provider-openai/30" />
  <div className="max-w-[80%] rounded-lg rounded-bl-sm bg-bg-elevated px-4 py-3 text-text-primary">
    {/* message content with markdown rendering */}
  </div>
</div>
```

#### Animation

```css
/* Message appear animation */
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  animation: message-in 150ms ease-out;
}
```

---

### 4.2 MessageInput

The primary text input area where users type messages.

#### Visual Appearance

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Ask anything...                                        ➤   │
│  (auto-growing textarea, 1-8 lines)                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  📎 Attach │ ● GPT-4o ▾  │              Ctrl+Enter to send  │
└──────────────────────────────────────────────────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Empty** | Placeholder text "Ask anything..." in `text-muted`. Send button is `opacity-30`, disabled. |
| **Typing** | Text appears in `text-primary`. Send button becomes `opacity-100` with accent color. Textarea auto-grows up to `max-h-[200px]`. |
| **Sending** | Input disabled. Send button shows spinner. Textarea has `opacity-50`. |
| **Streaming** | Input disabled. Send button becomes a stop button (■ square icon, red). "Stop Generating" label on hover. |
| **Disabled (no API key)** | Entire input area dimmed. Placeholder: "Configure an API key in Settings to start chatting". Click anywhere opens Settings. |

#### shadcn/ui Components Used

- `Textarea` — auto-growing text input (custom auto-resize via React ref)
- `Button` — send button (icon variant)
- `DropdownMenu` / `Command` — model selector
- `Tooltip` — keyboard shortcut hints

#### Tailwind Classes

```tsx
<div className="border-t border-border-default bg-bg-main p-4">
  <div className="mx-auto max-w-3xl">
    <div className="relative rounded-xl border border-border-default bg-bg-input
                    shadow-sm transition-colors duration-fast
                    focus-within:border-border-focus focus-within:shadow-glow">
      <textarea
        className="w-full resize-none bg-transparent px-4 pt-3 pb-10
                   text-base text-text-primary placeholder:text-text-muted
                   focus:outline-none"
        placeholder="Ask anything..."
        rows={1}
      />
      {/* Send button */}
      <button
        className="absolute right-3 bottom-3 flex size-8 items-center justify-center
                   rounded-lg bg-accent text-white transition-all duration-fast
                   hover:bg-accent-hover hover:scale-105 active:scale-95
                   disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>

    {/* Bottom toolbar */}
    <div className="mt-2 flex items-center justify-between px-1 text-xs text-text-muted">
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1 hover:text-text-secondary transition-colors">
          <Paperclip className="size-3.5" /> Attach
        </button>
        <ModelSelector />
      </div>
      <span>Ctrl+Enter to send</span>
    </div>
  </div>
</div>
```

#### Auto-resize Behavior

```ts
// Auto-resize textarea to content, max 200px
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
};
```

---

### 4.3 Sidebar

The left navigation panel containing conversation history.

#### Visual Appearance

```
┌─────────────────────────┐
│                         │
│  ✦ GokChat        [◀]  │  ← Collapse toggle (hide to icon-only rail)
│                         │
│  ┌───────────────────┐  │
│  │ + New Chat    ⌘N  │  │  ← Primary action (accent bg on hover)
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🔍 Search...  ⌘K  │  │  ← Opens command palette style search
│  └───────────────────┘  │
│                         │
│  TODAY                  │  ← text-xs uppercase tracking-wider text-muted
│  ┌───────────────────┐  │
│  │ ● Tauri Setup     │  │  ← Active conversation (bg-bg-active)
│  │   Setting up a... │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ ● React Hooks     │  │  ← Inactive (bg-transparent)
│  │   useEffect vs... │  │
│  └───────────────────┘  │
│                         │
│  YESTERDAY              │
│  ┌───────────────────┐  │
│  │ ● API Design      │  │
│  │   REST vs Graph... │  │
│  └───────────────────┘  │
│                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                         │
│  (scrollable)           │
│                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                         │
│  ⚙ Settings        ⌘,  │  ← Bottom-pinned
│                         │
└─────────────────────────┘
```

#### Collapsed State (Icon Rail)

```
┌────┐
│ ✦  │  ← Logo icon only
│    │
│ [+]│  ← New chat icon
│    │
│ 🔍 │  ← Search icon
│    │
│ ●  │  ← Recent chat dots (tooltip on hover shows title)
│ ●  │
│ ●  │
│ ●  │
│    │
│ ⚙  │  ← Settings icon
└────┘
 48px
```

#### States

| State | Visual Treatment |
|---|---|
| **Expanded** | Full 240px width, shows text labels, conversation previews |
| **Collapsed** | 48px icon rail, tooltip on hover for each item |
| **Searching** | Search input focused, list filters in real-time, fuzzy match highlight |
| **Dragging** | (Future) Drag to reorder with `cursor-grabbing`, drop-shadow on dragged item |

#### shadcn/ui Components Used

- `ScrollArea` — scrollable conversation list with custom scrollbar
- `Button` (ghost variant) — new chat, settings
- `Input` — search field
- `Tooltip` — collapsed sidebar labels
- `ContextMenu` — right-click on conversation (rename, delete, export)

#### Tailwind Classes

```tsx
<aside
  className={cn(
    "flex h-full flex-col border-r border-border-default bg-bg-sidebar transition-all duration-slow",
    isCollapsed ? "w-12" : "w-60"
  )}
>
  {/* Header */}
  <div className="flex h-12 items-center justify-between px-4">
    <span className="text-sm font-semibold text-text-primary">✦ GokChat</span>
    <Button variant="ghost" size="icon" onClick={toggleCollapse}>
      <PanelLeftClose className="size-4" />
    </Button>
  </div>

  {/* New Chat */}
  <div className="px-3 py-2">
    <Button className="w-full justify-start gap-2" variant="outline">
      <Plus className="size-4" /> New Chat
    </Button>
  </div>

  {/* Search */}
  <div className="px-3 py-1">
    <Input placeholder="Search..." className="h-8 bg-bg-input text-sm" />
  </div>

  {/* Conversation List */}
  <ScrollArea className="flex-1 px-2">
    {/* Date groups + ConversationItems */}
  </ScrollArea>

  {/* Bottom Settings */}
  <div className="border-t border-border-default px-3 py-2">
    <Button variant="ghost" className="w-full justify-start gap-2 text-text-secondary">
      <Settings className="size-4" /> Settings
    </Button>
  </div>
</aside>
```

---

### 4.4 ConversationItem

Each row in the sidebar conversation list.

#### Visual Appearance

```
Default:
┌───────────────────────────┐
│  ● Tauri Setup            │  ← Title (text-sm font-medium, truncated)
│    Setting up a new...    │  ← Preview (text-xs text-muted, truncated)
└───────────────────────────┘

Active:
┌───────────────────────────┐
│▎ ● Tauri Setup            │  ← Left accent bar (2px, accent color)
│▎   Setting up a new...    │     bg-bg-active
└───────────────────────────┘

Hovered (with actions):
┌───────────────────────────┐
│  ● Tauri Setup   ✏ 🗑    │  ← Rename + Delete icons appear on hover
│    Setting up a new...    │
└───────────────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Default** | `bg-transparent`, `text-text-secondary` |
| **Hover** | `bg-bg-hover`, action icons (edit, delete) fade in at right |
| **Active** | `bg-bg-active`, left accent bar `border-l-2 border-accent`, `text-text-primary` |
| **Deleting** | Confirmation popover: "Delete this conversation?" with Cancel / Delete buttons |

#### shadcn/ui Components Used

- `Button` (ghost, icon) — edit, delete actions
- `Popover` or `AlertDialog` — delete confirmation
- `ContextMenu` — right-click menu (Rename, Duplicate, Export, Delete)

#### Tailwind Classes

```tsx
<button
  className={cn(
    "group flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors duration-fast",
    isActive
      ? "border-l-2 border-accent bg-bg-active text-text-primary"
      : "hover:bg-bg-hover text-text-secondary"
  )}
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 truncate">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: providerColor }}
      />
      <span className="truncate text-sm font-medium">{title}</span>
    </div>
    <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <Button variant="ghost" size="icon" className="size-6">
        <Pencil className="size-3" />
      </Button>
      <Button variant="ghost" size="icon" className="size-6 text-error hover:text-error">
        <Trash2 className="size-3" />
      </Button>
    </div>
  </div>
  <span className="truncate text-xs text-text-muted">{preview}</span>
</button>
```

---

### 4.5 ProviderBadge

A small colored pill indicating which AI provider is active.

#### Visual Appearance

```
┌──────────────────┐
│  ● OpenAI        │  ← Green dot + text
└──────────────────┘

┌──────────────────┐
│  ● Claude        │  ← Orange dot + text
└──────────────────┘

┌──────────────────┐
│  ● Ollama        │  ← Gray dot + text
└──────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Connected** | Provider color dot (solid), name text |
| **Disconnected** | Gray dot (outline only), name text dimmed, tooltip: "API key not configured" |
| **Error** | Red dot (pulsing), tooltip: "Connection error" |

#### Tailwind Classes

```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-bg-elevated
                 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
  <span
    className={cn(
      "size-2 rounded-full",
      isConnected ? "bg-provider-openai" : "border border-text-muted"
    )}
  />
  {providerName}
</span>
```

---

### 4.6 SettingsModal

The main settings dialog, organized into tabs.

#### Visual Appearance

```
Centered modal overlay, 640px wide, max-h-[85vh], scrollable tab content.

┌──────────────────────────────────────────────┐
│  ╳                  Settings                 │  ← Dialog title + close button
├──────────────────────────────────────────────┤
│  [🔑 Keys] [🔌 Providers] [🎨 Look] [💾 Data] │  ← Tab triggers
├──────────────────────────────────────────────┤
│                                              │
│  (Tab content area, scrollable)              │
│                                              │
│  ...                                         │
│                                              │
└──────────────────────────────────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Opening** | Background dims with `bg-black/60 backdrop-blur-sm`. Modal scales from 95% to 100% with `duration-spring` easing. |
| **Active Tab** | Tab trigger has accent underline (2px), `text-text-primary`, `font-medium` |
| **Inactive Tab** | `text-text-muted`, no underline |
| **Closing** | Reverse of opening: scale 100% → 95%, fade out |

#### shadcn/ui Components Used

- `Dialog` — modal overlay and container
- `DialogContent` — the modal panel
- `DialogHeader` / `DialogTitle` — header row
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` — tab navigation
- `Input` — API key inputs
- `Button` — validate, save, danger actions
- `Slider` — temperature control
- `Select` — model selection, code theme
- `RadioGroup` — theme, font size, density options
- `Switch` — boolean toggles
- `Separator` — section dividers
- `AlertDialog` — danger zone confirmations

#### Tailwind Classes

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-[640px] max-h-[85vh] overflow-hidden
                            rounded-xl border border-border-default bg-bg-elevated
                            shadow-lg p-0">
    <DialogHeader className="border-b border-border-default px-6 py-4">
      <DialogTitle className="text-lg font-semibold text-text-primary">
        Settings
      </DialogTitle>
    </DialogHeader>

    <Tabs defaultValue="keys" className="flex flex-col">
      <TabsList className="flex border-b border-border-default px-6">
        <TabsTrigger value="keys" className="gap-1.5 text-sm">
          <Key className="size-4" /> Keys
        </TabsTrigger>
        {/* ... other tabs */}
      </TabsList>

      <TabsContent value="keys" className="overflow-y-auto p-6">
        {/* Provider key cards */}
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

#### Animation

```css
/* Modal entrance */
.dialog-content {
  animation: modal-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Overlay fade */
.dialog-overlay {
  animation: overlay-in 150ms ease-out;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

---

### 4.7 ModelSelector

A combobox dropdown for selecting the active AI model. Appears in the message input toolbar and the chat header.

#### Visual Appearance

```
Closed:
┌───────────────────┐
│  ● GPT-4o      ▾  │
└───────────────────┘

Open (Command palette style):
┌───────────────────────────────────────┐
│  🔍 Search models...                  │
├───────────────────────────────────────┤
│                                       │
│  OPENAI                               │  ← Provider group header
│  ├─ ● GPT-4o             ✓           │  ← Selected (checkmark)
│  ├─ ● GPT-4o-mini                    │
│  ├─ ● o1                             │
│  ├─ ● o1-mini                        │
│  │                                    │
│  ANTHROPIC                            │
│  ├─ ● Claude 4 Sonnet                │
│  ├─ ● Claude 3.5 Haiku               │
│  ├─ ● Claude 4 Opus                  │
│  │                                    │
│  OLLAMA (LOCAL)                       │
│  ├─ ● llama3.1:8b                    │
│  ├─ ● codellama:13b                  │
│  │                                    │
│  ─────────────────────────────────    │
│  ⚙ Manage Providers...               │
│                                       │
└───────────────────────────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Closed** | Compact pill with provider dot + model name + chevron |
| **Open** | Popover below trigger, full model list with search |
| **Searching** | Real-time filter, matching text highlighted with `bg-accent/20` |
| **No Results** | "No models found" message with link to Settings |
| **Loading** | Skeleton shimmer while fetching available models |

#### shadcn/ui Components Used

- `Popover` — container
- `Command` / `CommandInput` / `CommandList` / `CommandGroup` / `CommandItem` — searchable list (Raycast-style)
- `Badge` — provider label in group headers

#### Tailwind Classes

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="ghost"
      className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: providerColor }}
      />
      {modelName}
      <ChevronDown className="size-3 opacity-50" />
    </Button>
  </PopoverTrigger>

  <PopoverContent className="w-[300px] p-0 rounded-xl border-border-default shadow-lg">
    <Command className="bg-bg-elevated">
      <CommandInput placeholder="Search models..." className="text-sm" />
      <CommandList className="max-h-[300px]">
        <CommandGroup heading="OpenAI">
          <CommandItem className="gap-2 text-sm">
            <span className="size-2 rounded-full bg-provider-openai" />
            GPT-4o
            {isSelected && <Check className="ml-auto size-4 text-accent" />}
          </CommandItem>
          {/* ... */}
        </CommandGroup>
        {/* ... other provider groups */}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

---

### 4.8 StreamingIndicator

Displayed while the AI model is generating a response.

#### Visual Appearance

```
While waiting for first token:
┌──────────────────────────────────────┐
│  🤖  ●  ●  ●                         │  ← Three dots, pulsing sequentially
└──────────────────────────────────────┘

While streaming text:
┌──────────────────────────────────────┐
│  🤖  The quick brown fox jumps▌      │  ← Blinking cursor at end of text
│                                      │
│      over the lazy dog. This is      │
│      a longer response that...▌      │  ← Cursor follows latest text
└──────────────────────────────────────┘

Bottom bar during streaming:
┌──────────────────────────────────────┐
│      ■ Stop Generating               │  ← Clickable, replaces Send button
└──────────────────────────────────────┘
```

#### States

| State | Visual Treatment |
|---|---|
| **Waiting** | Three dots with staggered `animate-pulse`. Each dot is `size-2 rounded-full bg-text-muted`. |
| **Streaming** | Text renders character by character. Blinking block cursor `▌` at the insertion point with `animate-pulse` at 500ms interval. |
| **Stopping** | "Stopping..." label replaces stop button, spinner icon |
| **Complete** | Cursor disappears. Full action toolbar fades in. |

#### Animation CSS

```css
/* Pulsing dots */
@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.streaming-dot:nth-child(1) { animation: dot-pulse 1.4s ease-in-out infinite; }
.streaming-dot:nth-child(2) { animation: dot-pulse 1.4s ease-in-out 0.2s infinite; }
.streaming-dot:nth-child(3) { animation: dot-pulse 1.4s ease-in-out 0.4s infinite; }

/* Blinking cursor */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.streaming-cursor {
  animation: blink 1s step-end infinite;
  color: var(--color-accent);
}
```

#### Tailwind Classes

```tsx
// Waiting dots
<div className="flex items-center gap-1.5 px-4 py-3">
  <span className="streaming-dot size-2 rounded-full bg-text-muted" />
  <span className="streaming-dot size-2 rounded-full bg-text-muted" />
  <span className="streaming-dot size-2 rounded-full bg-text-muted" />
</div>

// Streaming cursor
<span className="streaming-cursor text-accent">▌</span>

// Stop button
<Button
  variant="outline"
  size="sm"
  className="gap-1.5 text-xs text-error border-error/30 hover:bg-error/10"
  onClick={stopGeneration}
>
  <Square className="size-3 fill-current" /> Stop Generating
</Button>
```

---

### 4.9 WelcomeScreen

The empty state shown when no conversations exist or a new chat has no messages.

#### Visual Appearance

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                          ✦                                       │  ← Large app icon (48px)
│                                                                  │
│                      GokChat                                     │  ← text-2xl font-bold
│                                                                  │
│            Your AI, Your Keys, Your Privacy.                     │  ← text-base text-muted
│                                                                  │
│                                                                  │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│     │             │  │             │  │             │          │
│     │  ● OpenAI   │  │  ● Claude   │  │  ● Custom   │          │
│     │             │  │             │  │             │          │
│     │  GPT-4o,    │  │  Sonnet,    │  │  Ollama,    │          │
│     │  GPT-4o-    │  │  Haiku,     │  │  Groq,      │          │
│     │  mini, o1   │  │  Opus       │  │  OpenRouter  │          │
│     │             │  │             │  │             │          │
│     │  ✓ Ready    │  │  ○ Not Set  │  │  ○ Not Set  │          │
│     │             │  │             │  │             │          │
│     └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                  │
│                                                                  │
│     ┌───────────────────────────────────────────────────┐       │
│     │  💬  Try asking:                                   │       │
│     │                                                    │       │
│     │  "Explain quantum computing in simple terms"       │  ← Clickable suggestion
│     │  "Write a Python script to sort a list"            │  ← Clickable suggestion
│     │  "Compare REST and GraphQL architectures"          │  ← Clickable suggestion
│     │  "Help me debug this React component"              │  ← Clickable suggestion
│     └───────────────────────────────────────────────────┘       │
│                                                                  │
│     ┌───────────────────────────────────────────────────┐       │
│     │  🔒 Your API keys are stored locally using your    │       │
│     │     OS keychain and never sent to any server       │       │
│     │     except the AI providers you configure.         │       │
│     └───────────────────────────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Provider Setup Cards

Each card is a self-contained component:

```
CONNECTED STATE:                     NOT SET STATE:
┌──────────────────┐                ┌──────────────────┐
│                  │                │                  │
│  ● OpenAI        │                │  ● Anthropic     │
│                  │                │                  │
│  Models:         │                │  Models:         │
│  GPT-4o, o1...   │                │  Sonnet, Haiku.. │
│                  │                │                  │
│  ✓ Connected     │  ← green      │  ○ Not Set       │  ← muted
│                  │                │                  │
│  [Manage →]      │                │  [Add Key →]     │  ← accent CTA
│                  │                │                  │
└──────────────────┘                └──────────────────┘
```

#### shadcn/ui Components Used

- `Card` / `CardHeader` / `CardContent` — provider setup cards
- `Button` — add key, manage, suggestion clicks
- `Badge` — connection status indicators
- `Alert` — privacy notice at bottom

#### Tailwind Classes

```tsx
// Welcome container
<div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
  {/* Logo */}
  <div className="mb-4 text-5xl">✦</div>
  <h1 className="text-2xl font-bold text-text-primary">GokChat</h1>
  <p className="mt-2 text-base text-text-muted">
    Your AI, Your Keys, Your Privacy.
  </p>

  {/* Provider cards */}
  <div className="mt-8 grid grid-cols-3 gap-4">
    {providers.map(p => (
      <Card
        key={p.id}
        className="w-[180px] border-border-default bg-bg-elevated
                   transition-all duration-normal hover:border-border-hover
                   hover:shadow-md"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full bg-provider-${p.id}`} />
            <span className="text-sm font-semibold text-text-primary">{p.name}</span>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-text-muted">
          <p>{p.models}</p>
          <Badge variant={p.connected ? "success" : "secondary"} className="mt-2">
            {p.connected ? "✓ Connected" : "○ Not Set"}
          </Badge>
          <Button variant="link" size="sm" className="mt-2 p-0 text-accent">
            {p.connected ? "Manage →" : "Add Key →"}
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* Suggestions */}
  <div className="mt-8 w-full max-w-md rounded-xl border border-border-default bg-bg-elevated p-4">
    <p className="mb-3 text-sm font-medium text-text-secondary">💬 Try asking:</p>
    {suggestions.map(s => (
      <button
        key={s}
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary
                   transition-colors duration-fast hover:bg-bg-hover hover:text-text-primary"
        onClick={() => sendMessage(s)}
      >
        "{s}"
      </button>
    ))}
  </div>
</div>
```

---

### 4.10 CodeBlock

Syntax-highlighted code blocks rendered within assistant messages.

#### Visual Appearance

```
┌─ javascript ─────────────────────────────── 📋 Copy ─┐
│                                                       │
│  1 │ function fibonacci(n) {                          │
│  2 │   if (n <= 1) return n;                          │
│  3 │   return fibonacci(n - 1) + fibonacci(n - 2);   │
│  4 │ }                                                │
│  5 │                                                  │
│  6 │ console.log(fibonacci(10)); // 55                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### Header Bar

```
┌───────────────────────────────────────────────────────┐
│  javascript                                   📋 Copy │
└───────────────────────────────────────────────────────┘
  ↑ language label                          copy button ↑
  text-xs text-text-muted               ghost button, text-xs
  bg-bg-active (slightly darker than code body)
```

#### States

| State | Visual Treatment |
|---|---|
| **Default** | Syntax-highlighted code, language label, copy button |
| **Hover (copy)** | Copy button: `hover:bg-bg-hover`, tooltip "Copy code" |
| **Copied** | Button changes to `✓ Copied!` in green for 2 seconds, then reverts |
| **Long Code** | Max height `max-h-[400px]` with `overflow-y-auto` and gradient fade at bottom. "Show more" toggle expands. |
| **Streaming** | Code appears token by token. Language label may update as parser detects language. Syntax highlighting reapplies on each chunk. |

#### shadcn/ui Components Used

- `Button` (ghost, icon) — copy action
- `Tooltip` — "Copy code" / "Copied!" feedback
- `ScrollArea` — for long code blocks

#### Syntax Highlighting

Use `shiki` or `react-syntax-highlighter` with a dark theme matching the app palette:

```tsx
// Recommended: shiki with custom theme
import { codeToHtml } from 'shiki';

const theme = {
  name: 'gokchat-dark',
  type: 'dark',
  colors: {
    'editor.background': 'hsl(240 10% 8%)',    // bg-main
    'editor.foreground': 'hsl(0 0% 90%)',       // text-primary
  },
  // ... token colors
};
```

#### Tailwind Classes

```tsx
<div className="group relative my-3 overflow-hidden rounded-lg border border-border-default">
  {/* Header */}
  <div className="flex items-center justify-between border-b border-border-default
                  bg-bg-active px-4 py-1.5">
    <span className="text-xs font-medium text-text-muted">{language}</span>
    <Button
      variant="ghost"
      size="sm"
      className="h-6 gap-1 px-2 text-xs text-text-muted hover:text-text-primary"
      onClick={copyToClipboard}
    >
      {copied ? (
        <>
          <Check className="size-3 text-success" /> Copied!
        </>
      ) : (
        <>
          <Copy className="size-3" /> Copy
        </>
      )}
    </Button>
  </div>

  {/* Code Body */}
  <div className="overflow-x-auto bg-bg-main p-4">
    <pre className="font-mono text-[13px] leading-relaxed">
      <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  </div>
</div>
```

#### Inline Code

For inline code within paragraphs:

```tsx
<code className="rounded-sm bg-bg-elevated px-1.5 py-0.5 font-mono text-[13px]
                 text-accent">
  useState
</code>
```

---

## 5. Responsive Behavior

### Window Size Handling

| Breakpoint | Width | Behavior |
|---|---|---|
| **Minimum** | 800×600px | Hard minimum enforced by Tauri `minWidth`/`minHeight` |
| **Small** | 800–1000px | Sidebar auto-collapses to icon rail. Info panel hidden. |
| **Medium** | 1000–1400px | Sidebar visible (240px). Info panel hidden by default. |
| **Large** | 1400px+ | All three panels visible. Info panel shown. |

### Sidebar Behavior

```
EXPANDED (≥ 1000px or manual toggle):
┌──────────────┬───────────────────────────────┐
│   Sidebar    │         Chat Area             │
│   (240px)    │         (flex-1)              │
└──────────────┴───────────────────────────────┘

COLLAPSED (< 1000px or manual toggle):
┌────┬────────────────────────────────────────┐
│Rail│            Chat Area                   │
│48px│            (flex-1)                    │
└────┴────────────────────────────────────────┘

HIDDEN (user choice via Ctrl+[):
┌────────────────────────────────────────────┐
│              Chat Area                     │
│              (full width)                  │
└────────────────────────────────────────────┘
```

### Chat Area Scaling

```
NARROW WINDOW (800px total):
┌───────────────────────────────────────┐
│                                       │
│  Messages fill available width        │
│  max-w-3xl constrained to ~95%       │
│  Padding reduced to px-3             │
│                                       │
│  Input area full width               │
│                                       │
└───────────────────────────────────────┘

WIDE WINDOW (1400px+):
┌──────────────────────────────────────────────────────┐
│                                                      │
│           ┌─ Messages (max-w-3xl) ─┐                │
│           │                        │                 │
│           │  Centered, comfortable │                 │
│           │  reading width         │                 │
│           │                        │                 │
│           └────────────────────────┘                 │
│                                                      │
│           ┌─ Input (max-w-3xl) ────┐                │
│           │                        │                 │
│           └────────────────────────┘                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Info Panel Behavior

- Default: **Hidden**
- Toggle via toolbar button (top-right of chat area) or `Ctrl+I`
- Slides in from right with `transition-all duration-slow`
- Content: current model info, context window, pricing, session token usage
- On narrow windows: overlays as a sheet/drawer instead of pushing chat area

---

## 6. Keyboard Shortcuts

### Global Shortcuts

| Shortcut | macOS | Windows/Linux | Action |
|---|---|---|---|
| New Chat | `⌘ N` | `Ctrl+N` | Creates a new conversation and focuses the input |
| Search Chats | `⌘ K` | `Ctrl+K` | Opens command palette / search in sidebar |
| Settings | `⌘ ,` | `Ctrl+,` | Opens settings modal |
| Send Message | `⌘ Enter` | `Ctrl+Enter` | Sends the current message (configurable) |
| Stop Generation | `Escape` | `Escape` | Stops streaming response / closes modal |
| Toggle Theme | `⌘ Shift T` | `Ctrl+Shift+T` | Switches between dark/light/system |
| Toggle Sidebar | `⌘ [` | `Ctrl+[` | Expands/collapses sidebar |
| Toggle Info Panel | `⌘ I` | `Ctrl+I` | Shows/hides right info panel |
| Focus Input | `⌘ L` | `Ctrl+L` | Focuses the message input textarea |

### Chat Navigation

| Shortcut | macOS | Windows/Linux | Action |
|---|---|---|---|
| Previous Chat | `⌘ ↑` | `Ctrl+↑` | Switches to previous conversation |
| Next Chat | `⌘ ↓` | `Ctrl+↓` | Switches to next conversation |
| Close Chat | `⌘ W` | `Ctrl+W` | Closes current conversation |
| Copy Last Response | `⌘ Shift C` | `Ctrl+Shift+C` | Copies the last assistant message |

### In-Message Shortcuts

| Shortcut | macOS | Windows/Linux | Action |
|---|---|---|---|
| New Line | `Shift Enter` | `Shift+Enter` | Inserts newline in input (when send-on-Enter mode) |
| Select All | `⌘ A` | `Ctrl+A` | Selects all text in input |

### Implementation

```tsx
// useKeyboardShortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'n') { e.preventDefault(); newChat(); }
      if (mod && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (mod && e.key === ',') { e.preventDefault(); openSettings(); }
      if (mod && e.key === 'Enter') { e.preventDefault(); sendMessage(); }
      if (e.key === 'Escape') { closeModalOrStopGeneration(); }
      if (mod && e.shiftKey && e.key === 'T') { e.preventDefault(); toggleTheme(); }
      if (mod && e.key === '[') { e.preventDefault(); toggleSidebar(); }
      if (mod && e.key === 'i') { e.preventDefault(); toggleInfoPanel(); }
      if (mod && e.key === 'l') { e.preventDefault(); focusInput(); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```

---

## 7. Animations & Micro-interactions

### 7.1 Message Appear Animation

New messages slide up and fade in when added to the conversation.

```css
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter {
  animation: message-in 150ms ease-out forwards;
}
```

**Behavior:**
- User messages appear immediately with animation
- Assistant messages: animation plays when the first token arrives
- Scrolls to bottom smoothly as new messages appear: `scrollIntoView({ behavior: 'smooth' })`

### 7.2 Streaming Text

```
Character-by-character rendering with blinking cursor:

Frame 1: "The q▌"
Frame 2: "The qu▌"
Frame 3: "The qui▌"
Frame 4: "The quic▌"
Frame 5: "The quick▌"
...
```

**Implementation:**
- Text is rendered as it arrives from the SSE/WebSocket stream
- A `<span className="streaming-cursor">▌</span>` is appended after the last character
- Cursor blinks at 1s interval using CSS animation
- Markdown is parsed incrementally (use `marked` or `react-markdown` with streaming support)
- Code blocks syntax-highlight progressively

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.streaming-cursor {
  animation: blink 1s step-end infinite;
  color: var(--color-accent);
  font-weight: 700;
}
```

### 7.3 Sidebar Interactions

```css
/* Conversation item hover */
.conversation-item {
  transition: background-color 100ms ease-out;
}

.conversation-item:hover {
  background-color: var(--color-bg-hover);
}

/* Action icons appear on hover */
.conversation-item .actions {
  opacity: 0;
  transition: opacity 100ms ease-out;
}

.conversation-item:hover .actions {
  opacity: 1;
}

/* Active item left border */
.conversation-item.active {
  border-left: 2px solid var(--color-accent);
  background-color: var(--color-bg-active);
}

/* Sidebar collapse/expand */
.sidebar {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 7.4 Theme Toggle

Smooth transition of all theme-dependent colors:

```css
/* Apply to root element */
:root {
  transition:
    background-color 300ms ease-in-out,
    color 300ms ease-in-out,
    border-color 300ms ease-in-out;
}

/* All themed elements transition */
*,
*::before,
*::after {
  transition:
    background-color 300ms ease-in-out,
    color 300ms ease-in-out,
    border-color 300ms ease-in-out,
    box-shadow 300ms ease-in-out;
}
```

**Behavior:**
- Theme preference stored in `localStorage` and synced to Tauri store
- `<html>` element gets `class="dark"` or `class="light"`
- System preference detected via `matchMedia('(prefers-color-scheme: dark)')`
- Transition applies to all color properties simultaneously for a smooth crossfade

### 7.5 Modal Animations

```css
/* Modal overlay */
.modal-overlay {
  animation: overlay-fade 150ms ease-out;
}

@keyframes overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal content */
.modal-content {
  animation: modal-spring 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-spring {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Modal exit */
.modal-content[data-state="closed"] {
  animation: modal-out 150ms ease-in;
}

@keyframes modal-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

### 7.6 Send Button Micro-interactions

```css
.send-button {
  transition: all 100ms ease-out;
}

/* Hover: subtle pulse/glow */
.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 12px var(--color-accent) / 0.3;
}

/* Active: press down */
.send-button:active {
  transform: scale(0.92);
}

/* Disabled: dim */
.send-button:disabled {
  opacity: 0.3;
  transform: none;
  cursor: not-allowed;
}
```

### 7.7 Provider Switch Crossfade

When switching providers/models in a new conversation:

```css
.provider-badge {
  transition: all 150ms ease-out;
}

/* Crossfade animation for switching */
@keyframes provider-switch {
  0%   { opacity: 1; transform: translateY(0); }
  40%  { opacity: 0; transform: translateY(-4px); }
  60%  { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}

.provider-switching {
  animation: provider-switch 300ms ease-in-out;
}
```

### 7.8 Input Focus Animation

```css
.message-input-container {
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;
}

.message-input-container:focus-within {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 2px var(--color-accent) / 0.1,
              0 0 20px var(--color-accent) / 0.05;
}
```

### 7.9 Copy Feedback

```tsx
// Copy button state machine
const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

const handleCopy = async () => {
  await navigator.clipboard.writeText(code);
  setCopyState('copied');
  setTimeout(() => setCopyState('idle'), 2000);
};

// Visual: icon transitions from Copy → Check with color change
<Button variant="ghost" size="sm" onClick={handleCopy}>
  <span className={cn(
    "flex items-center gap-1 transition-all duration-normal",
    copyState === 'copied' ? "text-success" : "text-text-muted"
  )}>
    {copyState === 'copied' ? <Check className="size-3" /> : <Copy className="size-3" />}
    {copyState === 'copied' ? 'Copied!' : 'Copy'}
  </span>
</Button>
```

### 7.10 Loading Skeleton for Messages

```tsx
// Skeleton placeholder while loading conversation history
<div className="space-y-4 px-4 py-6">
  {[1, 2, 3].map(i => (
    <div key={i} className="flex gap-3">
      <div className="size-8 animate-pulse rounded-full bg-bg-hover" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-bg-hover" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-bg-hover" />
      </div>
    </div>
  ))}
</div>
```

---

## Appendix A: File Structure Reference

```
src/
├── components/
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── StreamingIndicator.tsx
│   │   ├── CodeBlock.tsx
│   │   └── ChatArea.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── ConversationList.tsx
│   │   └── SidebarSearch.tsx
│   ├── settings/
│   │   ├── SettingsModal.tsx
│   │   ├── ApiKeysTab.tsx
│   │   ├── ProvidersTab.tsx
│   │   ├── AppearanceTab.tsx
│   │   └── DataTab.tsx
│   ├── shared/
│   │   ├── ProviderBadge.tsx
│   │   ├── ModelSelector.tsx
│   │   └── ThemeToggle.tsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx
│   │   └── WelcomeScreen.tsx
│   └── layout/
│       ├── AppLayout.tsx
│       ├── TitleBar.tsx
│       └── InfoPanel.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useTheme.ts
│   ├── useAutoResize.ts
│   └── useStreaming.ts
├── styles/
│   ├── index.css          ← @theme tokens, base styles
│   └── animations.css     ← keyframe definitions
└── lib/
    ├── providers/         ← API client abstractions
    ├── store/             ← Zustand stores
    └── utils.ts           ← cn() helper, formatters
```

---

## Appendix B: shadcn/ui Components Inventory

All shadcn/ui components required for the initial release:

| Component | Usage |
|---|---|
| `Alert` | Privacy notice, error messages |
| `AlertDialog` | Destructive confirmations (delete chat, clear data) |
| `Avatar` | User and assistant message avatars |
| `Badge` | Provider badges, status indicators |
| `Button` | All interactive buttons (variants: default, ghost, outline, destructive) |
| `Card` | Provider setup cards, settings sections |
| `Command` | Model selector (Raycast-style palette) |
| `ContextMenu` | Right-click on conversation items |
| `Dialog` | Settings modal, onboarding flow |
| `DropdownMenu` | Overflow menus, sort options |
| `Input` | Text inputs for API keys, search, URLs |
| `Label` | Form field labels |
| `Popover` | Model selector container, quick actions |
| `RadioGroup` | Theme, font size, density selection |
| `ScrollArea` | Sidebar conversation list, long code blocks |
| `Select` | Model dropdown, code theme picker |
| `Separator` | Visual dividers between sections |
| `Slider` | Temperature control |
| `Switch` | Boolean toggles |
| `Tabs` | Settings modal navigation |
| `Textarea` | Message input |
| `Tooltip` | Keyboard shortcut hints, button labels |

---

## Appendix C: Design Tokens Quick Reference

```css
/* Copy-paste-ready Tailwind v4 @theme block */
@theme {
  /* Backgrounds */
  --color-bg-base: hsl(240 10% 4%);
  --color-bg-sidebar: hsl(240 10% 6%);
  --color-bg-main: hsl(240 10% 8%);
  --color-bg-elevated: hsl(240 10% 12%);
  --color-bg-hover: hsl(240 10% 14%);
  --color-bg-active: hsl(240 10% 16%);
  --color-bg-input: hsl(240 10% 10%);

  /* Text */
  --color-text-primary: hsl(0 0% 95%);
  --color-text-secondary: hsl(240 5% 65%);
  --color-text-muted: hsl(240 4% 46%);

  /* Borders */
  --color-border-default: hsl(240 6% 16%);
  --color-border-hover: hsl(240 5% 26%);
  --color-border-focus: hsl(240 5% 48%);

  /* Accent */
  --color-accent: hsl(262 83% 64%);
  --color-accent-hover: hsl(262 83% 58%);

  /* Semantic */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);

  /* Providers */
  --color-provider-openai: hsl(160 84% 39%);
  --color-provider-anthropic: hsl(25 95% 53%);
  --color-provider-custom: hsl(217 91% 60%);

  /* Animation */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 300ms;
}
```

---

*This document serves as the single source of truth for GokChat's UI/UX implementation. All components, colors, animations, and layouts described here should be implemented faithfully to ensure a cohesive, premium user experience across all platforms.*
