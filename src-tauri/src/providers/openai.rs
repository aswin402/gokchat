use async_trait::async_trait;
use futures_util::StreamExt;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use crate::models::{ChatMessage, ModelInfo, ProviderConfig, ProviderType, StreamChunk, TokenUsage};
use crate::providers::{ChatProvider, ProviderError};

pub struct OpenAIProvider {
    client: reqwest::Client,
    base_url: String,
}

impl OpenAIProvider {
    pub fn new(base_url: Option<String>) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()),
        }
    }
}

pub async fn parse_openai_sse_stream(
    response: reqwest::Response,
    tx: mpsc::Sender<Result<StreamChunk, ProviderError>>,
    cancel_token: CancellationToken,
) -> Result<TokenUsage, ProviderError> {
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut chunk_index: u32 = 0;
    let mut usage = TokenUsage::default();

    loop {
        tokio::select! {
            _ = cancel_token.cancelled() => {
                let _ = tx.send(Ok(StreamChunk {
                    text: String::new(),
                    index: chunk_index,
                    done: true,
                })).await;
                return Err(ProviderError::Cancelled);
            }
            maybe_bytes = stream.next() => {
                match maybe_bytes {
                    Some(Ok(bytes)) => {
                        buffer.push_str(&String::from_utf8_lossy(&bytes));

                        // Process complete lines
                        while let Some(line_end) = buffer.find('\n') {
                            let line = buffer[..line_end].trim_end_matches('\r').to_string();
                            buffer = buffer[line_end + 1..].to_string();

                            if line.is_empty() || line.starts_with(':') {
                                continue;
                            }

                            if let Some(data) = line.strip_prefix("data: ") {
                                if data.trim() == "[DONE]" {
                                    let _ = tx.send(Ok(StreamChunk {
                                        text: String::new(),
                                        index: chunk_index,
                                        done: true,
                                    })).await;
                                    return Ok(usage);
                                }

                                match serde_json::from_str::<serde_json::Value>(data) {
                                    Ok(json) => {
                                        // Extract text delta
                                        if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                                            if !content.is_empty() {
                                                let _ = tx.send(Ok(StreamChunk {
                                                    text: content.to_string(),
                                                    index: chunk_index,
                                                    done: false,
                                                })).await;
                                                chunk_index += 1;
                                            }
                                        }

                                        // Extract usage if present
                                        if let Some(u) = json.get("usage") {
                                            if !u.is_null() {
                                                usage.prompt_tokens = u["prompt_tokens"].as_u64().map(|v| v as u32);
                                                usage.completion_tokens = u["completion_tokens"].as_u64().map(|v| v as u32);
                                                usage.total_tokens = u["total_tokens"].as_u64().map(|v| v as u32);
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        let _ = tx.send(Err(ProviderError::StreamParseError(
                                            format!("Invalid JSON in SSE: {e}")
                                        ))).await;
                                    }
                                }
                            }
                        }
                    }
                    Some(Err(e)) => return Err(ProviderError::NetworkError(e)),
                    None => {
                        let _ = tx.send(Ok(StreamChunk {
                            text: String::new(),
                            index: chunk_index,
                            done: true,
                        })).await;
                        return Ok(usage); // Stream ended
                    }
                }
            }
        }
    }
}

#[async_trait]
impl ChatProvider for OpenAIProvider {
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
            "stream_options": { "include_usage": true }
        });

        let res = self.client.post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(api_key)
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
        let res = self.client.get(format!("{}/models", self.base_url))
            .bearer_auth(api_key)
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
                                    provider: ProviderType::Openai,
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

    async fn validate_key(&self, api_key: &str) -> Result<bool, ProviderError> {
        let res = self.client.get(format!("{}/models", self.base_url))
            .bearer_auth(api_key)
            .send()
            .await;
        match res {
            Ok(resp) => {
                if resp.status().is_success() {
                    Ok(true)
                } else if resp.status().as_u16() == 401 {
                    Ok(false)
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

    fn provider_type(&self) -> ProviderType {
        ProviderType::Openai
    }
}
