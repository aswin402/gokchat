use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use crate::models::{ChatMessage, ProviderConfig, ProviderType, StreamChunk, TokenUsage};
use crate::providers::openai::OpenAIProvider;
use crate::providers::anthropic::AnthropicProvider;
use crate::providers::compatible::OpenAICompatibleProvider;
use crate::providers::{ChatProvider, ProviderError};
use crate::security::keystore;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendMessageRequest {
    pub messages: Vec<ChatMessage>,
    pub provider: ProviderType,
    pub model: String,
    pub conversation_id: String,
    pub system_prompt: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub base_url: Option<String>, // Added to simplify architecture and bypass DB querying in Rust
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct StreamChunkPayload {
    conversation_id: String,
    text: String,
    index: u32,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct StreamErrorPayload {
    conversation_id: String,
    error_message: String,
    error_code: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct StreamDonePayload {
    conversation_id: String,
    full_text: String,
    usage: TokenUsage,
}

#[tauri::command]
pub async fn send_message(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    request: SendMessageRequest,
) -> Result<(), ProviderError> {
    let provider_str = serde_json::to_string(&request.provider)
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?
        .trim_matches('"')
        .to_string();

    // 1. Retrieve API key
    let api_key = keystore::retrieve_key(&provider_str).unwrap_or_default();

    // 2. Select provider instance
    let provider: Arc<dyn ChatProvider> = match request.provider {
        ProviderType::Openai => Arc::new(OpenAIProvider::new(request.base_url.clone())),
        ProviderType::Anthropic => Arc::new(AnthropicProvider::new()),
        ProviderType::OpenaiCompatible => {
            let url = request.base_url.clone().ok_or_else(|| {
                ProviderError::InvalidRequest("base_url is required for OpenAI compatible provider".to_string())
            })?;
            Arc::new(OpenAICompatibleProvider::new(url))
        }
    };

    // 3. Create CancellationToken
    let cancel_token = CancellationToken::new();
    state.provider_manager.register_cancel_token(&request.conversation_id, cancel_token.clone()).await;

    // 4. Build config
    let config = ProviderConfig {
        provider_type: request.provider.clone(),
        base_url: request.base_url.unwrap_or_default(),
        default_model: request.model.clone(),
        temperature: request.temperature.unwrap_or(0.7),
        max_tokens: request.max_tokens.unwrap_or(4096),
        top_p: None,
        frequency_penalty: None,
        presence_penalty: None,
    };

    let conversation_id = request.conversation_id.clone();
    let model = request.model.clone();
    let messages = request.messages.clone();

    // 5. Spawn background task for streaming
    tokio::spawn(async move {
        let (tx, mut rx) = mpsc::channel::<Result<StreamChunk, ProviderError>>(100);

        // Run the completion stream in a separate task
        let provider_clone = provider.clone();
        let cancel_token_clone = cancel_token.clone();
        let api_key_clone = api_key.clone();
        
        let stream_join = tokio::spawn(async move {
            provider_clone.stream_completion(
                messages,
                &model,
                &config,
                &api_key_clone,
                tx,
                cancel_token_clone,
            ).await
        });

        let mut full_text = String::new();
        let mut has_error = false;

        // Process chunks from the channel
        while let Some(res) = rx.recv().await {
            match res {
                Ok(chunk) => {
                    full_text.push_str(&chunk.text);
                    
                    let payload = StreamChunkPayload {
                        conversation_id: conversation_id.clone(),
                        text: chunk.text,
                        index: chunk.index,
                    };
                    let _ = app.emit("stream_chunk", payload);
                }
                Err(err) => {
                    has_error = true;
                    let payload = StreamErrorPayload {
                        conversation_id: conversation_id.clone(),
                        error_message: err.to_string(),
                        error_code: err.error_code().to_string(),
                    };
                    let _ = app.emit("stream_error", payload);
                    break;
                }
            }
        }

        // Emit done event if no error occurred
        if !has_error {
            // Get final usage stats
            let usage = match stream_join.await {
                Ok(Ok(token_usage)) => token_usage,
                _ => TokenUsage::default(),
            };

            let payload = StreamDonePayload {
                conversation_id: conversation_id.clone(),
                full_text,
                usage,
            };
            let _ = app.emit("stream_done", payload);
        }

        // Clean up the cancel token
        app.state::<AppState>().provider_manager.remove_cancel_token(&conversation_id).await;
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_generation(
    state: tauri::State<'_, AppState>,
    conversation_id: String,
) -> Result<bool, ProviderError> {
    Ok(state.provider_manager.cancel_stream(&conversation_id).await)
}
