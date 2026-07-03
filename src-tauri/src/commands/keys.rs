use crate::models::ProviderType;
use crate::providers::openai::OpenAIProvider;
use crate::providers::anthropic::AnthropicProvider;
use crate::providers::compatible::OpenAICompatibleProvider;
use crate::providers::{ChatProvider, ProviderError};
use crate::security::keystore;

#[tauri::command]
pub async fn store_api_key(provider: ProviderType, key: String) -> Result<(), ProviderError> {
    let provider_str = serde_json::to_string(&provider)
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?
        .trim_matches('"')
        .to_string();
    keystore::store_key(&provider_str, &key)
        .map_err(|e| ProviderError::KeychainError(e))
}

#[tauri::command]
pub async fn get_api_key(provider: ProviderType) -> Result<bool, ProviderError> {
    let provider_str = serde_json::to_string(&provider)
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?
        .trim_matches('"')
        .to_string();
    Ok(keystore::has_key(&provider_str))
}

#[tauri::command]
pub async fn delete_api_key(provider: ProviderType) -> Result<(), ProviderError> {
    let provider_str = serde_json::to_string(&provider)
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?
        .trim_matches('"')
        .to_string();
    keystore::remove_key(&provider_str)
        .map_err(|e| ProviderError::KeychainError(e))
}

#[tauri::command]
pub async fn validate_api_key(
    provider: ProviderType,
    key: String,
    base_url: Option<String>,
) -> Result<bool, ProviderError> {
    match provider {
        ProviderType::Openai => {
            let p = OpenAIProvider::new(base_url);
            p.validate_key(&key).await
        }
        ProviderType::Anthropic => {
            let p = AnthropicProvider::new();
            p.validate_key(&key).await
        }
        ProviderType::OpenaiCompatible => {
            let url = base_url.ok_or_else(|| {
                ProviderError::InvalidRequest("base_url is required for OpenAI compatible provider".to_string())
            })?;
            let p = OpenAICompatibleProvider::new(url);
            p.validate_key(&key).await
        }
    }
}
