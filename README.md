# Bluff House Social

Poker-room session tracker — games, players, buy-ins/rebuys/cashouts, and monthly stats.
React + Vite front end with a shared, passcode-gated backend on Netlify.

**Live:** https://bluff-house-social.netlify.app

## Architecture

- **Front end** — single React app (`src/App.jsx`), built with Vite.
- **Shared state** — the whole app state (`{ games, players }`) is stored as one JSON
  document in **Netlify Blobs**, served by a serverless function at `/api/state`
  (`netlify/functions/state.js`).
- **Access** — gated by a single shared passcode (env var `ROOM_PASSCODE`). The
  function rejects any request without the matching `x-room-pass` header.
- **Sync** — clients debounce saves (~700ms) and poll every 4s for other devices'
  changes. Last-write-wins on the single document.

## Develop

```bash
npm install
npm run dev      # Vite dev server; /api is proxied to the live Netlify function
```

> Note: `npm run dev` proxies `/api` to the **production** site, so local edits
> write to the real shared data. Adjust the proxy target in `vite.config.js` to
> isolate.

## Deploy

```bash
npx netlify deploy --prod --build
```

`--build` runs the Vite build and bundles the function.

## Change the passcode

```bash
npx netlify env:set ROOM_PASSCODE <new-code>
npx netlify deploy --prod --build
```
