use async_trait::async_trait;
use serde::Serialize;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use crate::models::{ChatMessage, ModelInfo, ProviderConfig, ProviderType, StreamChunk, TokenUsage};

#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("Authentication failed: invalid or expired API key")]
    AuthenticationError,

    #[error("Rate limited by provider (retry after {retry_after_ms}ms)")]
    RateLimited { retry_after_ms: u64 },

    #[error("Model '{model}' not found for provider '{provider}'")]
    ModelNotFound { model: String, provider: String },

    #[error("Context length exceeded: {message}")]
    ContextLengthExceeded { message: String },

    #[error("Provider returned error {status}: {message}")]
    ApiError { status: u16, message: String },

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Stream cancelled by user")]
    Cancelled,

    #[error("Failed to parse SSE stream: {0}")]
    StreamParseError(String),

    #[error("Keychain error: {0}")]
    KeychainError(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),
}

impl ProviderError {
    pub fn error_code(&self) -> &'static str {
        match self {
            Self::AuthenticationError => "AUTH_ERROR",
            Self::RateLimited { .. } => "RATE_LIMITED",
            Self::ModelNotFound { .. } => "MODEL_NOT_FOUND",
            Self::ContextLengthExceeded { .. } => "CONTEXT_LENGTH_EXCEEDED",
            Self::ApiError { .. } => "API_ERROR",
            Self::NetworkError(_) => "NETWORK_ERROR",
            Self::Cancelled => "CANCELLED",
            Self::StreamParseError(_) => "STREAM_PARSE_ERROR",
            Self::KeychainError(_) => "KEYCHAIN_ERROR",
            Self::InvalidRequest(_) => "INVALID_REQUEST",
        }
    }
}

// Make ProviderError serializable for Tauri IPC
impl Serialize for ProviderError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("ProviderError", 2)?;
        state.serialize_field("code", &self.error_code())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

/// The core trait that all AI providers must implement.
#[async_trait]
pub trait ChatProvider: Send + Sync {
    /// Stream a chat completion. Chunks are sent through the `tx` channel.
    /// The `cancel_token` can be used to abort the stream mid-generation.
    async fn stream_completion(
        &self,
        messages: Vec<ChatMessage>,
        model: &str,
        config: &ProviderConfig,
        api_key: &str,
        tx: mpsc::Sender<Result<StreamChunk, ProviderError>>,
        cancel_token: CancellationToken,
    ) -> Result<TokenUsage, ProviderError>;

    /// List available models from the provider.
    async fn list_models(&self, api_key: &str) -> Result<Vec<ModelInfo>, ProviderError>;

    /// Validate an API key by making a minimal API call.
    async fn validate_key(&self, api_key: &str) -> Result<bool, ProviderError>;

    /// Return the provider type.
    fn provider_type(&self) -> ProviderType;
}

pub mod openai;
pub mod anthropic;
pub mod compatible;
