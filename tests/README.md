# Tests

## E2E (Playwright)

Anonymous smoke tests. No DB writes, no auth — safe to run against staging or prod.

### Local

```bash
npm install
npx playwright install --with-deps chromium webkit
npm run build
npm run test:e2e          # headless
npm run test:e2e:ui       # interactive runner
```

Local runs auto-start `next start` on `:3000`. Set `PLAYWRIGHT_BASE_URL` to skip
the local server and hit a deployed URL instead:

```bash
PLAYWRIGHT_BASE_URL=https://staging-xxx.vercel.app npm run test:e2e
```

### CI

Two workflows in `.github/workflows/`:

- **ci.yml** — runs on every PR to `staging`/`main`/`develop`: lint + typecheck + build.
- **e2e.yml** — runs on push to `staging` (after Vercel deploys) and via manual
  dispatch. Hits `vars.STAGING_URL` (repo variable). Override via
  `workflow_dispatch.inputs.base_url`.

#### Required repo config (one-time)

GitHub repo → **Settings** → **Secrets and variables** → **Actions**:

**Secrets** (used by `ci.yml` build step):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`

**Variables**:

- `STAGING_URL` — e.g. `https://collectivelibrary-git-staging-xxx.vercel.app`

## What's NOT covered yet

- Auth flows (need a Supabase test project + seeded users)
- Admin / mastermind surfaces (RLS-gated)
- DB write paths (event create, RSVP, host-spot inline-create, manifest submit)
- Mobile responsive layout regressions (only homepage runs on iPhone 13 viewport)

Add Playwright tests under `tests/e2e/*.spec.ts`. Prefer anon flows until we
provision a test Supabase project.
