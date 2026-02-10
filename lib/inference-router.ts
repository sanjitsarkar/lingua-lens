// ─── Inference Router ───────────────────────────────────────────────
import { translate as localTranslate, isEngineReady } from "./llm-engine";
import { cloudTranslate } from "./cloud-fallback";
import type { TranslationResult, LinguaLensSettings } from "./types";

const cache = new Map<string, TranslationResult>();

function cacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}|${targetLang}|${text.trim().toLowerCase()}`;
}

export interface RouteResult {
    result: TranslationResult;
    source: "cache" | "local" | "cloud";
}

export async function routeInference(
    text: string,
    sourceLang: string,
    targetLang: string,
    settings: LinguaLensSettings
): Promise<RouteResult> {
    const key = cacheKey(text, sourceLang, targetLang);

    const cached = cache.get(key);
    if (cached) return { result: cached, source: "cache" };

    if (isEngineReady()) {
        try {
            const result = await withTimeout(localTranslate(text, sourceLang, targetLang), 15_000);
            cache.set(key, result);
            return { result, source: "local" };
        } catch (err) {
            console.warn("[LinguaLens] Local inference failed:", err);
        }
    }

    if (settings.useCloudFallback && settings.cloudApiUrl) {
        try {
            const result = await cloudTranslate(text, sourceLang, targetLang, settings.cloudApiUrl, settings.cloudApiKey);
            cache.set(key, result);
            return { result, source: "cloud" };
        } catch (err) {
            console.warn("[LinguaLens] Cloud fallback failed:", err);
        }
    }

    throw new Error(
        isEngineReady()
            ? "Translation failed. Please try again."
            : "LLM not loaded yet. Click a subtitle to start model download, or configure cloud fallback in settings."
    );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        promise
            .then((val) => { clearTimeout(timer); resolve(val); })
            .catch((err) => { clearTimeout(timer); reject(err); });
    });
}

export function clearCache(): void {
    cache.clear();
}
