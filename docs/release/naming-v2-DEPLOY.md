# Website deploy notes: `feat/naming-v2` (API contract v2)

## Order (all three together, one window)
1. **API first:** `gymsera_be` `feat/naming-v2-r2`, with its migrations, following the API's own deploy notes and
   `docs/runbooks/production-environments.md`. Check `GET /api/v1/health` shows the new commit.
2. **Website and CMS right after**, in the same window. The website on `main` calls v1 routes (`/discovery/gyms`,
   `/tenants/*`) that the v2 API no longer has; this website calls v2 routes the old API does not have.
3. Rollback: roll the API and both clients back together.

## Build
```
npm ci
NEXT_PUBLIC_API_URL=https://api.gymsera.com npm run build     # next build
```
`NEXT_PUBLIC_API_URL` must be the API origin only (no `/api/v1`). The build stops with an error when it has a path,
so a wrong value cannot ship. Run on the server in the site's own folder (or build elsewhere and copy `.next`,
`public`, `node_modules`, `package.json`, `server.js`, `web.config`, `next.config.*`). The site runs `server.js`
under iisnode (`web.config`).

## Environment variables
- **Added:** none. **Removed:** none.
- Used as before (set per site, never copied between sites): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CMS_URL`,
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`,
  `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_RELEASE`, `NEXT_PUBLIC_WEB_CARD_PAYMENTS_ENABLED`,
  `NODE_ENV`, `PORT`.
- `NEXT_PUBLIC_*` values are fixed at build time: build with the production values.

## IIS / hosting
- `web.config` and `server.js` are unchanged: nothing to change in IIS. The new page
  `/gym-owner/proof-of-premises` is served by the same Next.js server (no rewrite rule needed); `src/middleware.ts`
  sends signed-out visitors to sign in.
- After copying the build, touch `web.config` to restart the site (never `iisreset`).
- The API's `CORS_ORIGIN` must still list the website origin.

## After deploy
- Home, `/gyms`, a business page and a branch page load; titles read "<Business> · <Branch>"; no organization name shown.
- Start Become a Host with a test account up to the confirmation step (against production only with test data, R-19);
  the proof-of-premises card shows.
- `/gym-owner/proof-of-premises` signed out → sign-in page.
- `https://<site>/iisnode/index.html` answers 404.
