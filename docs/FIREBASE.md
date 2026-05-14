# Firebase Hosting

This repository is configured for Firebase Hosting with `apps/web/public` as the hosted static directory.

## Before Deploying

The browser app calls an API. For production hosting, deploy the API separately, then set:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://your-api.example.com"
};
```

in `apps/web/public/config.js`.

For local development, leave `API_BASE_URL` empty so the app uses the same origin.

## Deploy

```bash
firebase login
firebase use --add
firebase deploy --only hosting
```
