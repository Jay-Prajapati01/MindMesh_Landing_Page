# Mindmesh

Mindmesh is a React and TanStack Start website with server-side rendering. It runs on Node.js, uses Express to serve the production server build, and uses Supabase for its configured backend integrations.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install and run locally

```sh
npm install
npm run dev
```

The development server is available at `http://localhost:3000`.

## Build and start with Express

```sh
npm run build
npm start
```

The Express server listens on `PORT` (default `3000`) and `HOST` (default `0.0.0.0`). The build creates the server middleware consumed by `express-server.mjs`.

For static hosting providers that expect a `dist/client` publish directory, the build also mirrors the generated Nitro public assets into `dist/client` via the included `netlify.toml` and build script compatibility step.

## Supabase configuration

Set the Supabase values required by the integrations in your environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side admin operations only)

Keep service-role and other private keys on the server. Do not expose them through `VITE_` variables.

## Technology

- Node.js and Express
- React and TanStack Start
- TypeScript and Tailwind CSS
- Supabase
