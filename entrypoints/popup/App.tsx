import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_SETTINGS,
  SUPPORTED_LANGUAGES,
  MODEL_OPTIONS,
  MessageType,
} from "@/lib/types";
import type { LinguaLensSettings, StatusResponseMsg, HardwareProfile } from "@/lib/types";

export default function App() {
  const [settings, setSettings] = useState<LinguaLensSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<{
    engineReady: boolean;
    modelId: string;
    hardware: HardwareProfile | null;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "model" | "cloud">("general");
  const [downloadProgress, setDownloadProgress] = useState<{
    progress: number;
    text: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    chrome.storage.local.get("linguaLensSettings", (data) => {
      if (data.linguaLensSettings) {
        const loaded = { ...DEFAULT_SETTINGS, ...data.linguaLensSettings };
        if (loaded.targetLanguage !== "English") {
          loaded.targetLanguage = "English";
          // Update storage silently
          chrome.storage.local.set({ linguaLensSettings: loaded });
        }
        setSettings(loaded);
      }
    });
    fetchStatus();

    // Listen for progress updates
    const listener = (msg: any) => {
      if (msg.type === MessageType.INIT_PROGRESS) {
        setDownloadProgress({ progress: msg.progress, text: msg.status });
        if (msg.progress >= 100) {
          setTimeout(() => {
            setDownloadProgress(null);
            fetchStatus();
          }, 1000);
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const resp = (await chrome.runtime.sendMessage({
        type: MessageType.GET_STATUS,
      })) as StatusResponseMsg;
      if (resp?.type === MessageType.STATUS_RESPONSE) {
        setStatus(resp);
      }
    } catch {
      // Extension not yet fully loaded
    }
  }, []);

  const startDownload = async () => {
    if (!settings.selectedModel) return;
    setDownloadProgress({ progress: 0, text: "Starting download..." });
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.INIT_ENGINE,
        modelId: settings.selectedModel,
      });
    } catch (err) {
      console.error("Failed to start download:", err);
      setDownloadProgress(null);
    }
  };

  const save = useCallback(
    async (newSettings: LinguaLensSettings) => {
      setSettings(newSettings);
      await chrome.storage.local.set({ linguaLensSettings: newSettings });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    []
  );

  const update = <K extends keyof LinguaLensSettings>(
    key: K,
    value: LinguaLensSettings[K]
  ) => {
    save({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-extrabold tracking-tight shadow-lg shadow-indigo-500/25">
            LL
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">LinguaLens</h1>
            <p className="text-[11px] text-gray-500 -mt-0.5">
              In-browser subtitle translator
            </p>
          </div>
          <div className="ml-auto">
            {saved && (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full animate-pulse">
                ✓ Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mx-5 mb-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${status?.engineReady
                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                : downloadProgress
                  ? "bg-blue-400 animate-pulse"
                  : "bg-amber-400"
                }`}
            />
            <span className="text-xs text-gray-400">
              {downloadProgress
                ? downloadProgress.text
                : status?.engineReady
                  ? `Model ready` // — ${status.modelId.split("-").slice(0, 2).join(" ")}`
                  : "AI model not loaded"}
            </span>
          </div>
          {!status?.engineReady && !downloadProgress && (
            <button
              onClick={startDownload}
              className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700 transition-colors cursor-pointer"
            >
              Download Model
            </button>
          )}
        </div>

        {downloadProgress && (
          <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${downloadProgress.progress}%` }}
            />
          </div>
        )}

        {!downloadProgress && status?.hardware && (
          <div className="mt-2 flex gap-3 text-[10px] text-gray-500">
            <span>
              GPU: {status.hardware.hasWebGPU ? "✓ WebGPU" : "✗ No WebGPU"}
            </span>
            <span>VRAM: ~{status.hardware.estimatedVRAM} MB</span>
            <span>WASM: {status.hardware.hasWASM ? "✓" : "✗"}</span>
          </div>
        )}
      </div>

      {/* Enable Toggle */}
      <div className="mx-5 mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Extension Enabled</span>
        <button
          onClick={() => update("enabled", !settings.enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.enabled
            ? "bg-indigo-500"
            : "bg-gray-700"
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
          />
        </button>
      </div>

      {/* Tab Nav */}
      <div className="mx-5 flex gap-1 bg-gray-900 rounded-lg p-1 mb-3">
        {(["general", "model", "cloud"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab
              ? "bg-gray-800 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-300"
              }`}
          >
            {tab === "general" ? "🌐 Language" : tab === "model" ? "🤖 Model" : "☁️ Cloud"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {activeTab === "general" && (
          <div className="space-y-4">
            <SelectField
              label="Target Language"
              sublabel="Translate subtitles into this language"
              value={settings.targetLanguage}
              options={[{ value: "English", label: "English" }]}
              onChange={(v) => update("targetLanguage", v)}
            />
            <SelectField
              label="Source Language"
              sublabel="Language of the subtitles (auto-detect recommended)"
              value={settings.sourceLanguage}
              options={[
                { value: "auto", label: "Auto-detect" },
                ...SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: l })),
              ]}
              onChange={(v) => update("sourceLanguage", v)}
            />
          </div>
        )}

        {activeTab === "model" && (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500 mb-2">
              Select the AI model for local inference. Larger models are more
              accurate but require more GPU memory.
            </p>
            {MODEL_OPTIONS.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${settings.selectedModel === m.id
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-gray-800 hover:border-gray-700 bg-gray-900/50"
                  }`}
              >
                <input
                  type="radio"
                  name="model"
                  checked={settings.selectedModel === m.id}
                  onChange={() => update("selectedModel", m.id)}
                  className="mt-0.5 accent-indigo-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                      {m.size}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                      Needs {m.vram} VRAM
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {activeTab === "cloud" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Cloud Fallback</div>
                <div className="text-[11px] text-gray-500">
                  Use cloud API when local AI is unavailable
                </div>
              </div>
              <button
                onClick={() =>
                  update("useCloudFallback", !settings.useCloudFallback)
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.useCloudFallback ? "bg-indigo-500" : "bg-gray-700"
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.useCloudFallback
                    ? "translate-x-5"
                    : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            {settings.useCloudFallback && (
              <>
                <InputField
                  label="API Endpoint"
                  sublabel="OpenAI-compatible endpoint URL"
                  value={settings.cloudApiUrl}
                  placeholder="https://api.openai.com/v1"
                  onChange={(v) => update("cloudApiUrl", v)}
                />
                <InputField
                  label="API Key"
                  sublabel="Your API key (stored locally, never sent to us)"
                  value={settings.cloudApiKey}
                  placeholder="sk-..."
                  type="password"
                  onChange={(v) => update("cloudApiKey", v)}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-800/50 text-center">
        <p className="text-[10px] text-gray-600">
          LinguaLens v1.0 · All AI runs locally in your browser
        </p>
      </div>
    </div>
  );
}

// ─── Reusable Field Components ──────────────────────────────────────

function SelectField({
  label,
  sublabel,
  value,
  options,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {sublabel && (
        <p className="text-[11px] text-gray-500 mb-1.5">{sublabel}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors outline-none appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  sublabel,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {sublabel && (
        <p className="text-[11px] text-gray-500 mb-1.5">{sublabel}</p>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors outline-none"
      />
    </div>
  );
}
