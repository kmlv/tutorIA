/**
 * The ledger band: a card per good, and the equation slot between them.
 *
 * A card is the good -> number translation made permanent, read left to right:
 *
 *     [glyph]  measured in kg  ->  x₁  ->  $3/kg
 *
 * It fills in station by station as the narration reaches each link, and it never
 * leaves the screen — so at any later moment a glance recovers what x₁ means without
 * re-deriving it. That is the whole point: today the student is asked to believe that a
 * kilo of coffee "is" x₁, and nothing on screen ever performs the translation.
 *
 * Each good carries a hue AND a shape marker. Hue is never the sole carrier — the
 * symbol is always written out — so the binding survives colour blindness and a
 * monochrome print.
 */
import type { Ejemplo, Lang } from "../types";

export type GoodId = "g1" | "g2";
export type Station = "glyph" | "unit" | "symbol" | "price";

/** Shared with the graph so axis labels, intercepts and drop-lines use the SAME tokens.
 *  agy imports these rather than duplicating the constants. */
export const GOOD_TOKENS: Record<GoodId, { hue: string; shape: string; term: string }> = {
  g1: { hue: "var(--g1)", shape: "▲", term: "x1" },
  g2: { hue: "var(--g2)", shape: "●", term: "x2" },
};

const UNITS: Record<GoodId, Record<Lang, { unit: string; unitLong: string }>> = {
  g1: { en: { unit: "kg", unitLong: "kilograms" }, es: { unit: "kg", unitLong: "kilos" } },
  g2: { en: { unit: "L", unitLong: "liters" }, es: { unit: "L", unitLong: "litros" } },
};

const LABEL: Record<Lang, { measured: string; quantity: string; price: string }> = {
  en: { measured: "measured in", quantity: "quantity", price: "price" },
  es: { measured: "se mide en", quantity: "cantidad", price: "precio" },
};

/** Hand-drawn inline SVG, ~700 B each. Not emoji: emoji render inconsistently on
 *  exactly the old systems criterion 5 protects, cannot inherit the theme colour, and
 *  screen readers announce them by Unicode name — the orange emoji reads "tangerine",
 *  which is the wrong good. */
const GLYPHS: Record<GoodId, string> = {
  g1: `<svg viewBox="0 0 48 48" aria-hidden="true" class="glyph">
    <path d="M10 18h22v13a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <path d="M32 21h4a5 5 0 0 1 0 10h-4" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <path d="M17 12c0-3 3-3 3-6M24 12c0-3 3-3 3-6" fill="none" stroke="currentColor" stroke-width="2" opacity=".65"/>
  </svg>`,
  g2: `<svg viewBox="0 0 48 48" aria-hidden="true" class="glyph">
    <path d="M15 14h18l-2 26a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <path d="M16 25h16" fill="none" stroke="currentColor" stroke-width="2" opacity=".65"/>
    <circle cx="24" cy="9" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,
};

export class Ledger {
  private root: HTMLElement;
  private cards: Record<GoodId, HTMLElement> = {} as Record<GoodId, HTMLElement>;
  private slot: HTMLElement;
  private shown: Record<GoodId, Set<Station>> = { g1: new Set(), g2: new Set() };

  constructor(host: HTMLElement, private ejemplo: Ejemplo, private lang: Lang) {
    this.root = document.createElement("section");
    this.root.className = "ledger";
    this.root.innerHTML = `
      ${this.cardHtml("g1")}
      <div class="eq-slot" aria-live="polite"></div>
      ${this.cardHtml("g2")}`;
    host.appendChild(this.root);
    this.cards.g1 = this.root.querySelector('[data-good="g1"]')!;
    this.cards.g2 = this.root.querySelector('[data-good="g2"]')!;
    this.slot = this.root.querySelector(".eq-slot")!;
  }

  private cardHtml(g: GoodId): string {
    const t = GOOD_TOKENS[g];
    const u = UNITS[g][this.lang];
    const name = g === "g1" ? this.ejemplo.bien_1[this.lang] : this.ejemplo.bien_2[this.lang];
    const price = g === "g1" ? this.ejemplo.p1 : this.ejemplo.p2;
    const L = LABEL[this.lang];
    return `
      <article class="card" data-good="${g}" style="--hue:${t.hue}">
        <header class="card-h"><span class="mark">${t.shape}</span>
          <span class="card-name">${name}</span></header>
        <div class="station" data-station="glyph">${GLYPHS[g]}</div>
        <dl class="stations">
          <div class="station" data-station="unit">
            <dt>${L.measured}</dt><dd>${u.unit}<span class="long"> · ${u.unitLong}</span></dd>
          </div>
          <div class="station" data-station="symbol">
            <dt>${L.quantity}</dt><dd class="sym" data-term="${t.term}">${t.term.replace("x", "x")}</dd>
          </div>
          <div class="station" data-station="price">
            <dt>${L.price}</dt><dd class="price">$${price}/${u.unit}</dd>
          </div>
        </dl>
      </article>`;
  }

  /** Reveals a station. The card fills in as the narration reaches each link. */
  reveal(g: GoodId, ...stations: Station[]): void {
    for (const s of stations) {
      this.shown[g].add(s);
      this.cards[g].querySelector(`[data-station="${s}"]`)?.classList.add("on");
    }
  }

  /** `morph`: a value changes IN PLACE. One of the two verbs Kristian approved — it is
   *  what carries the causal claim "this number changed, therefore the line moved". */
  morphPrice(g: GoodId, value: number): void {
    const el = this.cards[g].querySelector(".price") as HTMLElement | null;
    if (!el) return;
    const u = UNITS[g][this.lang].unit;
    el.classList.add("morphing");
    el.textContent = `$${value}/${u}`;
    setTimeout(() => el.classList.remove("morphing"), 420);
  }

  /** Sets the equation. `dim` shows the dimensional form above the compact one — units
   *  inside the equation, not beside it (codex, T-010). */
  setEquation(compactHtml: string | null, dimHtml: string | null = null): void {
    this.slot.textContent = "";
    if (dimHtml) {
      const d = document.createElement("div");
      d.className = "eq-dim";
      d.innerHTML = dimHtml;
      this.slot.appendChild(d);
    }
    if (compactHtml) {
      const c = document.createElement("div");
      c.className = "eq-compact";
      c.innerHTML = compactHtml;
      this.slot.appendChild(c);
    }
  }

  /** Highlights a term everywhere it lives at once — in the equation and on the card
   *  that owns it. This is A4, and it is only possible because the build-time renderer
   *  tags each term with a stable id. */
  highlight(...terms: string[]): void {
    for (const el of this.root.querySelectorAll("[data-term]")) {
      el.classList.toggle("lit", terms.includes((el as HTMLElement).dataset.term ?? ""));
    }
  }

  /** After `slope` the cards compress and the stage grows: the scaffold shrinks as the
   *  binding is internalised, but never disappears (fable, T-010). */
  compress(on = true): void {
    this.root.classList.toggle("compact", on);
  }
}
