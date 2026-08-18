# Design System Analysis — "Gromuse" Grocery E-commerce UI Kit

Source: two screen-recording videos analyzed frame-by-frame (`public/videos_ecomerce`, 35.6s/2136 frames; `public/videos ecomerce 2.mp4`, 28s/1684 frames — both gitignored, local reference only). Together they cover: Home, Category/PLP, Product Detail (PDP), Search-with-autocomplete, Cart/Checkout, Payment modal (Klarna), and Order Confirmation. No footer was captured in either recording.

This document is written as a **standard design-system extraction prompt** — reusable as an input spec for any AI design/build tool, or as a reference brief for a human designer/developer.

---

## 1. Layout Structure

- **Grid base**: 12-column-equivalent responsive grid, centered content column (~1200–1280px max-width on desktop), generous outer gutters.
- **Header**: full-width fixed-height bar (~72px), 4-zone horizontal layout: `[hamburger + logo]` — `[search bar, flexible width]` — `[delivery-time microcopy]` — `[cart icon + 2 avatar icons]`. Persistent across all pages, same on Home/PLP/PDP/Cart.
- **Home page**: single-column vertical stack of full-bleed sections, each section internally centered to the grid: Hero → Category rail → Product grid → Promo strip (4-up) → Best-selling (tabbed) → App/contact banner → Second product grid → Store comparison cards.
- **PLP (Category listing)**: optional promo banner at top → breadcrumb → horizontal filter/sort bar → N-column product grid (5 columns desktop) → (in variant 2) "Others store" price-comparison rows → "Similar products" rail.
- **PDP (Product detail)**: 2-column split (~45/55) below header: left = image stage (1 large square image + 4–5 thumbnails in a row), right = a single vertical stack (badges → title block → price → payment-plan badge → CTA row → secondary links → trust row → SKU/category metadata → description → 2-up info tiles).
- **Cart/Checkout**: 2-column split (~60/40): left = "Delivery information" card + "Review item by store" (grouped by vendor/store, collapsible), right = sticky "Order summary" card (payment method radios, promo code field, price breakdown, CTA stack).
- **Modals**: centered overlay, ~440px width, white rounded card, dimmed backdrop — used for search autocomplete (anchored under search bar, not centered), payment loading state, payment method detail (Klarna), and order confirmation.

## 2. Visual Hierarchy

1. **Header brand color block** is the strongest visual anchor on every page — establishes brand identity before any content is read.
2. **Hero/promo banners** (large color blocks with bold headline) are the second-strongest element, always above the fold on Home/PLP.
3. **Section titles** (e.g. "You might need", "Weekly best selling items") are bold, dark, left-aligned, paired with a lightweight "See more →" link in the accent/link color on the opposite edge — this pairing (bold title left / quiet link right) repeats on every section and is a core hierarchy pattern.
4. **Price** is the strongest element within a product card — larger and bolder than the product name itself, using a two-tier size (large integer + small decimal) to compress visual weight while keeping full precision.
5. **CTA buttons** use color (lime-green fill) rather than size to stand out — buttons are not oversized, they rely on being the only saturated color in an otherwise neutral card.
6. Body/meta text (subtitle, weight, SKU, categories) is uniformly muted gray, one step removed from the hierarchy — never competes with title or price.

## 3. Typography

- **Two-family system inferred**: a rounded/geometric sans for headings (slightly heavier, tight tracking) and a plain humanist sans for body/UI text. No serif anywhere in the kit.
- **Approximate type scale** (desktop):
  - Hero H1: ~32–36px, bold (700), 2-line wrap, tight line-height (~1.2)
  - Section H2: ~22–24px, bold (700)
  - Product title (card): ~15–16px, semibold (600), 1–2 line clamp
  - Product title (PDP): ~22–24px, bold
  - Price — large digits: ~24–28px bold; decimal/cents suffix: ~13–14px, same baseline, superscript-style
  - Body/subtitle/meta: ~13–14px, regular, muted gray
  - Micro labels (badges, "500 gm.", SKU): ~11–12px
- **Price typography is a signature pattern**: `29.` in large bold + `12$` in small bold on the same line, not a uniform-size price string — this is used identically on every card and on the PDP.
- Buttons and pill labels: semibold, no uppercase transform (sentence case preserved, e.g. "Add to bucket", "Buy now").

## 4. Color Palette

Two color identities appear across the two recordings (likely two theme variants of the same kit) — document both, pick one at implementation time:

**Brand primary (Variant A — teal)**
- Header/hero/active-state: dark teal green, ~`#0F4C42`–`#0E5449`
- CTA accent: lime green, ~`#A8E063`–`#B4E876`, darker lime on hover

**Brand primary (Variant B — maroon, seen on PLP promo banner in video 2)**
- Promo block: deep maroon/burgundy, ~`#6E1423`–`#7A1B2E` (notably close to a standard "oxblood" brand red)
- Accent within that block: warm gold/mustard button, ~`#D9A441`

**Shared secondary palette (both variants)**
- Surface/background: near-white cool gray, ~`#F5F6F5`–`#F7F7F5` (not pure white, not warm cream)
- Card surface: pure white `#FFFFFF` with a very subtle shadow, no visible border in most cards
- Ink/heading text: near-black with a slight cool tint, ~`#1A2E28`–`#14201C`
- Muted/meta text: mid gray, ~`#8A9490`
- Promo strip 4-up: pink `#F4C6D8`-ish, terracotta/orange `#D98B5F`-ish, blue `#1F3B73`-ish, purple `#5B2E86`-ish — each a saturated flat block, no gradients
- Full-width secondary banner (e.g. "SALE NOW ON"): navy `#1B2A5E`-ish
- Success/confirmation: same lime green as CTA, used for checkmark icon and "Continue shopping" button
- Discount/urgency badges: red `#D8362E`-ish (circular "70% DISCOUNT" badge), fire emoji + red text for "100 sold in last 35 hour"
- Payment brand chip (Klarna): pink `#F7B4C6`-ish flat chip, kept as a third-party brand color, not blended into the palette

**Color usage rule observed**: exactly one saturated brand color per page (teal or maroon) carries the "wayfinding" role (header, active states); lime green is reserved exclusively for the primary purchase action across every screen; all other color (pastel promo blocks, navy sale banner, red badges) is decorative/informational and does not repeat the brand color.

## 5. UI Components

- **Pill button, filled** — fully rounded (border-radius ≈ 999px / pill), used for primary CTA ("Shop now", "Buy now", "Confirm order"). Height ~40–44px.
- **Pill button, outline** — same radius, transparent fill, 1px border, used for secondary action ("Add to bucket").
- **Quantity stepper** — starts as a single pill-shaped "+" button (bottom of product card); on tap, morphs in-place into a `− [qty] +` 3-segment pill with lime-green fill — no page reload, no modal.
- **Product card** — white rounded rectangle (radius ≈ 16–20px), no visible border, very light shadow. Fixed internal padding, square product image at top with no card padding around the image itself (image bleeds to card edges), then padded text block below.
- **Category tile** — smaller white rounded card, icon/image + 2-line text (name + subtype), used in a horizontal rail of 5 + 1 "see all" tile.
- **Filter dropdown chip** — pill-shaped, white/outline by default, one filled dark-brand pill for the active/default filter ("All Categories"), chevron-down icon, arranged in a horizontal row with a right-aligned "Sort by" dropdown as the outlier (different color, sits apart from the filter group).
- **Breadcrumb** — plain text with `/` separator, no chevron icons, dark ink color, sits directly under header.
- **Countdown timer** — 4-segment `HH : MM : SS : ms`-style monospace-ish numerals in red/orange, small clock icon prefix.
- **Rating row** — single star icon + numeric rating + underlined "(N reviews)" link, all inline, small size.
- **Star/thumbnail gallery** — 4–5 small square thumbnails in a row under the main image, active one gets a subtle ring/border.
- **Badge, circular** — dark navy circle with white bold text, 2-line ("70%" / "DISCOUNT"), positioned overlapping the top-left corner of the main product image.
- **Badge, rectangular ribbon** — small dark pill top-left of image ("Free Delivery") in PDP variant B.
- **Trust/social-proof row** — small colored circular avatar/icon cluster + "🔥 100 sold in last 35 hour" text, inline, understated (not a hero element).
- **Search bar with live autocomplete** — pill input inside header; on focus, a large white dropdown panel appears below (not modal-centered) with two zones: "Recommended searches"/"Popular search" as a 2-column tag-like list (icon + name + price) before typing, switching to "Suggestions" (text list) + "Products" (icon + name + price mini-cards) columns while typing, plus a bottom "View all results" link.
- **Store/vendor comparison card** — horizontal row: small colored logo circle + store name + delivery-time microcopy (left) + price (right), light-tinted background when it's the currently-selected/cheapest option, small "Lower price" ribbon badge on the best option.
- **Cart line item** — thumbnail + name + weight + price on one row, qty stepper inline, a secondary "↻ Replace with [other store]" link below — cart is grouped by store/vendor with a collapsible section header per store.
- **Order summary card** — radio-button payment method list, promo-code text input + "Apply" button pair, a plain-text price breakdown table (label left, value right, no borders between rows except a rule before the bold Total row), then a stacked button pair (branded "Continue with Klarna" outline, then filled "Confirm order").
- **Modal, transient state** — centered white rounded card, animated ring-spinner icon + 2-line status text, used for a "logging you in" loading state — no buttons, dismisses automatically.
- **Modal, payment detail** — centered white rounded card with brand chip header, itemized installment schedule as 4 small tiles, masked card number row with "Change" link, single full-width black "Confirm to Pay" button (breaks from lime-green CTA convention deliberately, signaling a final/serious action).
- **Modal, success/confirmation** — centered white rounded card, large circular lime-green checkmark icon, bold "Order Confirmed" title, 1-line description with the user's email inlined, 2-button stack (outline "View order details" / filled "Continue shopping").

## 6. Spacing System

Inferred 8px base unit, consistent with the rounded/soft aesthetic:

- Card internal padding: ~16–20px
- Gap between grid cards: ~16px (desktop), collapses on mobile
- Section vertical rhythm: ~48–64px between major sections
- Header height: ~72px, fixed
- Button horizontal padding: ~24–32px, vertical ~10–12px (pill height ~40–44px)
- Border-radius scale: small chips/badges ~999px (pill) or ~8px; cards ~16–20px; hero/banner blocks ~24–32px with one edge (bottom of hero) using a custom wave curve rather than a simple radius.

## 7. Section Organization

**Home page** (top → bottom): Header → Hero (headline + CTA + product image, wave-bottom) → Category rail (5 tiles + "see all") → "You might need" product grid (title + see-more, 2 rows × 5 cols) → Promo strip (4 flat-color cards) → "Weekly best selling items" (title + see-more, category pill-filter row, product grid) → App/contact banner (large color block, 2-col: text+badges / photo) → "Just for you" product grid → "Featured store" (3 colored brand cards).

**PLP**: Header → (optional) promo banner → Breadcrumb → Filter/sort bar (sticky) → Product grid → "Others store" price-comparison list (optional, when viewed from a specific product context) → "Similar products" rail.

**PDP**: Header → Image gallery (main + thumbnails) + right column: countdown timer → shop name → title → rating → price → payment-plan badge (Klarna) → CTA row (outline + filled) → wishlist/compare links → trust row (payment icons + sold-count) → SKU/categories → description → 2-up info tiles (delivery/quality) → "Others store" comparison → "Similar products" rail.

**Cart/Checkout**: Header → left: "Delivery information" (address card) + "Review item by store" (grouped line items, per-store collapse, replace-item action) → right (sticky): "Order summary" (payment method radios, promo field, price breakdown, dual CTA) → modal sequence on submit: loading → payment-provider detail modal → success modal.

## 8. Design Style

**Overall descriptor**: Friendly, high-density instant-grocery-delivery aesthetic (same family as Instacart/Gopuff/Getir) — optimized for fast scanning and repeat/quick purchasing rather than editorial storytelling. Soft, rounded, low-contrast-shadow "flat-plus-depth" style: cards read as flat white shapes with a whisper of elevation, never skeuomorphic, never glassmorphic.

**Key style traits**:
- Generous rounding everywhere (pills for actions, large radii for cards/heroes) — no sharp corners in the entire kit.
- Exactly one saturated brand hue carries wayfinding; a single accent (lime green) carries all purchase actions; everything else is neutral or used once, decoratively.
- Density is high (5-column grids, dense metadata rows) but each individual card stays legible via strict internal hierarchy (image → name → meta → price → action), never by increasing whitespace.
- Motion implied by the design (not observed directly, inferred from UI affordances): the "+" → stepper morph and the autocomplete panel both imply lightweight, fast, no-page-reload micro-interactions — speed is a design value, not just a UX nicety.
- Trust and urgency signals (countdown timers, "sold in last N hours", star ratings, delivery-time microcopy) are woven throughout but kept small/inline — never a dominant visual element, always supporting copy next to the real content (price, product).
- Third-party payment branding (Klarna) is preserved as-is rather than reskinned — signals the kit treats payment trust marks as content, not decoration.

---

### How to use this prompt

Paste the relevant section(s) into a design/build tool as a spec, or use the whole document as a grounding reference before implementing a Gromuse-style UI in a different color system. When adapting to a new brand, the single highest-leverage decision is **Section 4's "color usage rule"**: pick one saturated brand color for wayfinding, keep exactly one accent for purchase actions, and leave every other color block independent and decorative.
