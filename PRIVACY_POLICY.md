# Privacy Policy for LinguaLens

**Last Updated: February 11, 2026**

LinguaLens ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding the collection, use, and disclosure of information when you use our browser extension.

## 1. Local Processing (Privacy by Design)
LinguaLens is built as a **local-first** extension. Most features, including subtitle detection and translation, are performed directly on your device using WebGPU and a local AI engine. 
- **Subtitles and Text Selection**: Subtitles from streaming platforms and text selected via the context menu are processed entirely within your browser's local memory.
- **Inference**: AI translation is performed using local resources. We do not transmit your subtitle data to our servers.

## 2. Information We Do Not Collect
We do not collect any personally identifiable information (PII), browsing history, or user activity logs. 
- We do not use any analytics or tracking cookies.
- We do not have a backend server to receive or store your data.

## 3. Optional Cloud Fallback
If you explicitly enable "Cloud Fallback" in the settings and provide your own API key (e.g., OpenAI):
- Transmission of text data is handled directly between your browser and the chosen AI provider.
- Your API key is stored locally in your browser's extension storage and is never shared with us.
- Please refer to the privacy policy of your chosen AI provider regarding their data handling practices.

## 4. Third-Party Services
LinguaLens interacts with specific streaming websites (e.g., YouTube, Netflix) to extract subtitles. This interaction happens locally. We do not share any data with these third-party platforms.

## 5. Changes to This Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on our GitHub repository.

## 6. Contact Us
If you have any questions about this Privacy Policy, you can contact us via our GitHub repository: [https://github.com/sanjitsarkar/lingua-lens](https://github.com/sanjitsarkar/lingua-lens)
