# Environment Map

## Overview
Environment variables are managed dynamically via `.env` files and the PowerShell execution script.

## Active Variables (`backoffice/backend/src/`)

| Variable | Used By | Required | Optional | Default Value |
| :--- | :--- | :---: | :---: | :--- |
| `PORT` | `index.ts` | Yes | - | `3099` |
| `NODE_ENV` | `index.ts`, `auth.ts`, `logging.ts` | Yes | - | `'development'` |
| `CORS_ORIGIN` | `index.ts` | - | Yes | `'*'` |
| `DATABASE_PATH` | `db/database.ts` | - | Yes | `'../../data/nashtypos.db'` |
| `JWT_SECRET` | Auth Middlewares, Supabase Client | - | Yes | `'nashty-super-secret-key-2026'` / `'ZaidunkMargin'` |
| `JWT_EXPIRES_IN` | Supabase Client | - | Yes | `'24h'` |
| `SUPABASE_URL` | Supabase Client | - | Yes | `'https://dummy.supabase.co'` |
| `SUPABASE_ANON_KEY` | Supabase Client | - | Yes | `'dummy-key'` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Client | - | Yes | `'dummy-key'` |
| `SUPABASE_DB_HOST` | Supabase Client | - | Yes | `'db.mzucfndifneytbesirkx.supabase.co'` |
| `SUPABASE_DB_PORT` | Supabase Client | - | Yes | `5432` |
| `SUPABASE_DB_NAME` | Supabase Client | - | Yes | `'postgres'` |
| `SUPABASE_DB_USER` | Supabase Client | - | Yes | `'postgres'` |
| `SUPABASE_DB_PASSWORD` | Supabase Client | - | Yes | `'ZaidunkMarginpublishable'` |
| `SUPABASE_DB_SSL` | Supabase Client | - | Yes | `false` |

## Isolated Variables (`cost/.env`)
The Cost application contains its own `.env` file, primarily utilizing Vite prefixes (`VITE_`). However, these variables are consumed during the build phase, not during the local backend runtime script (`start-local.ps1`).
