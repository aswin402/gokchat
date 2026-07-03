use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;

use crate::models::ProviderType;
use crate::providers::openai::OpenAIProvider;
use crate::providers::anthropic::AnthropicProvider;
use crate::providers::ChatProvider;

pub struct ProviderManager {
    providers: HashMap<ProviderType, Arc<dyn ChatProvider>>,
    /// Active generation cancel tokens, keyed by conversation_id.
    active_streams: Arc<RwLock<HashMap<String, CancellationToken>>>,
}

impl ProviderManager {
    pub fn new() -> Self {
        let mut providers: HashMap<ProviderType, Arc<dyn ChatProvider>> = HashMap::new();
        providers.insert(
            ProviderType::Openai,
            Arc::new(OpenAIProvider::new(None)),
        );
        providers.insert(
            ProviderType::Anthropic,
            Arc::new(AnthropicProvider::new()),
        );

        Self {
            providers,
            active_streams: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn get_provider(&self, provider_type: &ProviderType) -> Option<Arc<dyn ChatProvider>> {
        self.providers.get(provider_type).cloned()
    }

    pub async fn register_cancel_token(
        &self,
        conversation_id: &str,
        token: CancellationToken,
    ) {
        self.active_streams
            .write()
            .await
            .insert(conversation_id.to_string(), token);
    }

    pub async fn cancel_stream(&self, conversation_id: &str) -> bool {
        if let Some(token) = self.active_streams.write().await.remove(conversation_id) {
            token.cancel();
            true
        } else {
            false
        }
    }

    pub async fn remove_cancel_token(&self, conversation_id: &str) {
        self.active_streams.write().await.remove(conversation_id);
    }
}

pub struct AppState {
    pub provider_manager: ProviderManager,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            provider_manager: ProviderManager::new(),
        }
    }
}
