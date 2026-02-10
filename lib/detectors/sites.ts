import { BaseSubtitleDetector } from "./base";

export class YouTubeDetector extends BaseSubtitleDetector {
    protected get subtitleSelector() { return "span.ytp-caption-segment"; }
    protected get observeTarget() { return "#movie_player"; }
}

export class NetflixDetector extends BaseSubtitleDetector {
    protected get subtitleSelector() {
        return ".player-timedtext-text-container span, .player-timedtext span";
    }
    protected get observeTarget() { return ".watch-video, .nf-player-container"; }
}

export class PrimeDetector extends BaseSubtitleDetector {
    protected get subtitleSelector() {
        return ".atvwebplayersdk-captions-text span, [class*='captions'] span";
    }
    protected get observeTarget() {
        return ".atvwebplayersdk-overlays-container, .webPlayerContainer";
    }
}

export class DisneyDetector extends BaseSubtitleDetector {
    protected get subtitleSelector() {
        return [
            '[class*="subtitle"] span',
            '[class*="Subtitle"] span',
            '[class*="caption"] span',
            '[class*="Caption"] span',
        ].join(", ");
    }
    protected get observeTarget() {
        return '[class*="player"], [class*="Player"]';
    }
}
