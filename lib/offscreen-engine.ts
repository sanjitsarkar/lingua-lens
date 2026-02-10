// ─── Offscreen Document Script ──────────────────────────────────────
// Runs the WebLLM inference engine in a persistent offscreen context.

import { initEngine, translate, isEngineReady, getLoadedModel } from "@/lib/llm-engine";
import { cloudTranslate } from "@/lib/cloud-fallback";
import { detectHardware } from "@/lib/hardware";
import { MessageType } from "@/lib/types";
import type { TranslationResult, LinguaLensSettings, HardwareProfile, ModelId } from "@/lib/types";

// In-memory translation cache
const cache = new Map<string, TranslationResult>();
let hardware: HardwareProfile | null = null;
let engineInitializing = false;

function cacheKey(text: string, sl: string, tl: string): string {
    return `${sl}|${tl}|${text.trim().toLowerCase()}`;
}

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
    // Only handle messages targeted to offscreen
    if (message.target !== "offscreen") return false;

    if (message.type === MessageType.TRANSLATE_REQUEST) {
        console.log("[Offscreen] Received translate request:", message);
        handleTranslate(message, message.settings).then((resp) => {
            console.log("[Offscreen] Sending response:", resp);
            sendResponse(resp);
        });
        return true;
    }

    if (message.type === MessageType.GET_STATUS) {
        handleStatus().then(sendResponse);
        return true;
    }

    if (message.type === MessageType.INIT_ENGINE) {
        handleInit(message).then(sendResponse);
        return true;
    }

    return false;
});

async function handleTranslate(
    msg: { text: string; sourceLang: string; targetLang: string; requestId: string },
    settings: LinguaLensSettings
) {
    const key = cacheKey(msg.text, msg.sourceLang, msg.targetLang);

    // 1. Cache hit
    const cached = cache.get(key);
    if (cached) {
        return {
            type: MessageType.TRANSLATE_RESPONSE,
            requestId: msg.requestId,
            result: cached,
            source: "cache",
        };
    }

    // 2. Ensure engine is ready (lazy init on first request)
    if (!isEngineReady() && !engineInitializing) {
        engineInitializing = true;
        try {
            if (!hardware) hardware = await detectHardware();

            const modelId = (hardware.canRunLocal ? hardware.recommendedModel : settings.selectedModel) as ModelId;

            await initEngine(modelId, (progress, status) => {
                // Broadcast progress to all tabs
                chrome.runtime.sendMessage({
                    type: MessageType.INIT_PROGRESS,
                    progress,
                    status,
                }).catch(() => { }); // ignore if no listeners
            });
        } catch (err: any) {
            engineInitializing = false;
            // Fall through to cloud fallback
            console.warn("[LinguaLens Offscreen] Engine init failed:", err);
        }
        engineInitializing = false;
    }

    // 3. Try local inference
    if (isEngineReady()) {
        try {
            const result = await withTimeout(
                translate(msg.text, msg.sourceLang, msg.targetLang),
                15_000
            );
            cache.set(key, result);
            return {
                type: MessageType.TRANSLATE_RESPONSE,
                requestId: msg.requestId,
                result,
                source: "local",
            };
        } catch (err) {
            console.warn("[LinguaLens Offscreen] Local inference failed:", err);
        }
    }

    // 4. Cloud fallback
    if (settings.useCloudFallback && settings.cloudApiUrl) {
        try {
            const result = await cloudTranslate(
                msg.text, msg.sourceLang, msg.targetLang,
                settings.cloudApiUrl, settings.cloudApiKey
            );
            cache.set(key, result);
            return {
                type: MessageType.TRANSLATE_RESPONSE,
                requestId: msg.requestId,
                result,
                source: "cloud",
            };
        } catch (err) {
            console.warn("[LinguaLens Offscreen] Cloud fallback failed:", err);
        }
    }

    // 5. Nothing worked
    return {
        type: MessageType.ERROR,
        requestId: msg.requestId,
        error: isEngineReady()
            ? "Translation failed. Please try again."
            : "AI model is still loading. Please wait and try again, or configure cloud fallback in settings.",
    };
}

async function handleStatus() {
    if (!hardware) hardware = await detectHardware();
    return {
        type: MessageType.STATUS_RESPONSE,
        engineReady: isEngineReady(),
        modelId: getLoadedModel(),
        hardware,
    };
}

async function handleInit(msg: { modelId: string }) {
    if (isEngineReady() && getLoadedModel() === msg.modelId) {
        return { success: true, alreadyLoaded: true };
    }

    if (engineInitializing) {
        return { success: true, initializing: true };
    }

    engineInitializing = true;
    try {
        await initEngine(msg.modelId as ModelId, (progress, status) => {
            chrome.runtime.sendMessage({
                type: MessageType.INIT_PROGRESS,
                progress,
                status,
            }).catch(() => { });
        });
        engineInitializing = false;
        return { success: true };
    } catch (err: any) {
        engineInitializing = false;
        return { success: false, error: err.message };
    }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        promise
            .then((v) => { clearTimeout(timer); resolve(v); })
            .catch((e) => { clearTimeout(timer); reject(e); });
    });
}

console.log("[LinguaLens Offscreen] Ready");
