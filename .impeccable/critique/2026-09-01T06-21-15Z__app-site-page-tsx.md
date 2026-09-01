---
target: trang chủ và tổng thể storefront
total_score: 25
p0_count: 0
p1_count: 3
timestamp: 2026-09-01T06-21-15Z
slug: app-site-page-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Phí giao hàng: 0đ (đang cập nhật)" / "Thuế: 0đ (đang cập nhật)" leaves total accuracy ambiguous right at checkout |
| 2 | Match System / Real World | 3 | Domain-correct B2B terms (thùng/lẻ, quy cách), undercut by category photos that don't match real products |
| 3 | User Control and Freedom | 3 | Qty steppers/remove/back-link present; no order-history or post-submit edit path |
| 4 | Consistency and Standards | 3 | CTA color usage is disciplined; category-image accuracy is inconsistent (fine in most rows, wrong in "Mặt hàng khác") |
| 5 | Error Prevention | 2 | No visible inline validation cues on checkout form (phone format, required-field styling) |
| 6 | Recognition Rather Than Recall | 3 | Persistent cart badge, breadcrumbs, sticky filters reduce recall burden |
| 7 | Flexibility and Efficiency | 2 | No saved address, no quick-reorder, no bulk-qty input for wholesale buyers |
| 8 | Aesthetic and Minimalist Design | 2 | Large dead whitespace on cart page; gold/promo accents almost entirely withheld from the live surface |
| 9 | Error Recovery | 1 | No visible error-state styling found in checkout form source |
| 10 | Help and Documentation | 3 | Zalo/hotline on nearly every page; policy pages exist, no FAQ |
| **Total** | | **25/40** | **Acceptable — real gains available, foundation is solid** |

#### Anti-Patterns Verdict

**LLM assessment**: Layout skeleton (Gromuse-derived hero, pill category tiles, trust triptych) is a recognizable template shape — acceptable, already ratified. What pushes this toward "AI slop" is upstream of layout: **8 different SKUs/brands sharing one identical stock photo**, one category ("Mặt hàng khác" — coconut products) showing a **photo of bread loaves**, and a footer that literally reads **"Đang xây dựng"** (under construction) on a live, checkout-enabled storefront. None of that is a layout problem; all of it reads as an unfinished import to a visitor.

**Deterministic scan**: The CLI scanner (`detect.mjs`) is broken at the installed-skill level — `ERR_MODULE_NOT_FOUND` for `scripts/lib/impeccable-config.mjs`, confirmed not project-specific (same failure via the resolved symlink path). Fell back to the browser-injected detector (`detect.js` via `live-server.mjs`), which did run successfully in the page on all 4 URLs tested:

| Page | Rule | Count | Verdict |
|---|---|---|---|
| Home | `single-font` | 1 | False positive — one deliberate brand typeface is a legitimate choice, not a defect |
| Home | `image-hover-transform` | 52 | Not a bug — consistent, clipped `hover:scale-105` pattern used everywhere by design |
| San-pham | `single-font` | 1 | Same false positive |
| San-pham | `skipped-heading` | 1 | Real — `<h1>"Sản phẩm"` jumps straight to `<h3>` on product names, no `<h2>` |
| San-pham | `image-hover-transform` | 222 | Same systemic pattern, not 222 separate issues |
| San-pham | `nested-cards` | 1 | Plausible, not independently verified (no file/line — CLI path was unavailable) |
| Gio-hang | — | 0 | Clean |
| Thanh-toan | — | 0 | Clean |

**Confirmed via exact token math (not eyeballing)**: two real WCAG AA contrast failures — `text-ink/50` (≈3.39:1) on the "no photo yet" category placeholder text (`ProductCard.tsx:29`, `san-pham/[id]/page.tsx:82`), and `text-muted` (≈4.33:1) on `bg-surface-alt` panels (confirmed at `PolicyPage.tsx:26`, likely recurring elsewhere the same pairing is used). Both assessments independently flagged the *same* "Sữa đặc" no-photo placeholder as visually faint — good corroboration between the LLM read and the pixel math.

**Overlay note**: injection succeeded and the detector ran live in the page (headless automation, not a visible browser tab shown to you) — the findings above are the console output it produced, not a claimed on-screen overlay.

#### Overall Impression

The structural bones (CTA color discipline, sticky buy-box, dual retail/wholesale pricing shown inline, SKU codes on PDP) are genuinely good B2B e-commerce decisions that most templates get wrong. But two specific, fixable things are doing almost all the damage to "fresh" and "professional": **stock photography that's duplicated across unrelated products (and wrong in one category)**, and **a palette where 2 of 3 declared accent colors are essentially never shown** — so the page reads as white-cards-plus-oxblood-plus-lime-buttons, which is flat regardless of layout. Add a "Đang xây dựng" footer on a live checkout flow, and the site undercuts its own B2B-trustworthy positioning at the exact moments (browsing, paying) where that positioning matters most. None of this requires touching the Gromuse-derived layout — it's a content-accuracy and color-application problem, not a structural one.

#### What's Working

1. **CTA color discipline**: oxblood is reserved for brand/nav/price, lime is the *only* "act now" color across hero, category tile, add-to-cart, and PDP buy button — many templated sites don't hold this line this consistently.
2. **B2B-correct information density**: retail vs. case pricing and pack spec (quy cách) shown inline on every card without a click, SKU code visible on PDP — respects how a wholesale buyer actually decides, instead of hiding pricing behind a "contact us" wall.
3. **Sticky buy-box on PDP**: a deliberate, conversion-appropriate pattern, not a default template reflex.

#### Priority Issues

**[P1] Category photos are duplicated across unrelated SKUs, and one category is flatly mismatched.**
- **Why it matters**: 8 different brands/SKUs sharing one identical photo (and coconut-water products showing bread) is the single biggest driver of *both* complaints at once — it reads as an unfinished import, not a curated catalog, and erodes literal trust in what's being ordered.
- **Fix**: Audit `lib/categoryImages.ts` for the coconut/"Mặt hàng khác" mismatch first (looks like a genuine data bug, separate from the "one stock photo per category" design compromise). Where budget allows, rotate 2-3 photo variants per category so identical SKUs in the same grid don't render pixel-identical images.
- **Suggested command**: not a styling fix — needs a content/data pass; `$impeccable harden` can help audit this as a data-accuracy edge case once photos are sourced.

**[P1] The palette reads flat because 2 of 3 accent colors are almost never shown.**
- **Why it matters**: `--color-accent` gold appears only on a nav-link hover state (invisible in any static view); `--color-promo-a/b/c/d` are confined to 3 trust-badge icons and category-tile rings. ~95% of visible surface ends up white/near-white + oxblood + muted text, with lime confined to buttons — this is the direct mechanism behind "colors don't feel fresh," and it's a color-application gap, not a missing-token gap.
- **Fix**: Reintroduce gold with intent in a way that reads premium rather than playful — a thin gold rule under section headings, gold on the case-price badge, or a gold-foil-style border accent on the hero CTA. Uses tokens already declared; adds warmth without adding new colors.
- **Suggested command**: `$impeccable colorize`

**[P2] Two confirmed WCAG AA contrast failures on secondary text.**
- **Why it matters**: `text-ink/50` on the no-photo category placeholder (≈3.39:1) and `text-muted` on `bg-surface-alt` panels (≈4.33:1) both sit under the 4.5:1 body-text minimum — concrete, measured, not a matter of taste.
- **Fix**: Bump `text-ink/50` toward `/70-80` opacity or a dedicated darker placeholder-text token; bump `text-muted` a shade toward ink wherever it sits on `bg-surface-alt` specifically (it passes on plain white/surface, only fails on the alt panel background).
- **Suggested command**: `$impeccable audit`

**[P1] Trust-signal gaps at the two highest-stakes moments (footer, checkout).**
- **Why it matters**: The footer reads "© 2026 Trà & Bánh. Đang xây dựng." on every page, including checkout with live VietQR payment wired up — directly contradicts the "trustworthy long-term B2B supplier" positioning. Checkout itself has no security/reassurance microcopy, no order-number preview, generic input-border styling — the exact page where a first-time buyer wiring money needs the most confidence gets the least design attention.
- **Fix**: Remove/replace the "Đang xây dựng" line in `components/Footer.tsx`. Add a short trust line near the checkout submit button (the icon set already has `ShieldCheckIcon` — reuse it) and give the "Đặt hàng" button a moment of visual weight consistent with the "raised card" language used elsewhere.
- **Suggested command**: `$impeccable clarify` (copy/microcopy), then `$impeccable layout` for the checkout submit-area treatment

**[P2] Layout monotony and inverted add-to-cart hierarchy.**
- **Why it matters**: Both assessments independently flagged the home and catalog pages as very long (14k–31k px), stacking ~10 near-identical product-grid sections with no visual pacing break — this reads as repetitive/generic on its own, and compounds the "same photo" fatigue. Separately, the add-to-cart stepper uses `bg-cta-soft` (near-white mint) on a white card, making the literal purchase action the lowest-contrast element on every product card — an inverted hierarchy for the one thing that should feel most alive.
- **Fix**: Introduce a pacing break (a full-bleed banner, a differently-composed row, or a divider treatment) every 3-4 category rails instead of uniform grids end to end. Darken `cta-soft` or add a visible `--color-cta` border/ring so the add-to-cart control reads as raised and tappable.
- **Suggested command**: `$impeccable layout`

#### Persona Red Flags

**Casey (mobile-first shopper)**: The 11-item category filter-chip row on Flash Sale has no visible truncation/collapse logic in source — strong risk of horizontal overflow on a phone. Repeated stock photos will also be more noticeable on mobile, since Casey sees fewer cards per row but scrolls past more of them serially — the "have I seen this" fatigue compounds faster.

**Riley (edge-case hunter)**: The coconut-product-with-bread-photo mismatch is exactly the kind of thing Riley would screenshot and share — it's worse than no image, since the code already has a documented "no image → text fallback" for genuinely missing photos, but this bug bypasses that safety net by resolving to a valid-but-wrong photo. The "Đang xây dựng" footer text is a first-glance credibility hit on every trust check Riley runs.

**Jordan (first-time visitor)**: Jordan sees identical photos repeated 4-8× per row before reaching any differentiating content — priming skepticism ("is this a real store?") at the worst possible point, first impression. The trust triptych (Hàng chính hãng / Giao hàng tận nơi / Tư vấn miễn phí) sits after two full scroll sections (hero + categories + Flash Sale) — a first-timer evaluating a B2B site should see trust signals earlier, not after 3 screens of scrolling.

#### Minor Observations

- `text-muted` on plain white/surface passes comfortably (4.77-5.16:1) — the contrast problem is specific to the `bg-surface-alt` pairing, not `text-muted` everywhere.
- Single grotesque sans (Be Vietnam Pro) used identically for H1/body/price is functionally fine and not a "bug" (the detector's flag here is a false positive), but it contributes zero typographic distinction toward "elegant/premium" — a deliberate weight/spacing contrast or a second family for headings specifically would support the elegance goal without touching the Gromuse layout.
- `skipped-heading` on `/san-pham` (h1 → h3, no h2) is a real, cheap semantic/accessibility fix independent of the visual critique.
- Price typography (bold oxblood on white card) is a genuine strength — the highest-contrast, most "premium price tag" moment on the card.
- SKU code visible on PDP (`Mã sản phẩm: 96A61816`) is a nice, uncommon-in-templates B2B trust detail.
