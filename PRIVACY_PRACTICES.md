# Chrome Web Store Privacy Disclosures

Copy and paste these responses into the **Privacy Practices** tab in your Developer Console.

## 1. Single Purpose Description
"LinguaLens is a privacy-focused language learning extension that provides instant translation and linguistic context (definitions, pronunciation, and usage notes) for video subtitles and selected text using local, in-browser AI."

## 2. Permission Justifications

### activeTab
"Required to inject the translation tooltip directly onto the page when the user requests a translation, ensuring the UI appears in the correct visual context."

### contextMenus
"Used to provide a 'Translate with LinguaLens' option in the right-click menu, allowing users to easily translate any selected text on a webpage."

### Host Permissions (Matches)
"Necessary to detect and extract subtitle text from supported streaming platforms (YouTube, Netflix, etc.) to enable real-time translation features."

### offscreen
"Required to run the WebLLM inference engine (WebGPU/WASM) in a dedicated background context. This ensures high-performance AI processing without blocking the main browser UI."

### storage
"Used to save user-defined settings, such as the preferred translation language and model selection, locally on the user's device."

### Remote Code Use (Important)
**Select "Yes" and use this explanation:**
"The extension fetches pre-trained AI model weights (binary data) from public CDNs (e.g., Hugging Face) upon user request. This data is not executable code; it is processed by a static, bundled WASM runtime included in the extension package (WebLLM). No executable logic is downloaded at runtime."

## 3. Data Usage Certification
- **Select "Yes"** for everything related to complying with developer program policies.
- **Select "No"** for:
    - Selling data to third parties.
    - Using data for creditworthiness.
    - Using data for lending.
- **Data Collection**: Select **"No"** (You run everything locally and do not transmit data to servers).
