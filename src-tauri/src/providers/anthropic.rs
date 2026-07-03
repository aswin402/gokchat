use async_trait::async_trait;
use futures_util::StreamExt;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use crate::models::{ChatMessage, MessageRole, ModelInfo, ProviderConfig, ProviderType, StreamChunk, TokenUsage};
use crate::providers::{ChatProvider, ProviderError};

pub struct AnthropicProvider {
    client: reqwest::Client,
    base_url: String,
    api_version: String,
}

impl AnthropicProvider {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: "https://api.anthropic.com/v1".to_string(),
            api_version: "2023-06-01".to_string(),
        }
    }
}

fn preprocess_for_anthropic(messages: Vec<ChatMessage>) -> (Option<String>, Vec<ChatMessage>) {
    let mut system_prompt: Option<String> = None;
    let mut processed: Vec<ChatMessage> = Vec::new();

    for msg in messages {
        if msg.role == MessageRole::System {
            // Accumulate system prompts
            match &mut system_prompt {
                Some(existing) => {
                    existing.push_str("\n\n");
                    existing.push_str(&msg.content);
                }
                None => system_prompt = Some(msg.content),
            }
            continue;
        }

        // Merge consecutive same-role messages
        if let Some(last) = processed.last_mut() {
            if last.role == msg.role {
                last.content.push_str("\n\n");
                last.content.push_str(&msg.content);
                continue;
            }
        }

        processed.push(msg);
    }

    // Ensure first message is user role
    if processed.first().map(|m| &m.role) != Some(&MessageRole::User) {
        processed.insert(0, ChatMessage {
            role: MessageRole::User,
            content: "(continued conversation)".to_string(),
        });
    }

    (system_prompt, processed)
}

async fn parse_anthropic_sse_stream(
    response: reqwest::Response,
    tx: mpsc::Sender<Result<StreamChunk, ProviderError>>,
    cancel_token: CancellationToken,
) -> Result<TokenUsage, ProviderError> {
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut chunk_index: u32 = 0;
    let mut usage = TokenUsage::default();
    let mut current_event_type = String::new();

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

                        while let Some(line_end) = buffer.find('\n') {
                            let line = buffer[..line_end].trim_end_matches('\r').to_string();
                            buffer = buffer[line_end + 1..].to_string();

                            if line.is_empty() {
                                current_event_type.clear();
                                continue;
                            }

                            if let Some(event) = line.strip_prefix("event: ") {
                                current_event_type = event.trim().to_string();
                                continue;
                            }

                            if let Some(data) = line.strip_prefix("data: ") {
                                let json: serde_json::Value = serde_json::from_str(data)
                                    .map_err(|e| ProviderError::StreamParseError(
                                        format!("Invalid JSON: {e}")
                                    ))?;

                                match current_event_type.as_str() {
                                    "message_start" => {
                                        if let Some(input_tokens) = json["message"]["usage"]["input_tokens"].as_u64() {
                                            usage.prompt_tokens = Some(input_tokens as u32);
                                        }
                                    }
                                    "content_block_delta" => {
                                        if let Some(text) = json["delta"]["text"].as_str() {
                                            if !text.is_empty() {
                                                let _ = tx.send(Ok(StreamChunk {
                                                    text: text.to_string(),
                                                    index: chunk_index,
                                                    done: false,
                                                })).await;
                                                chunk_index += 1;
                                            }
                                        }
                                    }
                                    "message_delta" => {
                                        if let Some(output_tokens) = json["usage"]["output_tokens"].as_u64() {
                                            usage.completion_tokens = Some(output_tokens as u32);
                                        }
                                    }
                                    "message_stop" => {
                                        usage.total_tokens = match (
                                            usage.prompt_tokens,
                                            usage.completion_tokens,
                                        ) {
                                            (Some(p), Some(c)) => Some(p + c),
                                            _ => None,
                                        };

                                        let _ = tx.send(Ok(StreamChunk {
                                            text: String::new(),
                                            index: chunk_index,
                                            done: true,
                                        })).await;

                                        return Ok(usage);
                                    }
                                    _ => {} // ping, content_block_start, content_block_stop
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
                        return Ok(usage);
                    }
                }
            }
        }
    }
}

fn anthropic_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "claude-3-5-sonnet-latest".into(),
            name: "Claude 3.5 Sonnet".into(),
            provider: ProviderType::Anthropic,
            context_window: Some(200_000),
        },
        ModelInfo {
            id: "claude-3-5-haiku-latest".into(),
            name: "Claude 3.5 Haiku".into(),
            provider: ProviderType::Anthropic,
            context_window: Some(200_000),
        },
        ModelInfo {
            id: "claude-3-opus-latest".into(),
            name: "Claude 3 Opus".into(),
            provider: ProviderType::Anthropic,
            context_window: Some(200_000),
        },
    ]
}

#[async_trait]
impl ChatProvider for AnthropicProvider {
    async fn stream_completion(
        &self,
        messages: Vec<ChatMessage>,
        model: &str,
        config: &ProviderConfig,
        api_key: &str,
        tx: mpsc::Sender<Result<StreamChunk, ProviderError>>,
        cancel_token: CancellationToken,
    ) -> Result<TokenUsage, ProviderError> {
        let (system_prompt, processed_messages) = preprocess_for_anthropic(messages);

        let mut req_body = serde_json::json!({
            "model": model,
            "messages": processed_messages,
            "stream": true,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "top_p": config.top_p.unwrap_or(1.0)
        });

        if let Some(sys) = system_prompt {
            req_body["system"] = serde_json::Value::String(sys);
        }

        let res = self.client.post(format!("{}/messages", self.base_url))
            .header("x-api-key", api_key)
            .header("anthropic-version", &self.api_version)
            .json(&req_body)
            .send()
            .await;

        match res {
            Ok(resp) => {
                if resp.status().is_success() {
                    parse_anthropic_sse_stream(resp, tx, cancel_token).await
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

    async fn list_models(&self, _api_key: &str) -> Result<Vec<ModelInfo>, ProviderError> {
        Ok(anthropic_models())
    }

    async fn validate_key(&self, api_key: &str) -> Result<bool, ProviderError> {
        let req_body = serde_json::json!({
            "model": "claude-3-5-haiku-latest",
            "max_tokens": 1,
            "messages": [{ "role": "user", "content": "hi" }]
        });

        let res = self.client.post(format!("{}/messages", self.base_url))
            .header("x-api-key", api_key)
            .header("anthropic-version", &self.api_version)
            .json(&req_body)
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
        ProviderType::Anthropic
    }
}
