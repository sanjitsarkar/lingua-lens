// ─── Hardware Capability Detection ──────────────────────────────────
import type { HardwareProfile, ModelId } from "./types";

export async function detectHardware(): Promise<HardwareProfile> {
    const profile: HardwareProfile = {
        hasWebGPU: false,
        gpuVendor: "unknown",
        estimatedVRAM: 0,
        hasWASM: typeof WebAssembly !== "undefined" && typeof WebAssembly.validate === "function",
        recommendedModel: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
        canRunLocal: false,
    };

    if (typeof navigator !== "undefined" && "gpu" in navigator) {
        try {
            const gpu = (navigator as any).gpu;
            const adapter = await gpu.requestAdapter();
            if (adapter) {
                profile.hasWebGPU = true;
                const info = await adapter.requestAdapterInfo?.();
                profile.gpuVendor = info?.vendor ?? info?.description ?? "unknown";
                const maxBuf = adapter.limits?.maxBufferSize ?? 0;
                profile.estimatedVRAM = Math.round(maxBuf / (1024 * 1024));
                profile.recommendedModel = pickModel(profile.estimatedVRAM);
                profile.canRunLocal = true;
            }
        } catch {
            profile.hasWebGPU = false;
        }
    }

    if (!profile.hasWebGPU && profile.hasWASM) {
        profile.canRunLocal = true;
        profile.recommendedModel = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";
    }

    return profile;
}

function pickModel(vramMB: number): ModelId {
    if (vramMB >= 3072) return "Phi-3-mini-4k-instruct-q4f16_1-MLC";
    if (vramMB >= 1536) return "Qwen2-1.5B-Instruct-q4f16_1-MLC";
    return "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";
}
