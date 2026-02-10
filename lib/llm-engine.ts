// ─── WebLLM Engine Wrapper ──────────────────────────────────────────
import { CreateMLCEngine, MLCEngine, type InitProgressReport } from "@mlc-ai/web-llm";
import { buildPrompt, parseTranslationResponse } from "./prompt";
import type { TranslationResult, ModelId } from "./types";

let engine: MLCEngine | null = null;
let currentModelId: string = "";
let isLoading = false;

type ProgressCallback = (progress: number, status: string) => void;

export async function initEngine(
    modelId: ModelId,
    onProgress?: ProgressCallback
): Promise<void> {
    if (engine && currentModelId === modelId) return;
    if (isLoading) return;
    isLoading = true;

    try {
        const initProgressCallback = (report: InitProgressReport) => {
            console.log("[WebLLM Init]", report.text, report.progress);
            const pct = Math.round(report.progress * 100);
            let text = report.text;
            if (text.includes("Fetching param cache")) {
                text = "Downloading model data...";
            } else if (text.includes("Loading model from cache")) {
                text = "Loading from cache...";
            } else if (text.includes("Finish loading")) {
                text = "Model ready";
            }
            onProgress?.(pct, text);
        };

        const engineInstance = new MLCEngine({
            initProgressCallback,
            logLevel: "INFO", // Enable logs
        });

        console.log("[WebLLM] Reloading model...", modelId);
        await engineInstance.reload(modelId);
        console.log("[WebLLM] Model reloaded");

        engine = engineInstance;

        currentModelId = modelId;
        onProgress?.(100, "Model ready");
    } catch (err) {
        console.error("[WebLLM] Init Error:", err);
        engine = null;
        currentModelId = "";
        throw err;
    } finally {
        isLoading = false;
    }
}

export async function translate(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<TranslationResult> {
    console.log("[WebLLM] Translate called:", text);
    if (!engine) {
        throw new Error("LLM engine not initialized. Call initEngine() first.");
    }

    const { system, user } = buildPrompt(text, sourceLang, targetLang);
    console.log("[WebLLM] Prompt:", { system, user });

    try {
        const response = await engine.chat.completions.create({
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
            max_tokens: 300,
            temperature: 0.1,
            top_p: 0.9,
            response_format: { type: "json_object" },
        });

        console.log("[WebLLM] Response received:", response);
        const rawContent = response.choices[0]?.message?.content ?? "";
        return parseTranslationResponse(rawContent);
    } catch (err) {
        console.error("[WebLLM] Translation Error:", err);
        throw err;
    }
}

export function isEngineReady(): boolean {
    return engine !== null && currentModelId !== "";
}

export function getLoadedModel(): string {
    return currentModelId;
}

export async function unloadEngine(): Promise<void> {
    if (engine) {
        await engine.unload();
        engine = null;
        currentModelId = "";
    }
}
