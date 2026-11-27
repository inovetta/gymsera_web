# Website: API contract v2, business and branch names, and proof of premises after sign-up (R-120, NEW-303)

**Branch:** `feat/naming-v2` → `main` (7 commits, fast-forward, no conflicts with `main` at the time of writing).
**Needs:** the API from `gymsera_be` `feat/naming-v2-r2` (contract v2). This website does not work against the current
production API, and the current production website does not work against the v2 API: release them together (see the
deploy notes).

## What changes

**Traveller pages**
- Discovery reads the v2 routes: `/discovery/branches…` (lists keyed `branches`) and
  `/discovery/businesses/:businessId` (with reviews and payment details).
- Titles: the business page is the business name; branch pages and search cards read "<Business> · <Branch>".
- The organization name is never shown to travellers (D3): the "by <brand>" byline is removed.
- A small verified check ("Registration document checked by GymsEra") beside the business name, only when
  `businessVerified`. It never changes who can see a business.
- Public URLs stay the same (`/gyms/[id]`, `/gyms/[id]/branches/[branchId]`); `id` is now the business id, so links
  and bookmarks keep working.

**Become a host (wizard)**
- The steps are Organization → Business → Branch. The organization name says "Only you and GymsEra see this".
- `POST /organizations/:organizationId/first-business` sends `organizationName`, `firstBusinessName`,
  `firstBusinessDescription`, `genderType` and one `firstBranch` (branch name, city, `areaId` or a typed-area
  `areaRequestId`, address, map pin, place id, phone, weekly hours, photos, plans).
- Branch phone is now required before Photos, because the API requires it.
- Photos go to `POST /host/staging-images` (3 to 10); nothing is saved on the server before submit.
- After submit: "Upload your proof of premises to go live", on the confirmation step and at the new page
  `/gym-owner/proof-of-premises` (sign-in required). It follows `GET /host/status` `nextStep`: before the organization
  is approved it says when the upload opens; then it uploads to `POST /host/businesses/:businessId/kyc-documents`
  (type `PROOF_OF_PREMISES`); then "GymsEra is reviewing"; then the business shows as live.

## How it was checked
- Tests: 219 / 219 (`vitest`), `tsc` clean, `next lint` clean, `next build` OK.
- Live run against a local v2 API (`feat/naming-v2-r2` `36930cd`, throwaway database): the wizard's calls from register
  to submit, the proof upload at `nextStep`, approval, branch visible in discovery with `businessVerified`; 26 / 26 checks pass.
- Every API path the website calls was matched against the contract route table: all found; no `/tenants`,
  `/host/listings`, `/discovery/gyms` or other old API route is called.

## Reviewer notes
- `/gyms…` in the website is the public page URL, not an API route; kept on purpose so links keep working.
  The internal type is still called `GymListing` (code name only, not sent anywhere).
- No environment variable added or removed; `web.config` and `server.js` unchanged; `src/middleware.ts` protects the
  new `/gym-owner/proof-of-premises` page.
- Tracked leftover files `tests/components/*.test.tsx-E` (sed backups from an earlier commit) are not part of this
  change; remove them separately.
- No merge or deploy from this PR without the API release (deploy notes: `docs/release/naming-v2-DEPLOY.md`).
