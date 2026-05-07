# Deployment

## API on Render

Create a Web Service from `apps/api`.

Set environment variables:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI`
- `JWT_SECRET`

Start command:

```bash
npm start
```

## Web on Vercel

Create a Vercel project from `apps/web`.

Set:

- `VITE_API_URL=https://your-api.example.com/api`

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```
