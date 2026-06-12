# DocoDego Survey

## Prerequisites

- Node.js
- pnpm
- Cloudflare account (`wrangler login`)

## Install

```
pnpm install
```

## Init DB (first time only)

```
cd api && pnpm db:migrate
```

## Run

Both services together:

```
pnpm dev
```

- Web → http://localhost:5173
- API → http://localhost:8787

Separately:

```
cd web && pnpm dev   # frontend only
cd api  && pnpm dev  # worker only (wrangler)
```
