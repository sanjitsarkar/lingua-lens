// ─── Content Script ─────────────────────────────────────────────────
// Injected into streaming site pages. Detects subtitles and shows tooltip.

import { createDetector } from "@/lib/detectors/registry";
import { initTooltipHost, showLoading, showResult, showError, remove } from "@/lib/ui/tooltip";
import { MessageType, DEFAULT_SETTINGS } from "@/lib/types";
import type { TranslateResponseMsg, ErrorMsg, InitProgressMsg, LinguaLensSettings } from "@/lib/types";

export default defineContentScript({
  matches: [
    "*://*.youtube.com/*",
    "*://*.netflix.com/*",
    "*://*.primevideo.com/*",
    "*://*.amazon.com/gp/video/*",
    "*://*.disneyplus.com/*",
    "*://*.hotstar.com/*",
  ],
  runAt: "document_idle",

  main() {
    let settings: LinguaLensSettings = { ...DEFAULT_SETTINGS };
    let lastRect: DOMRect | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Load settings
    chrome.storage.local.get("linguaLensSettings", (data) => {
      if (data.linguaLensSettings) {
        settings = { ...DEFAULT_SETTINGS, ...data.linguaLensSettings };
      }
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.linguaLensSettings?.newValue) {
        settings = { ...DEFAULT_SETTINGS, ...changes.linguaLensSettings.newValue };
      }
    });

    // Initialize tooltip host (Shadow DOM)
    initTooltipHost();

    // Detect which streaming site we're on
    const match = createDetector(window.location.href);
    if (!match) {
      console.log("[LinguaLens] No detector matched for this site.");
      return;
    }

    console.log(`[LinguaLens] Activated on ${match.siteName}`);

    // Attach subtitle detector
    match.detector.attach((text, rect) => {
      if (!settings.enabled) return;

      // Debounce rapid clicks (300ms)
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => handleSubtitleClick(text, rect), 300);
    });

    async function handleSubtitleClick(text: string, rect: DOMRect) {
      lastRect = rect;
      showLoading(rect);

      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        const response = await chrome.runtime.sendMessage({
          type: MessageType.TRANSLATE_REQUEST,
          text,
          sourceLang: settings.sourceLanguage,
          targetLang: "English", // Force English as per user request
          requestId,
        });

        if (!response) {
          showError(rect, "No response from extension. Try reloading the page.");
          return;
        }

        if (response.type === MessageType.TRANSLATE_RESPONSE) {
          const msg = response as TranslateResponseMsg;
          showResult(rect, msg.result, msg.source === "local" ? "⚡ Local AI" : msg.source === "cloud" ? "☁️ Cloud" : "📦 Cache");
        } else if (response.type === MessageType.ERROR) {
          const errMsg = response as ErrorMsg;
          showError(rect, errMsg.error);
        }
      } catch (err: any) {
        if (err.message && err.message.includes("Extension context invalidated")) {
          showError(rect, "Extension updated. Please refresh the page.");
          return;
        }
        showError(rect, err.message || "Translation failed");
      }
    }

    // Listen for progress updates from background (model loading)
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === MessageType.INIT_PROGRESS && lastRect) {
        const progressMsg = msg as InitProgressMsg;
        showLoading(lastRect, `Loading model… ${progressMsg.progress}%`);
      }
    });
  },
});
