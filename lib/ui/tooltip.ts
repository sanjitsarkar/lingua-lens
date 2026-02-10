// ─── Tooltip UI (Vanilla TS + Shadow DOM) ───────────────────────────
// Lightweight component injected into streaming site pages.
// Uses Shadow DOM for complete style isolation.

import type { TranslationResult } from "../types";

const TOOLTIP_STYLES = `
:host {
  all: initial;
  position: fixed;
  z-index: 2147483647;
  pointer-events: none;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

.ll-tooltip {
  position: fixed;
  pointer-events: auto;
  max-width: 420px;
  min-width: 280px;
  border-radius: 16px;
  background: rgba(15, 15, 25, 0.92);
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04),
              inset 0 1px 0 rgba(255,255,255,0.06);
  animation: ll-in 0.2s cubic-bezier(0.16,1,0.3,1);
  overflow: hidden;
  color: #e4e4e7;
  font-size: 14px;
}

@keyframes ll-in {
  from { opacity:0; transform: translateY(8px) scale(0.96); }
  to { opacity:1; transform: translateY(0) scale(1); }
}

.ll-hdr {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ll-logo {
  width: 20px; height: 20px; border-radius: 5px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800; color: white; flex-shrink: 0;
}
.ll-title { font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: rgba(255,255,255,0.4); flex: 1; }
.ll-badge {
  font-size: 9px; padding: 2px 6px; border-radius: 4px;
  background: rgba(99,102,241,0.18); color: #a5b4fc; font-weight: 600;
}
.ll-close {
  background: none; border: none; color: rgba(255,255,255,0.3);
  cursor: pointer; font-size: 15px; padding: 2px 4px; border-radius: 4px;
  transition: all 0.15s; line-height: 1;
}
.ll-close:hover { color: white; background: rgba(255,255,255,0.1); }

.ll-body { padding: 10px 14px 14px; display: flex; flex-direction: column; gap: 8px; }

.ll-f { display: flex; flex-direction: column; gap: 2px; }
.ll-l { font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: rgba(255,255,255,0.35); }
.ll-v { font-size: 14px; line-height: 1.45; color: #f4f4f5; }

.ll-f.tr .ll-v {
  font-size: 16px; font-weight: 600;
  background: linear-gradient(135deg, #a5b4fc, #c4b5fd);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ll-f.pr .ll-v { font-style: italic; color: rgba(255,255,255,0.55); font-size: 13px; }
.ll-f.un .ll-v {
  font-size: 12px; color: rgba(255,255,255,0.5); padding: 5px 10px;
  background: rgba(255,255,255,0.04); border-radius: 8px;
  border-left: 2px solid rgba(99,102,241,0.4);
}
.ll-f.kp .ll-v {
  font-weight: 500; padding: 3px 8px; background: rgba(168,85,247,0.12);
  border-radius: 6px; display: inline-block; color: #d8b4fe; font-size: 13px;
}

.ll-loading { display: flex; align-items: center; gap: 10px; padding: 18px 14px; }
.ll-spin {
  width: 18px; height: 18px; border: 2px solid rgba(99,102,241,0.2);
  border-top-color: #6366f1; border-radius: 50%;
  animation: ll-sp 0.7s linear infinite;
}
@keyframes ll-sp { to { transform: rotate(360deg); } }
.ll-lt { font-size: 13px; color: rgba(255,255,255,0.5); }

.ll-err { padding: 14px; display: flex; align-items: flex-start; gap: 8px; }
.ll-ei { color: #f87171; font-size: 16px; flex-shrink: 0; }
.ll-et { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.4; }

.ll-pbar { width: 100%; height: 3px; background: rgba(255,255,255,0.06);
  border-radius: 2px; overflow: hidden; }
.ll-pfill { height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 2px; transition: width 0.3s ease; }
`;

let host: HTMLElement | null = null;
let root: ShadowRoot | null = null;
let el: HTMLElement | null = null;
let dismissFn: ((e: Event) => void) | null = null;

export function initTooltipHost(): void {
  if (host) return;
  host = document.createElement("lingua-lens-tooltip");
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;pointer-events:none;";
  document.documentElement.appendChild(host);
  root = host.attachShadow({ mode: "closed" });
  const s = document.createElement("style");
  s.textContent = TOOLTIP_STYLES;
  root.appendChild(s);
}

function esc(str: string): string {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function header(badge?: string): string {
  return `<div class="ll-hdr">
    <div class="ll-logo">LL</div>
    <span class="ll-title">LinguaLens</span>
    ${badge ? `<span class="ll-badge">${esc(badge)}</span>` : ""}
    <button class="ll-close" aria-label="Close">✕</button>
  </div>`;
}

export function showLoading(rect: DOMRect, text = "Translating…"): void {
  ensure(); remove();
  el = document.createElement("div");
  el.className = "ll-tooltip";
  el.innerHTML = `${header()}
    <div class="ll-loading"><div class="ll-spin"></div><span class="ll-lt">${esc(text)}</span></div>`;
  attach(el, rect);
}

export function showProgress(rect: DOMRect, pct: number, text: string): void {
  ensure(); remove();
  el = document.createElement("div");
  el.className = "ll-tooltip";
  el.innerHTML = `${header()}
    <div class="ll-loading"><div style="flex:1">
      <div class="ll-lt" style="margin-bottom:5px">${esc(text)}</div>
      <div class="ll-pbar"><div class="ll-pfill" style="width:${Math.min(100, Math.max(0, pct))}%"></div></div>
    </div></div>`;
  attach(el, rect);
}

export function showResult(rect: DOMRect, r: TranslationResult, source: string): void {
  ensure(); remove();
  el = document.createElement("div");
  el.className = "ll-tooltip";
  const f: string[] = [];
  if (r.translation) f.push(`<div class="ll-f tr"><span class="ll-l">Translation</span><span class="ll-v">${esc(r.translation)}</span></div>`);
  if (r.meaning) f.push(`<div class="ll-f mn"><span class="ll-l">Meaning</span><span class="ll-v">${esc(r.meaning)}</span></div>`);
  if (r.key_phrase) f.push(`<div class="ll-f kp"><span class="ll-l">Key Phrase</span><span class="ll-v">${esc(r.key_phrase)}</span></div>`);
  if (r.pronunciation) f.push(`<div class="ll-f pr"><span class="ll-l">Pronunciation</span><span class="ll-v">${esc(r.pronunciation)}</span></div>`);
  if (r.usage_note) f.push(`<div class="ll-f un"><span class="ll-l">Usage Note</span><span class="ll-v">${esc(r.usage_note)}</span></div>`);
  el.innerHTML = `${header(source)}<div class="ll-body">${f.join("")}</div>`;
  attach(el, rect);
}

export function showError(rect: DOMRect, msg: string): void {
  ensure(); remove();
  el = document.createElement("div");
  el.className = "ll-tooltip";
  el.innerHTML = `${header()}<div class="ll-err"><span class="ll-ei">⚠</span><span class="ll-et">${esc(msg)}</span></div>`;
  attach(el, rect);
}

export function remove(): void {
  if (el && root?.contains(el)) root.removeChild(el);
  el = null;
  if (dismissFn) {
    document.removeEventListener("click", dismissFn, true);
    document.removeEventListener("keydown", dismissFn, true);
    dismissFn = null;
  }
}

function ensure(): void { if (!host || !root) initTooltipHost(); }

function attach(tooltip: HTMLElement, anchor: DOMRect): void {
  root!.appendChild(tooltip);
  const tr = tooltip.getBoundingClientRect();
  let top = anchor.top - tr.height - 12;
  let left = anchor.left + anchor.width / 2 - tr.width / 2;
  if (top < 8) top = anchor.bottom + 12;
  if (left < 8) left = 8;
  if (left + tr.width > window.innerWidth - 8) left = window.innerWidth - tr.width - 8;
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;

  tooltip.querySelector(".ll-close")?.addEventListener("click", () => remove());

  dismissFn = (e: Event) => {
    if (e instanceof KeyboardEvent && e.key === "Escape") { remove(); return; }
    if (e instanceof MouseEvent && !tooltip.contains(e.target as Node)) remove();
  };
  requestAnimationFrame(() => {
    document.addEventListener("click", dismissFn!, true);
    document.addEventListener("keydown", dismissFn!, true);
  });
}
