import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { ProviderType, ChatMessage, ModelInfo } from "./types";

export async function storeApiKey(provider: ProviderType, key: string): Promise<void> {
  await invoke("store_api_key", { provider, key });
}

export async function getApiKey(provider: ProviderType): Promise<boolean> {
  return await invoke("get_api_key", { provider });
}

export async function deleteApiKey(provider: ProviderType): Promise<void> {
  await invoke("delete_api_key", { provider });
}

export async function validateApiKey(
  provider: ProviderType,
  key: string,
  baseUrl?: string
): Promise<boolean> {
  return await invoke("validate_api_key", { provider, key, baseUrl });
}

export async function listModels(
  provider: ProviderType,
  baseUrl?: string
): Promise<ModelInfo[]> {
  return await invoke("list_models", { provider, baseUrl });
}

export async function sendChatMessage(args: {
  messages: ChatMessage[];
  provider: ProviderType;
  model: string;
  conversationId: string;
  systemPrompt?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  baseUrl?: string | null;
}): Promise<void> {
  await invoke("send_message", { request: args });
}

export async function stopGeneration(conversationId: string): Promise<boolean> {
  return await invoke("stop_generation", { conversationId });
}

// Event listeners

export async function listenToStreamChunk(
  callback: (payload: { conversationId: string; text: string; index: number }) => void
): Promise<UnlistenFn> {
  return await listen<{ conversationId: string; text: string; index: number }>(
    "stream_chunk",
    (event) => callback(event.payload)
  );
}

export async function listenToStreamError(
  callback: (payload: { conversationId: string; errorMessage: string; errorCode: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ conversationId: string; errorMessage: string; errorCode: string }>(
    "stream_error",
    (event) => callback(event.payload)
  );
}

export async function listenToStreamDone(
  callback: (payload: {
    conversationId: string;
    fullText: string;
    usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  }) => void
): Promise<UnlistenFn> {
  return await listen<{
    conversationId: string;
    fullText: string;
    usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  }>("stream_done", (event) => callback(event.payload));
}
