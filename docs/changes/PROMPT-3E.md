# Prompt 3E: screen-state and design-system pass (website)

Owner decisions (to be recorded in spec §14 in the final docs PR): mobile orange is the primary brand
color everywhere; UX-09 covers string infrastructure plus the Phase 3A-3D screens only (rest = GLB-03).

## PR 4: tokens, shared states, accessibility base, state sweep
- `design/design-tokens.json` (copy of `gymsera_be/docs/design-tokens.json`) → `scripts/generate-tokens.mjs` → `src/styles/tokens.css`.
  `npm run tokens` regenerates; `tests/lib/design-tokens.test.ts` fails on drift and on any role pair below its contrast minimum.
  The website was already orange (`24 95% 53%` ≈ `#F97316`, white text 2.8:1, below AA). Primary is now `#C2410C` (white 5.18:1);
  `brand` `#FF5C00` is kept for decoration and large text.
- `ErrorState` (server sentence, Retry only when a retry can help, reference id, 403 never raw), `OfflineBanner`, `SkeletonList`, `SkipLink`
  + `#main-content` in both layouts; axe harness (`tests/helpers/axe.ts`).
- A failed load used to read as "No payments", "No Active Membership", "Subscription not found", "Gym not found", or a profile form
  offering to save blanks. Now each shows `ErrorState`; a 404 keeps its "not found" page.
  Pages: dashboard, subscriptions, subscription detail, payments, account statement, profile, public home (featured, top rated),
  gym list, gym detail, branch detail.

## Screen checklist
- [x] dashboard, subscriptions, subscriptions/[id], payments, account-statement, profile
- [x] public: home, gyms, gyms/[id], gyms/[id]/branches/[branchId]
- [ ] `gym-owner/register`, auth pages, contact / policy pages: no data queries; covered by the string pass (PR 6) only
- [ ] PR 6: next-intl + hard-coded-string check + converted screens
