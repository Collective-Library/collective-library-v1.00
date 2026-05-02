<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


**Development note:**

Branching workflow:
1. New Feature: create `feature/feature-name` branch from `develop`.
2. PR to `develop`: once the feature is ready, create a PR to `develop` for review & staging.
3. Release:
   - Bulk: `develop` -> `main`.
   - Single: `feature/feature-name` -> `main`.

Never commit directly to `main` or `develop`.

**Linting rules:**

Always run `npm run lint` after finishing a task and before pushing to ensure there are no errors/warnings.
