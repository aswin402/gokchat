use async_trait::async_trait;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use crate::models::{ChatMessage, ModelInfo, ProviderConfig, ProviderType, StreamChunk, TokenUsage};
use crate::providers::openai::parse_openai_sse_stream;
use crate::providers::{ChatProvider, ProviderError};

pub struct OpenAICompatibleProvider {
    client: reqwest::Client,
    base_url: String,
}

impl OpenAICompatibleProvider {
    pub fn new(base_url: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }
}

#[async_trait]
impl ChatProvider for OpenAICompatibleProvider {
    async fn stream_completion(
        &self,
        messages: Vec<ChatMessage>,
        model: &str,
        config: &ProviderConfig,
        api_key: &str,
        tx: mpsc::Sender<Result<StreamChunk, ProviderError>>,
        cancel_token: CancellationToken,
    ) -> Result<TokenUsage, ProviderError> {
        let req_body = serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": true,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
            "top_p": config.top_p.unwrap_or(1.0),
            "frequency_penalty": config.frequency_penalty.unwrap_or(0.0),
            "presence_penalty": config.presence_penalty.unwrap_or(0.0),
        });

        // Use a dummy key if empty
        let active_key = if api_key.trim().is_empty() {
            "compatible"
        } else {
            api_key
        };

        let res = self.client.post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(active_key)
            .json(&req_body)
            .send()
            .await;

        match res {
            Ok(resp) => {
                if resp.status().is_success() {
                    parse_openai_sse_stream(resp, tx, cancel_token).await
                } else {
                    let status = resp.status().as_u16();
                    let message = resp.text().await.unwrap_or_default();
                    if status == 401 {
                        Err(ProviderError::AuthenticationError)
                    } else if status == 429 {
                        Err(ProviderError::RateLimited { retry_after_ms: 1000 })
                    } else {
                        Err(ProviderError::ApiError { status, message })
                    }
                }
            }
            Err(e) => Err(ProviderError::NetworkError(e)),
        }
    }

    async fn list_models(&self, api_key: &str) -> Result<Vec<ModelInfo>, ProviderError> {
        let active_key = if api_key.trim().is_empty() {
            "compatible"
        } else {
            api_key
        };

        let res = self.client.get(format!("{}/models", self.base_url))
            .bearer_auth(active_key)
            .send()
            .await;

        match res {
            Ok(resp) => {
                if resp.status().is_success() {
                    let body: serde_json::Value = resp.json().await.map_err(|e| ProviderError::StreamParseError(e.to_string()))?;
                    let mut models = Vec::new();
                    if let Some(data) = body["data"].as_array() {
                        for m in data {
                            if let Some(id) = m["id"].as_str() {
                                models.push(ModelInfo {
                                    id: id.to_string(),
                                    name: id.to_string(),
                                    provider: ProviderType::OpenaiCompatible,
                                    context_window: None,
                                });
                            }
                        }
                    }
                    Ok(models)
                } else {
                    Err(ProviderError::ApiError {
                        status: resp.status().as_u16(),
                        message: resp.text().await.unwrap_or_default(),
                    })
                }
            }
            Err(e) => Err(ProviderError::NetworkError(e)),
        }
    }

    async fn validate_key(&self, _api_key: &str) -> Result<bool, ProviderError> {
        // For OpenAICompatible (e.g. Ollama/LM Studio), validation is usually bypassed or true by default
        // We can just verify if the /models endpoint works or if we can contact the server
        let res = self.client.get(format!("{}/models", self.base_url))
            .send()
            .await;
        match res {
            Ok(resp) => {
                // If it returns anything, it means the server is reachable and responsive
                Ok(resp.status().is_success() || resp.status().as_u16() == 401)
            }
            Err(e) => Err(ProviderError::NetworkError(e)),
        }
    }

    fn provider_type(&self) -> ProviderType {
        ProviderType::OpenaiCompatible
    }
}
