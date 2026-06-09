# Agent Workflow

> How AI agents (Claude / Codex / etc.) should build in this repo: **fast, in small slices, without sacrificing production safety.** Distilled from the Collective Maps V1 + V1.5 sessions. Read this alongside [`AGENTS.md`](../AGENTS.md) (skills + branch rules) and [`STATE.md`](./STATE.md) (living state + decision log).

## 1. Purpose

This repo ships to production continuously. Agents move fast, but a broken `/peta`, a leaked member coordinate, or a runaway Google bill is far more expensive than a slightly slower session. This doc encodes the working rhythm that has shipped multiple slices cleanly:

- **Small slices** that each stand alone and are independently revertible.
- **Targeted checks while iterating**, **full validation once at the gate**.
- **Explicit stop conditions** so the agent surfaces decisions instead of guessing.

If you remember one thing: **ship the smallest safe change, validate it in proportion to its blast radius, and stop and report when anything is unclear.**

## 2. Core principle — small slices, targeted checks, full validation at gates

Three rules that compound:

1. **Small slices.** One coherent change per PR. Collective Maps V1 shipped as four commits — `docs` → `refactor` (typed union + `MapView`) → `Spots` layer → `Events` layer — each green, each revertible. The refactor that unlocked `/maps` (canvas extraction) was its own zero-behavior-change slice.
2. **Targeted checks while iterating.** Don't run the whole 4-step suite after every keystroke. Lint and test only what you touched; reach for the full suite at the gate.
3. **Full validation once, at the gate.** Before opening a PR (or before the final commit), run the full ladder for the slice's tier (see §5). The gate is where `npm run build` earns its keep — it catches RSC / client-boundary issues that `tsc` alone misses.

## 3. Branch workflow

- **Integration branch is `staging`.** Branch every slice from the **latest `origin/staging`**:
  ```bash
  git fetch origin
  git checkout -b feature/<slice-name> origin/staging
  ```
- **Never commit directly to `main` or `staging`.** Always go through a `feature/*` branch + PR.
- **PR base is `staging`.** After staging QA, `staging` is promoted to `main` as a release (merge commit, e.g. _"Release: … (staging to main)"_).
- **`main` is protected by a ruleset** requiring 1 approving review. A solo release that can't be self-approved is merged with `gh pr merge <n> --merge --admin` — but **only with explicit human approval**, never autonomously (see §8).
- _Note:_ `AGENTS.md` names `develop` as the integration branch; in current practice `staging` is the live integration branch and is what recent releases flow through. Confirm with the human if a session starts on an unexpected base.

## 4. Slice workflow

For each approved slice:

1. **Pre-flight.** `git status --short` (clean tree?), `git branch --show-current`, `git fetch origin`, branch from `origin/staging`.
2. **Read before writing.** Read the full current file(s) you're about to change. Reuse existing functions/patterns — don't reinvent loaders, adapters, or components that already exist.
3. **Implement the smallest version** that satisfies the slice. No scope creep.
4. **Targeted checks** as you go (§5 / §7).
5. **Full validation at the gate** (§5).
6. **Self-review the diff** (`git diff --stat` + read the diff) — confirm only the intended files changed.
7. **Commit** (§9), **push**, **open PR** (§10).
8. **Stop and report.** Do not start the next slice without approval.

## 5. Validation ladder

Match the validation effort to the change's blast radius.

### Docs-only

- `git diff --check` (whitespace errors / stray conflict markers)
- No npm validation required unless docs tooling exists.
- _Note:_ the pre-commit hook still runs `prettier --write` on `*.md`, so markdown gets normalized at commit time — expected, cosmetic.

### Small refactor (no behavior change, contained blast radius)

- Targeted ESLint on touched files: `npx eslint <files>`
- Targeted tests for affected logic: `node --test tests/<relevant>.test.mjs`
- `npm run build` (the real safety net for RSC / client-boundary issues)
- Run the **full** validation once before the PR if practical.

### Feature slice (new behavior, routes, data)

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- **Manual QA** (the feature's user-facing surface + a regression pass on what it touches)

## 6. Timeout rules

A command that produces no useful output for a long time is a problem to diagnose, **not** to wait out.

- **If any command runs more than ~10 minutes without useful output, stop it.**
- **Do not silently wait 50 minutes.** A long silent wait is itself a failure mode — it burns the session and hides the real issue.
- When you stop a stuck command: **isolate the slow step** (re-run the pieces individually), and **report the command, how long it ran, and its last output**.
- Background runners can also create a perceived hang: a chained command may finish while the completion notification lands after the client-side timeout. If a chained command appears stuck, **break it into individual steps** and run them one at a time — this both fixes the perceived hang and pinpoints any genuinely slow step.

## 7. Progressive validation commands

Escalate from cheap+narrow to expensive+broad. Run from `collective-library/`.

```bash
# 1. Scope check — what actually changed?
git status --short
git diff --stat

# 2. Targeted type check (whole project, but fast; no emit)
npx tsc --noEmit --pretty false

# 3. Targeted lint — only the files you touched
npx eslint components/map/map-view.tsx components/map/collective-map-canvas.tsx

# 4. Targeted tests — only the affected logic
node --test tests/member-map-item.test.mjs tests/spot-map-item.test.mjs tests/event-map-item.test.mjs

# 5. Build — the gate that catches RSC / client-boundary breakage
npm run build

# 6. Full suite — once, at the gate (feature slices)
npm run typecheck && npm run lint && npm run test
```

Prefer running the full chained suite as **separate steps** rather than one long `&&` chain, so a slow or stuck step is immediately visible (see §6).

## 8. Stop conditions

Stop and report (do **not** push through) when:

- The base branch is unclear or the working tree has unrelated/uncommitted changes you didn't make.
- A merge conflict appears, or a bugfix/other branch overlaps your target files in a risky way.
- typecheck / lint / test / build fails and the fix is **not** obvious.
- You're tempted to exceed the approved slice scope (add a route, a migration, a dependency, a new layer).
- A merge is blocked by branch protection and clearing it requires an **admin bypass** or a review you can't legitimately provide — get explicit approval first.
- You'd need to introduce a paid/external API, a secret, or anything that changes access controls or persistent config.
- A CI check is red but appears to be **infrastructure, not your change** (see §12 on the Vercel 401 smoke test) — report it as such; don't "fix" it inside an unrelated PR.

## 9. Commit strategy

- **One logical change per commit**, with a clear conventional-commit subject:
  - `docs: …`, `refactor: …`, `feat: …`, `fix: …`
- Slice naming carries through the session: docs → refactor → feature layers.
- End commit messages with the co-author trailer:
  ```
  Co-Authored-By: Claude <model> <noreply@anthropic.com>
  ```
- The **pre-commit hook runs `lint-staged`**: `eslint --fix --max-warnings=0` + `prettier --write` on `*.{js,jsx,ts,tsx}`, and `prettier --write` on `*.{json,css,md}`. So:
  - Commits can take a little longer — that's the hook, not a hang.
  - `--max-warnings=0` means a staged code file with **any** lint warning fails the commit. Keep touched files warning-clean.
  - Don't bypass the hook (`--no-verify`) unless a human explicitly asks.
- **Commit or push only when asked.** Don't auto-push.

## 10. PR expectations

PR base is `staging`. Body should include:

- **Summary** — what changed and why (the slice).
- **Files changed** — a short table; confirm scope (e.g. "docs-only", "no `/maps` route", "`peta-client.tsx` unchanged").
- **Confirmations** — no code / migrations / dependencies (as applicable to the tier).
- **Validation results** — which ladder steps ran and their outcomes (and a note if any step was validated individually due to a timeout).
- **Manual QA checklist** — for feature slices.
- **Next slice** — what's queued (gated behind approval).
- End the PR body with:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```

## 11. Review / merge rules

- Confirm before merging: PR open, base `staging`, **exact** changed-file list matches the slice, no out-of-scope files, mergeable + clean, validation passed.
- Merge method: **merge commit** (`gh pr merge <n> --merge`) — preserve sliced history; don't squash unless asked.
- After merge: report the **new `staging` HEAD SHA**.
- **Do not promote `staging` → `main` without explicit approval.** Production releases are a separate, deliberate step.
- **Do not start the next slice** until told.

## 12. Map-specific notes

- **`/peta` is the stable production route.** Do not break it. Member rendering, jitter (`markerPosition` seeded on the member id), and the privacy disclaimer are a contract — preserve them exactly.
- **`/maps` is the future fullscreen route** (planned, not yet built — see [`MAPS_V15_V2_PLAN.md`](./MAPS_V15_V2_PLAN.md)). It reuses the shared `CollectiveMapCanvas`; it must not regress `/peta`.
- **Privacy boundaries are strict and non-negotiable:**
  - **Members:** opt-in only (`show_on_map`), **approximate** coordinates (kecamatan centroid + ~250 m deterministic jitter), never exact address, no phone/WhatsApp in the map payload.
  - **Spots:** exact coordinates are OK **only** when `status='active' ∧ is_active ∧ visibility='public'`.
  - **Events:** shown **only** when public + non-hidden + scheduled + upcoming + linked to a coord-bearing public Spot. Online-only / private-location events are never pinned; coordinates are inherited from the public Spot.
  - All map loaders are **server-side, RLS-gated, fail-soft** (`return []` on error). The service-role client is **server-only** — never import it into client code.
- **Google / external map APIs must be explicit, backend-only, and never casually introduced.** When the time comes: server-side routes only, admin-first, **feature-flag + kill-switch** (graceful no-op if the key is unset), **cached**, **no per-map-load calls**, key never exposed to the client. Until then, the renderer stays Leaflet + Carto Positron.
- **Vercel Deployment Protection** sits in front of preview deploys. The anonymous CI smoke test can fail with **HTTP 401** at the "wait for deploy reachable" step — this is **infrastructure, not a product regression**, and is not a blocker for an unrelated PR. QA previews while logged into Vercel; flag the 401 as infra and move on.
- **Two-vocabulary rule:** the DB table is `library_nodes`; the user-facing label is "Spots". Don't rename the table to match the UI.

## 13. Good agent behavior

- Branches from latest `origin/staging`; keeps the tree clean.
- Reads the whole file before editing; reuses existing loaders/adapters/components.
- Keeps diffs scoped to the slice; self-reviews `git diff --stat` before committing.
- Uses targeted checks while iterating, full validation at the gate.
- Breaks long/chained commands into steps; never waits silently on a hang.
- Surfaces decisions (base branch, scope, protection bypass) instead of guessing.
- Reports concretely: what changed, what validation ran, what's the risk, what's next.
- Stops at the slice boundary and waits for approval.

## 14. Bad agent behavior

- Branching from a stale or wrong base; mixing unrelated changes into one PR.
- Expanding scope mid-slice (sneaking in a route, migration, or dependency).
- Running the full 4-step suite repeatedly mid-iteration (slow) **or** skipping `build` at the gate (risky).
- **Silently waiting tens of minutes** on a command that produced no output.
- Auto-pushing, auto-promoting to `main`, or admin-bypassing branch protection without approval.
- "Fixing" a pre-existing infra failure (the Vercel 401 smoke test) inside an unrelated feature PR.
- Introducing Google/paid APIs, secrets, or client-exposed keys without an explicit decision.
- Weakening a map privacy boundary (exact member coords, private event locations, service-role on the client).

## 15. Default checklist (copy into a session)

```
PRE-FLIGHT
[ ] git fetch origin
[ ] git checkout -b feature/<slice> origin/staging
[ ] git status --short  → clean
[ ] read the full target file(s); identify reusable code

IMPLEMENT
[ ] smallest change that satisfies the approved slice
[ ] no new route / migration / dependency unless the slice explicitly says so

VALIDATE (pick the tier)
[ ] docs-only:      git diff --check
[ ] small refactor: eslint <touched> · node --test <relevant> · npm run build
[ ] feature slice:  npm run typecheck · npm run lint · npm run test · npm run build · manual QA
[ ] any command quiet > ~10 min → STOP, isolate, report (don't wait 50 min)

REVIEW + SHIP
[ ] git diff --stat → only intended files changed
[ ] commit (conventional subject + Co-Authored-By trailer)
[ ] push feature branch
[ ] open PR → base staging (summary, files, confirmations, validation, next slice)
[ ] STOP — report and wait for approval (no auto-merge, no main promotion, no next slice)

MAP SLICES — EXTRA GUARDS
[ ] /peta still works; member jitter + privacy disclaimer intact
[ ] members approximate/opt-in; Spots/events exact only when public-safe
[ ] no service-role client on the client; loaders fail soft
[ ] no Google/paid API unless explicitly approved (backend-only, flagged, cached)
```
