// ─── Detector Registry ──────────────────────────────────────────────
import type { BaseSubtitleDetector } from "./base";
import { YouTubeDetector, NetflixDetector, PrimeDetector, DisneyDetector } from "./sites";

interface DetectorEntry {
    pattern: RegExp;
    create: () => BaseSubtitleDetector;
    name: string;
}

const REGISTRY: DetectorEntry[] = [
    { pattern: /youtube\.com/i, create: () => new YouTubeDetector(), name: "YouTube" },
    { pattern: /netflix\.com/i, create: () => new NetflixDetector(), name: "Netflix" },
    { pattern: /primevideo\.com|amazon\.com\/gp\/video/i, create: () => new PrimeDetector(), name: "Prime Video" },
    { pattern: /disneyplus\.com|hotstar\.com/i, create: () => new DisneyDetector(), name: "Disney+" },
];

export function createDetector(url: string): { detector: BaseSubtitleDetector; siteName: string } | null {
    for (const entry of REGISTRY) {
        if (entry.pattern.test(url)) {
            return { detector: entry.create(), siteName: entry.name };
        }
    }
    return null;
}
