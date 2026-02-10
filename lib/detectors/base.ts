// ─── Base Subtitle Detector ─────────────────────────────────────────

export type SubtitleClickHandler = (text: string, rect: DOMRect) => void;

export abstract class BaseSubtitleDetector {
    protected observer: MutationObserver | null = null;
    protected onClick: SubtitleClickHandler | null = null;
    protected activeElements = new Set<Element>();

    protected abstract get subtitleSelector(): string;
    protected abstract get observeTarget(): string;

    attach(onSubtitleClick: SubtitleClickHandler): void {
        this.onClick = onSubtitleClick;

        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement) this.processElement(node);
                }
                for (const node of mutation.removedNodes) {
                    if (node instanceof HTMLElement) this.cleanupElement(node);
                }
                if (mutation.type === "characterData" && mutation.target.parentElement) {
                    this.processElement(mutation.target.parentElement);
                }
            }
        });

        this.waitForContainer();
    }

    detach(): void {
        this.observer?.disconnect();
        this.observer = null;
        for (const el of this.activeElements) {
            el.removeEventListener("click", this.handleClick);
            (el as HTMLElement).style.cursor = "";
        }
        this.activeElements.clear();
        this.onClick = null;
    }

    private waitForContainer(): void {
        const tryAttach = () => {
            const container = document.querySelector(this.observeTarget);
            if (container) {
                this.observer!.observe(container, { childList: true, subtree: true, characterData: true });
                container.querySelectorAll(this.subtitleSelector).forEach((el) =>
                    this.processElement(el as HTMLElement)
                );
            } else {
                setTimeout(tryAttach, 1000);
            }
        };
        tryAttach();
    }

    private processElement(el: HTMLElement): void {
        const targets = [el, ...el.querySelectorAll(this.subtitleSelector)].filter(
            (e) => e.matches?.(this.subtitleSelector)
        );
        for (const target of targets) {
            if (this.activeElements.has(target)) continue;
            this.activeElements.add(target);
            (target as HTMLElement).style.cursor = "pointer";
            target.addEventListener("click", this.handleClick);
        }
    }

    private cleanupElement(el: HTMLElement): void {
        const targets = [el, ...el.querySelectorAll(this.subtitleSelector)].filter(
            (e) => this.activeElements.has(e)
        );
        for (const target of targets) {
            target.removeEventListener("click", this.handleClick);
            (target as HTMLElement).style.cursor = "";
            this.activeElements.delete(target);
        }
    }

    private handleClick = (event: Event): void => {
        event.stopPropagation();
        event.preventDefault();
        const el = event.currentTarget as HTMLElement;
        const text = el.textContent?.trim() ?? "";
        if (!text || !this.onClick) return;
        this.onClick(text, el.getBoundingClientRect());
    };
}
