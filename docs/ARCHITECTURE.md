# Architecture

The project is now arranged as a monorepo with separate application and package boundaries.

## Apps

`apps/api` owns API routes, persistence, scoring, imports, and report data.

`apps/web` owns operator screens, scoreboard screens, CSV client parsing, and the future React/Vite UI.

## Packages

`packages/ui` is reserved for shared UI primitives once screens move fully into React.

`packages/utils` is reserved for pure helpers shared by the web and API.

## Data Flow

1. Operators create athletes, events, registrations, and results in the web app.
2. The web app calls `/api/*`.
3. The API persists meet state and returns ranked results, leaderboards, dashboards, and reports.
4. Scoreboard and report pages consume the same API data for live meet operations.

## Production Direction

The current API preserves the working JSON-file product so the app remains runnable. The next hardening step is to move logic from `server.js` into route, controller, and service modules, then swap the JSON store for MongoDB models behind the same service contracts.
