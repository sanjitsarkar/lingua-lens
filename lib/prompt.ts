// ─── Prompt Template Builder ────────────────────────────────────────
import type { TranslationResult } from "./types";

export function buildPrompt(
    subtitleText: string,
    sourceLang: string,
    targetLang: string
): { system: string; user: string } {
    const system = [
        `You are a precise dictionary/translator helper.`,
        `If the input is in ${targetLang}, define it in ${targetLang}.`,
        `Otherwise, translate the user's input to ${targetLang}.`,
        `CRITICAL: Output MUST be in ${targetLang} ONLY. Do not use Chinese, Hindi, or other scripts.`,
        `Return a JSON object with these keys:`,
        `- translation: The ${targetLang} translation (or word itself if same language)`,
        `- meaning: Brief definition in ${targetLang} (max 10 words)`,
        `- key_phrase: The most important word/phrase`,
        `- pronunciation: Phonetic guide`,
        `- usage_note: Brief context in ${targetLang} (max 10 words)`,
        `Response must be valid JSON only. Be extremely concise.`,
    ].join("\n");

    return { system, user: subtitleText };
}

export function parseTranslationResponse(raw: string): TranslationResult {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    cleaned = cleaned.trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
        return fallbackResult(raw);
    }

    try {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        return {
            meaning: String(parsed.meaning ?? ""),
            translation: String(parsed.translation ?? ""),
            key_phrase: String(parsed.key_phrase ?? ""),
            pronunciation: String(parsed.pronunciation ?? ""),
            usage_note: String(parsed.usage_note ?? ""),
        };
    } catch {
        return fallbackResult(raw);
    }
}

function fallbackResult(raw: string): TranslationResult {
    return {
        meaning: "",
        translation: raw.trim(),
        key_phrase: "",
        pronunciation: "",
        usage_note: "LLM returned non-JSON; showing raw text.",
    };
}
