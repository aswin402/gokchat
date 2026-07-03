-- Enable WAL mode for better concurrent access
-- PRAGMA journal_mode = WAL;
-- PRAGMA foreign_keys = ON;

-- ============================================================
-- conversations
-- Stores metadata about each chat conversation.
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY NOT NULL,       -- UUIDv4
    title           TEXT NOT NULL DEFAULT 'New Chat',
    provider        TEXT NOT NULL,                   -- 'openai' | 'anthropic' | 'openai_compatible'
    model           TEXT NOT NULL,                   -- e.g., 'gpt-4o', 'claude-sonnet-4-20250514'
    system_prompt   TEXT,                            -- Custom system prompt, nullable
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    pinned          INTEGER NOT NULL DEFAULT 0,      -- 0 = false, 1 = true
    archived        INTEGER NOT NULL DEFAULT 0       -- 0 = false, 1 = true
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON conversations(pinned);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived);

-- ============================================================
-- messages
-- Stores individual messages within a conversation.
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY NOT NULL,       -- UUIDv4
    conversation_id TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content         TEXT NOT NULL,
    tokens_used     INTEGER,                         -- Token count for this message, nullable
    model           TEXT NOT NULL,                   -- Model that generated/received this message
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at ASC);

-- ============================================================
-- provider_configs
-- Stores per-provider configuration (base URL, defaults).
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_configs (
    provider        TEXT PRIMARY KEY NOT NULL,       -- 'openai' | 'anthropic' | 'openai_compatible'
    base_url        TEXT NOT NULL,
    default_model   TEXT NOT NULL,
    temperature     REAL NOT NULL DEFAULT 0.7,
    max_tokens      INTEGER NOT NULL DEFAULT 4096,
    top_p           REAL,
    frequency_penalty REAL,
    presence_penalty  REAL,
    custom_name     TEXT                             -- Display name for openai_compatible providers
);

-- Seed default configurations
INSERT OR IGNORE INTO provider_configs (provider, base_url, default_model, temperature, max_tokens)
VALUES
    ('openai', 'https://api.openai.com/v1', 'gpt-4o', 0.7, 4096),
    ('anthropic', 'https://api.anthropic.com/v1', 'claude-sonnet-4-20250514', 0.7, 4096),
    ('openai_compatible', 'http://localhost:11434/v1', 'llama3.1', 0.7, 4096);

-- ============================================================
-- app_settings
-- Key-value store for application preferences.
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
    key             TEXT PRIMARY KEY NOT NULL,
    value           TEXT NOT NULL                    -- JSON-encoded value
);

-- Seed default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('theme', '"system"'),
    ('font_size', '14'),
    ('send_on_enter', 'true'),
    ('stream_responses', 'true'),
    ('show_token_usage', 'true'),
    ('default_provider', 'null'),
    ('default_model', 'null'),
    ('default_system_prompt', 'null'),
    ('compact_sidebar', 'false'),
    ('confirm_delete', 'true'),
    ('auto_title', 'true');
