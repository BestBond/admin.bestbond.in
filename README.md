# admin.bestbond.in

BestBond admin dashboard (React 19 + Vite 8 + TypeScript).

## Local development

```bash
cp .env.example .env.local   # first time
npm ci
npm run dev
```

Open http://localhost:5173 — API default: `http://localhost:3000` (see `.env.local`).

## Production build

```bash
cp .env.production.example .env.production
npm ci
npm run build
```

Static output: `dist/` — nginx `root` should point here.

## Deploy

See [deploy/README.md](deploy/README.md) and root `./deploy.sh`.

```bash
chmod +x deploy.sh deploy/restart.sh
./deploy.sh
```

## Environment files

| File | Purpose |
|------|---------|
| `.env.example` | Template for local setup |
| `.env.local` | Local dev (gitignored) — loaded by `npm run dev` |
| `.env.production.example` | Committed production template |
| `.env.production` | Production build values (gitignored on server) |
