// ─── Cloud Fallback Client ──────────────────────────────────────────
import { buildPrompt, parseTranslationResponse } from "./prompt";
import type { TranslationResult } from "./types";

export async function cloudTranslate(
    text: string,
    sourceLang: string,
    targetLang: string,
    apiUrl: string,
    apiKey: string,
    timeoutMs: number = 10_000
): Promise<TranslationResult> {
    const { system, user } = buildPrompt(text, sourceLang, targetLang);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user },
                ],
                max_tokens: 150,
                temperature: 0.1,
                response_format: { type: "json_object" },
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            throw new Error(`Cloud API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content ?? "";
        return parseTranslationResponse(rawContent);
    } finally {
        clearTimeout(timer);
    }
}
