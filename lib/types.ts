// ─── Shared Type Definitions ─────────────────────────────────────────

/** Result returned by the LLM for a subtitle translation */
export interface TranslationResult {
    meaning: string;
    translation: string;
    key_phrase: string;
    pronunciation: string;
    usage_note: string;
}

/** Hardware capability profile */
export interface HardwareProfile {
    hasWebGPU: boolean;
    gpuVendor: string;
    estimatedVRAM: number;
    hasWASM: boolean;
    recommendedModel: string;
    canRunLocal: boolean;
}

/** Supported model identifiers */
export type ModelId =
    | "Phi-3-mini-4k-instruct-q4f16_1-MLC"
    | "Qwen2-1.5B-Instruct-q4f16_1-MLC"
    | "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";

/** User-configurable settings */
export interface LinguaLensSettings {
    enabled: boolean;
    targetLanguage: string;
    sourceLanguage: string;
    selectedModel: ModelId;
    cloudApiKey: string;
    cloudApiUrl: string;
    useCloudFallback: boolean;
}

export const DEFAULT_SETTINGS: LinguaLensSettings = {
    enabled: true,
    targetLanguage: "English",
    sourceLanguage: "auto",
    selectedModel: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    cloudApiKey: "",
    cloudApiUrl: "https://api.openai.com/v1",
    useCloudFallback: false,
};

export const SUPPORTED_LANGUAGES = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Japanese", "Korean", "Chinese", "Hindi", "Arabic", "Russian",
    "Dutch", "Swedish", "Turkish", "Thai", "Vietnamese", "Indonesian",
];

export const MODEL_OPTIONS: { id: ModelId; label: string; size: string; vram: string }[] = [
    { id: "Phi-3-mini-4k-instruct-q4f16_1-MLC", label: "Phi-3 Mini", size: "~2.2 GB", vram: "3 GB+" },
    { id: "Qwen2-1.5B-Instruct-q4f16_1-MLC", label: "Qwen2 1.5B", size: "~1.0 GB", vram: "2 GB+" },
    { id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", label: "TinyLlama 1.1B", size: "~0.7 GB", vram: "1.5 GB+" },
];

// ─── Message Protocol ────────────────────────────────────────────────

export enum MessageType {
    TRANSLATE_REQUEST = "LINGUA_LENS_TRANSLATE_REQUEST",
    TRANSLATE_RESPONSE = "LINGUA_LENS_TRANSLATE_RESPONSE",
    INIT_ENGINE = "LINGUA_LENS_INIT_ENGINE",
    INIT_PROGRESS = "LINGUA_LENS_INIT_PROGRESS",
    GET_STATUS = "LINGUA_LENS_GET_STATUS",
    STATUS_RESPONSE = "LINGUA_LENS_STATUS_RESPONSE",
    ERROR = "LINGUA_LENS_ERROR",
}

export interface TranslateRequestMsg {
    type: MessageType.TRANSLATE_REQUEST;
    text: string;
    sourceLang: string;
    targetLang: string;
    requestId: string;
}

export interface TranslateResponseMsg {
    type: MessageType.TRANSLATE_RESPONSE;
    requestId: string;
    result: TranslationResult;
    source: "cache" | "local" | "cloud";
}

export interface InitProgressMsg {
    type: MessageType.INIT_PROGRESS;
    progress: number;
    status: string;
}

export interface ErrorMsg {
    type: MessageType.ERROR;
    requestId?: string;
    error: string;
}

export interface StatusResponseMsg {
    type: MessageType.STATUS_RESPONSE;
    engineReady: boolean;
    modelId: string;
    hardware: HardwareProfile | null;
}

export type ExtensionMessage =
    | TranslateRequestMsg
    | TranslateResponseMsg
    | InitProgressMsg
    | ErrorMsg
    | StatusResponseMsg
    | { type: MessageType.INIT_ENGINE; modelId: string }
    | { type: MessageType.GET_STATUS };
