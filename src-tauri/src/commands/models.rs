use crate::models::{ModelInfo, ProviderType};
use crate::providers::openai::OpenAIProvider;
use crate::providers::anthropic::AnthropicProvider;
use crate::providers::compatible::OpenAICompatibleProvider;
use crate::providers::{ChatProvider, ProviderError};
use crate::security::keystore;

#[tauri::command]
pub async fn list_models(
    provider: ProviderType,
    base_url: Option<String>,
) -> Result<Vec<ModelInfo>, ProviderError> {
    let provider_str = serde_json::to_string(&provider)
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?
        .trim_matches('"')
        .to_string();
    
    // Retrieve API key from keychain
    let api_key = keystore::retrieve_key(&provider_str).unwrap_or_default();

    match provider {
        ProviderType::Openai => {
            let p = OpenAIProvider::new(base_url);
            p.list_models(&api_key).await
        }
        ProviderType::Anthropic => {
            let p = AnthropicProvider::new();
            p.list_models(&api_key).await
        }
        ProviderType::OpenaiCompatible => {
            let url = base_url.ok_or_else(|| {
                ProviderError::InvalidRequest("base_url is required for OpenAI compatible provider".to_string())
            })?;
            let p = OpenAICompatibleProvider::new(url);
            p.list_models(&api_key).await
        }
    }
}
