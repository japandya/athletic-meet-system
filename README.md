# Athletic Meet System

Production-oriented monorepo for managing athletics meets: athlete import, event setup, entries, scoring, dashboards, reports, and scoreboard displays.

## Structure

```text
apps/api      Node API service and meet data store
apps/web      Web client and static meet desk screens
packages/ui   Shared UI package placeholder
packages/utils Shared utility package placeholder
docs          Product, setup, API, and architecture docs
```

## Start Locally

```bash
npm install
npm run dev
```

The API serves the current meet desk at `http://localhost:5000` and API routes under `/api`.

## Current Product Baseline

- Meet setup
- Athlete, event, entry, and result management
- CSV import from the browser
- Dashboard, reports, export rows, and scoreboard screens
- Monorepo package structure ready for a React/Vite migration

## Next Production Milestones

1. Move API routes from the current single server into `src/controllers`, `src/services`, and `src/routes`.
2. Replace the JSON file store with MongoDB models where persistence needs multi-user safety.
3. Convert the static web UI into React screens inside `apps/web/src`.
4. Add authentication, role permissions, and server-side CSV upload validation.
5. Deploy API to Render and web to Vercel.
