---
target: components/admin/ShipperClient.tsx (/admin/shipper)
total_score: 24
p0_count: 0
p1_count: 3
timestamp: 2026-09-29T01-57-16Z
slug: components-admin-shipperclient-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/busy text states exist, but no success confirmation after a claim — the card just moves tabs silently. |
| 2 | Match System / Real World | 3 | Field order matches real driver workflow; "Tuyến" clustering is a new concept with no inline explanation. |
| 3 | User Control and Freedom | 1 | No way to release/un-claim a mistakenly-claimed order anywhere in the app. |
| 4 | Consistency and Standards | 2 | Reuses `Segmented`/`.btn` well, but breaks the codebase's own SVG-icon convention (raw emoji instead), and confirms the *lower*-stakes action while leaving the higher-stakes one unconfirmed. |
| 5 | Error Prevention | 2 | Server-side race-safe claiming is solid, but zero preview/confirmation before committing to a whole route sight-unseen. |
| 6 | Recognition Rather Than Recall | 4 | Everything needed lives on the card; tap-to-call/tap-to-map remove all memorization. |
| 7 | Flexibility and Efficiency of Use | 3 | Nearest-neighbor auto-sort and batch route-claim are genuine efficiency wins; no manual override of the algorithm's order. |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained, single-column, no ornamental clutter — undercut slightly by emoji icons and native OS dialogs. |
| 9 | Error Recovery | 3 | Race-condition copy is specific and good; generic "Cập nhật thất bại" on delivery-update failure doesn't say why. |
| 10 | Help and Documentation | 0 | No help affordance or explanation anywhere (e.g. what "Tuyến"/3km radius means). |
| **Total** | | **24/40** | **Acceptable — real improvements needed, no core flow is broken.** |

#### Anti-Patterns Verdict

**LLM assessment**: Does not read as classic AI-slop by visual tells — no side-stripe borders, gradient text, glassmorphism, ghost-card border+shadow stacking (closest is `.shipper-card` at 14px max shadow blur, under the 16px ban threshold), over-rounded corners, decorative eyebrows/numbering, or hero-metric template. It reads as a plain, restrained, on-brand internal tool consistent with the rest of the admin. What *does* undercut it: raw emoji (`📞`, `📍`) used as functional icons instead of the project's own `components/admin/icons.tsx` system — this directly contradicts a convention the project already enforced elsewhere (emoji explicitly removed from `ProductCard`) — plus leaning on bare `alert()`/`confirm()` for every important moment instead of in-app styled feedback. Reads less like "AI made this," more like "shipped before the details were finished."

**Deterministic scan**: Unavailable. `detect.mjs` crashed with `ERR_MODULE_NOT_FOUND` — a missing dependency (`lib/impeccable-config.mjs`) in the globally-installed skill package itself (confirmed absent via filesystem-wide search), not something fixable by retargeting the command or editing this file. This is a broken tool install, tracked separately from this critique.

**Visual overlays**: Not available. No headless-browser capability existed in the assessment session, and the target route requires real Supabase auth with no test credentials available — confirmed the auth wall is real via `curl` (307 redirect to `/admin/login`), but no `[Human]`-tab overlay could be shown. This critique is based on rigorous source/CSS reading rather than live visual inspection; flagged explicitly rather than glossed over.

#### Overall Impression

The redesign accomplishes its structural goals — tabs instead of stacked sections, real nearest-neighbor ordering, collapsible route grouping, tap-to-navigate — and none of it reads as generic AI output. But the confirmation budget is backwards: the page asks a driver to confirm the delivery that's *already physically done* while letting them commit to an entire multi-order route, sight unseen, with one tap and no way back. That's the single biggest opportunity here.

#### What's Working

1. **Nearest-neighbor route ordering removes real planning burden.** `orderByNearestNeighbor(mine)` answers the driver's actual question — "which do I deliver next" — using real haversine distance, instead of leaving them to plan a route from a claim-order list.
2. **Race-safe claiming with honest, specific recovery copy.** The conditional `UPDATE ... WHERE status='dang_xu_ly' AND shipper_id IS NULL` pattern correctly handles concurrent shippers, and the failure copy states exactly what happened and how much of the action succeeded (`"Đã nhận 2/3 đơn trong tuyến — 1 đơn vừa được shipper khác nhận mất."`) rather than a generic error.
3. **A real, non-fabricated progress counter.** "Đã giao N đơn hôm nay" queries `order_status_history` for real events today and only renders when `>0` — matches the codebase's own house rule against fabricated metrics, applied correctly here.

#### Priority Issues

**[P1] Blind route-claim: the batch-claim button works before the route is ever expanded**
- **What**: `shipper-route-claim` renders immediately after the collapsible header but *before* the `{expanded && cluster.map(...)}` block — "Nhận cả tuyến (N)" is tappable while the route is still collapsed and no individual order (address, amount, payment method) is visible.
- **Why it matters**: A driver can commit to multiple deliveries based on nothing but a count and a radius number — including a COD order they can't fulfill, or an inconvenient address — with no preview and (see next issue) no way to give it back.
- **Fix**: Disable the claim button until `expanded` is true, or surface a compact inline summary (total amount, addresses) in the collapsed header so the decision is informed without a separate step.
- **Suggested command**: `$impeccable clarify` (decision-point copy/flow) or direct fix.

**[P1] No way to release a mistaken claim**
- **What**: No "trả đơn"/un-claim action exists anywhere. Once `claimOrder`/`claimRoute` succeeds, the order stays assigned with no self-service reversal.
- **Why it matters**: Combined with the blind-claim issue, one mis-tap becomes a stuck obligation requiring an out-of-band phone call — a hard "no exit" (Heuristic 3 scored 1/4 largely because of this).
- **Fix**: Add a secondary action on `mine`-tab cards that reverts `status` to `dang_xu_ly` and clears `shipper_id`, reusing the same race-safe conditional-update pattern already proven for claiming.
- **Suggested command**: direct fix (new server action + button).

**[P1] No refetch when the app resumes from background/lock screen**
- **What**: The only refresh triggers are initial mount and the Supabase realtime subscription. No `visibilitychange`/focus listener forces a refetch.
- **Why it matters**: Delivery drivers routinely lock their phone or switch to Maps between stops; mobile browsers can suspend WebSocket connections in the background. A shipper can return to a stale list believing an order is still available when it isn't, or still in-progress when it's done — exactly the staleness the server-side race guard exists to prevent, moved to a client blind spot.
- **Fix**: Add a `visibilitychange` listener that calls `refresh()` when the tab becomes visible again.
- **Suggested command**: direct fix (small `useEffect` addition).

**[P2] Concurrent route-claim UI state bug**
- **What**: `claimingRoute` is a single `useState<number | null>`. Tapping Route B's claim while Route A's claim loop is still in flight overwrites the state — Route A's "Đang nhận..." label silently reverts while its async work (and possible delayed alert) is still pending.
- **Why it matters**: A verifiable inconsistent-state bug under a realistic stress scenario (Riley persona), not hypothetical — a driver tapping quickly between two routes gets misleading busy-state feedback.
- **Fix**: Track busy state as a `Set<number>` of in-flight route indices instead of a single value.
- **Suggested command**: direct fix.

**[P2] Emoji used as functional icons instead of the project's own SVG icon system**
- **What**: `OrderCard` uses raw `📞`/`📍` rather than an icon from `components/admin/icons.tsx`.
- **Why it matters**: Contradicts the project's own documented convention (emoji already removed from `ProductCard` per `docs/component-conventions.md`) and the global no-emoji-as-icon rule; renders inconsistently across platforms; screen readers announce literal glyph names ("telephone receiver", "round pushpin") ahead of the actual data on every card.
- **Fix**: Add `PhoneIcon`/`MapPinIcon` to `components/admin/icons.tsx` using `currentColor`, matching the established pattern.
- **Suggested command**: direct fix.

**[P2] Timestamp fails WCAG AA contrast**
- **What**: `.shipper-card-time` uses `var(--faint)` (`#98989d`) on white at 12.5px — computed contrast ≈2.9:1, under the 4.5:1 AA minimum.
- **Why it matters**: Order timestamp is real operational data, not decoration, and this population reads it outdoors, often in bright sunlight where marginal contrast fails hardest.
- **Fix**: Switch to `var(--muted)` (≈5.1:1, passes AA); keep `--faint` for genuinely decorative elements like the chevron.
- **Suggested command**: `$impeccable audit` (accessibility pass) or direct fix.

#### Persona Red Flags

**Casey (distracted, one-handed, outdoors, rushed)**: The blind-route-claim issue is Casey's exact failure mode — a rushed thumb-tap on an always-visible claim button before ever scrolling to see what's inside. Phone/address rows sit close together (`gap: 6px`, no extra padding) — a mis-tap here isn't cosmetic, `tel:` dials a real customer. The failing-contrast timestamp is a daylight-glare problem specifically for this persona. Native `alert()`/`confirm()` interrupts read as "the app broke" to someone triaging quickly between drops.

**Riley (stress-tester)**: The concurrent-claim state bug above is a genuine, reproducible inconsistency, not hypothetical. A null/empty `customer_address` silently omits the entire map row (`{order.customer_address && (...)}`) with no fallback text — no signal that destination data is simply missing. The background/lock-screen refetch gap is a textbook Riley test: navigate away, come back, is state actually current? The geocode-pending POST fires on *every* realtime event on the entire `orders` table with no filtering — every shipper's client re-triggers it on every order change shop-wide.

**Sam (accessibility-dependent)**: Emoji icons get announced by literal name ahead of the actual data, with no `aria-hidden`, adding auditory noise on every card. The failing-contrast timestamp is a direct WCAG 2.1 SC 1.4.3 failure. No un-claim control means a switch-access or keyboard-only user who mis-activates "Nhận đơn" has zero in-app recovery path.

#### Minor Observations

- Default tab is "Đang giao" — a shipper starting a shift with nothing claimed lands on an empty tab (mitigated by the cross-tab CTA, but still one extra tap).
- The delivery `confirm()` dialog only includes the order code, not the customer name — doesn't help disambiguate similar-looking cards.
- The static "Đơn lẻ (N)" header is visually near-identical to the clickable route headers aside from cursor style — nothing signals at a glance that it's inert.
- Tab counts don't visibly tick during a multi-order route claim — partial success only surfaces via the end-of-loop alert.
- No manual refresh/pull-to-refresh affordance exists; the page fully trusts the realtime channel to stay connected.

#### Questions to Consider

- If claiming a route exists to save the driver decision-making effort, why does it carry *less* friction than confirming a delivery that's already physically done?
- Is claiming meant to be permanent from the shipper's side (only a dispatcher can reassign)? If so, should that be surfaced *before* claiming rather than discovered after a mistake?
- What would this look like if the realtime subscription were treated as an optimization rather than the sole source of truth — e.g. a "last synced Xs ago" indicator plus a resume-from-background refetch?
