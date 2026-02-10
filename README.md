# LinguaLens ⚡

**LinguaLens** is a local-first browser extension that uses WebGPU to run powerful AI models (like Phi-3 and Qwen2) directly in your browser. It translates subtitles on streaming sites (YouTube, Netflix, etc.) into English with rich context (definitions, pronunciation, usage notes) without sending data to any server.

[GitHub Repository](https://github.com/sanjitsarkar/lingua-lens)

## 🚀 Key Features
- **Local AI**: Runs 100% offline using `WebLLM` and WebGPU.
- **Privacy First**: No data collection; your browsing history stays on your device.
- **Smart Context**: Provides meanings, key phrases, and grammar notes, not just direct translations.
- **Universal Support**: Works on YouTube, Netflix, Prime Video, Disney+, and Hotstar.
- **Performance**: High-speed inference using optimized WASM kernels.

## 🏗️ Architecture & Modules

The project is built with **WXT** (Web Extension Framework), **React**, **Tailwind CSS**, and **TypeScript**.

### Core Modules (`/lib`)
1.  **`llm-engine.ts`**: The brain of the operation.
    *   Wraps `@mlc-ai/web-llm` to manage the AI model.
    *   Handles model downloading, caching, and initialization.
    *   **Key Function**: `translate(text, source, target)` - Generates JSON-structured translations.
    *   *Now runs in-process within the offscreen document to comply with Manifest V3.*

2.  **`offscreen-engine.ts`**: The bridge between the background script and the heavy AI model.
    *   Runs in a hidden `offscreen` document to access full DOM/WebGPU capabilities without slowing down the browser UI.
    *   Routes messages: `Background` -> `Offscreen` -> `LLM` -> `Background`.

3.  **`detectors/`**: Subtitle extraction logic.
    *   **`base.ts`**: Abstract class for creating site-specific detectors.
    *   **`registry.ts`**: Matches the current URL to the correct detector (e.g., `YouTubeDetector`, `NetflixDetector`).
    *   **`sites.ts`**: Implementations finding subtitle DOM elements on specific platforms.

4.  **`ui/tooltip.ts`**: The visual overlay.
    *   Built with **Vanilla JS + Shadow DOM** to isolate styles from the host page.
    *   Displays loading states, results, and errors right next to the subtitle.

5.  **`prompt.ts`**: Prompt engineering.
    *   Constructs the strict system prompts that force the LLM to return valid JSON and stick to English output.

### Entrypoints (`/entrypoints`)
1.  **`background.ts`**: The central nervous system.
    *   Service worker that coordinates messaging.
    *   Routes translation requests to the offscreen document.
    *   Manages the lifecycle of the offscreen document.

2.  **`content.ts`**: The eyes on the page.
    *   Injected into web pages (YouTube, etc.).
    *   Uses `MutationObserver` to detect when subtitles appear.
    *   Handles user clicks and sends `TRANSLATE_REQUEST` to the background.
    *   *Enforces "English" as the target language.*

3.  **`popup/`**: The settings UI.
    *   **`App.tsx`**: React application for configuring the extension.
    *   Allows selecting models, viewing download progress, and toggling settings.
    *   Styled with Tailwind CSS.

4.  **`offscreen.ts`**:
    *   Minimal HTML/JS entry point that loads `lib/offscreen-engine.ts`.

## 🛠️ Usage

### Prerequisites
- Chrome 113+ (or Edge/Brave)
- A GPU with support for WebGPU (most modern laptops/desktops).

### Installation
1.  Clone the repo and run `npm install`.
2.  Run `npm run build`.
3.  Load the `.output/chrome-mv3` folder in `chrome://extensions` (Developer Mode enabled).

### How to Use
1.  Click the extension icon and select **Download Model** (approx. 2GB, one-time).
2.  Open a video on YouTube/Netflix with captions enabled.
3.  **Hover & Click** on any subtitle line.
4.  Standard translations + context will appear instantly.

## 🔧 Configuration
- **Model**: Switch between `Phi-3-mini` (High Quality) and `Llama-3-8B` (Experimental) in the popup.
- **Cloud Fallback**: Provide an OpenAI key in settings if your device is too slow for local AI.

---
*Built with ❤️ by LinguaLens Team*
