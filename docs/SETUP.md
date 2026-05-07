# Setup

## Requirements

- Node.js 20+
- npm 10+
- Docker Desktop, optional for containerized runs

## Local Development

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5000` by default and serves the existing meet desk UI from `apps/web/public`.

## Environment

Copy `.env.example` to `.env` at the repo root or copy the app-specific examples:

```bash
cp .env.example .env
```

Set production secrets in the hosting provider, not in Git.
