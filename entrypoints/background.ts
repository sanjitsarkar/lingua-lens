// ─── Background Service Worker ──────────────────────────────────────
// Routes messages between content scripts and offscreen document.

import { MessageType, DEFAULT_SETTINGS } from "@/lib/types";
import type { LinguaLensSettings, ExtensionMessage } from "@/lib/types";

let offscreenCreated = false;

async function ensureOffscreen() {
  if (offscreenCreated) return;

  // Check if offscreen document already exists
  const existingContexts = await (chrome.runtime as any).getContexts?.({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (existingContexts?.length > 0) {
    offscreenCreated = true;
    return;
  }

  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: "Run WebLLM inference engine for subtitle translation",
    });
    offscreenCreated = true;
  } catch (err: any) {
    // Document may already exist from a previous session
    if (err.message?.includes("Only a single offscreen")) {
      offscreenCreated = true;
    } else {
      console.error("[LinguaLens] Failed to create offscreen document:", err);
      throw err;
    }
  }
}

async function getSettings(): Promise<LinguaLensSettings> {
  const data = await chrome.storage.local.get("linguaLensSettings");
  return { ...DEFAULT_SETTINGS, ...data.linguaLensSettings };
}

export default defineBackground(() => {
  console.log("[LinguaLens] Service worker started");

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === MessageType.TRANSLATE_REQUEST) {
      // Forward to offscreen document
      handleTranslateRequest(message, sender).then(sendResponse);
      return true; // async response
    }

    if (message.type === MessageType.GET_STATUS) {
      handleStatusRequest().then(sendResponse);
      return true;
    }

    if (message.type === MessageType.INIT_ENGINE) {
      handleInitRequest(message).then(sendResponse);
      return true;
    }
  });

  async function handleTranslateRequest(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
    try {
      await ensureOffscreen();
      const settings = await getSettings();

      // Forward to offscreen with settings
      const response = await chrome.runtime.sendMessage({
        ...message,
        target: "offscreen",
        settings,
      });

      // Forward progress back to content script tab
      return response;
    } catch (err: any) {
      return {
        type: MessageType.ERROR,
        requestId: (message as any).requestId,
        error: err.message || "Service worker error",
      };
    }
  }

  async function handleStatusRequest() {
    try {
      await ensureOffscreen();
      return await chrome.runtime.sendMessage({
        type: MessageType.GET_STATUS,
        target: "offscreen",
      });
    } catch {
      return {
        type: MessageType.STATUS_RESPONSE,
        engineReady: false,
        modelId: "",
        hardware: null,
      };
    }
  }

  async function handleInitRequest(message: any) {
    try {
      await ensureOffscreen();
      // Forward to offscreen
      chrome.runtime.sendMessage({
        ...message,
        target: "offscreen",
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
});
