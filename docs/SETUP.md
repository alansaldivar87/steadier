# Connect the household

## Current local workspace

The two Gmail addresses provided by the household are set in the ignored `.env.local` as `ALLOWED_EMAILS`. A session secret has been generated. No organization service keys were copied from CGC. The local workspace works without cloud accounts; phone sharing requires deployment and Google OAuth.

Run `npm run doctor` to see the remaining connections. Put keys in `.env.local` locally and Vercel Environment Variables remotely. Do not commit either file or secret values.

## 1. Personal Google sign-in

Create a Google Cloud project for Steadier under your personal Google account. Configure an OAuth consent screen and a Web application OAuth client. Request only the normal sign-in scopes (`openid email profile`); the app does not request Gmail or Drive access. If the consent app is in testing, add both household Gmail addresses as test users.

Use exact authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
http://127.0.0.1:3000/api/auth/callback/google
https://YOUR-VERCEL-DOMAIN/api/auth/callback/google
```

Set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL` and `ALLOWED_EMAILS`. Production `AUTH_URL` must be the final HTTPS domain. Keep a stable secret across deployments. The sign-in callback requires Google's verified email and an exact allowlist match; every application API rechecks membership.

To exercise Google login locally, set `LOCAL_ACCESS=false`, set `AUTH_URL` to the exact local origin, restart Next.js, and use each approved account. Verify a third account is refused. [Auth.js Google provider documentation](https://authjs.dev/getting-started/providers/google).

## 2. Remote database

For Vercel, create a **libSQL-compatible** remote database. Turso offers different database engines; this implementation uses `@libsql/client`, so use a libSQL database URL, not a newer engine URL without a compatible adapter.

Set:

```text
DATABASE_URL=libsql://YOUR-DATABASE-HOST
DATABASE_AUTH_TOKEN=YOUR-TOKEN
```

The repository creates its initial schema on first use. Remote requests use libSQL's HTTP protocol. Vercel refuses local database paths. For self-hosting with persistent disk, `file:.data/steadier.db` is supported. [Turso TypeScript quickstart](https://docs.turso.tech/sdk/ts/quickstart).

## 3. Document storage

The easiest Vercel configuration is a **private** Blob store connected to this project:

```text
STORAGE_DRIVER=vercel-blob
BLOB_READ_WRITE_TOKEN=YOUR-PRIVATE-STORE-TOKEN
```

Alternatively choose `STORAGE_DRIVER=s3` and fill the S3 environment variables in `.env.example`. Use a bucket owned by the household with no public read policy. Downloading originals goes through a household-authenticated route. On a Node server with persistent disk, `STORAGE_DRIVER=local` is supported. [Vercel Blob SDK documentation](https://vercel.com/docs/vercel-blob/using-blob-sdk).

## 4. Personal AI provider

Use a personal API key with a provider-level spending cap. CGC uses OpenRouter; this app supports the same endpoint family without depending on CGC's backend.

```text
# OpenRouter example (choose a current model in your own account)
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=YOUR-PERSONAL-KEY
AI_MODEL=YOUR-CHOSEN-MODEL-ID
AI_JSON_MODE=true
AI_DAILY_CALL_LIMIT=40
AI_MAX_OUTPUT_TOKENS=4000
```

For OpenAI, set `AI_BASE_URL=https://api.openai.com/v1` and a compatible model. Other OpenAI-compatible gateways can be used. This adapter uses Chat Completions with JSON output validated by Zod. Some models require different token settings or lack JSON/PDF support; those need a small adapter extension, not a finance-engine rewrite. No fallback chain silently sends financial documents to another provider.

Choose text + image support for receipt photos and native PDF input support for scanned PDFs. Searchable PDFs are extracted locally first. OpenRouter can handle native PDF/file inputs as documented [here](https://openrouter.ai/docs/guides/overview/multimodal/pdfs). Unsupported files remain saved with a retry/error state. Files over 4 MB and very long documents must be split. The call cap persists across server restarts; it is not a precise dollar budget.

## 5. Vercel

1. Import the private personal GitHub repository into a personal Vercel project. Framework: Next.js; root: repository root; install: `npm ci`; build: `npm run build`.
2. Set the production environment variables from steps 1–4. Set `LOCAL_ACCESS=false`. Leave `HOUSEHOLD_ID` stable (default `our-household`). Changing it selects a different empty household.
3. Deploy, add the resulting stable domain to Google OAuth redirect URIs, and set production `AUTH_URL` to that exact origin. Redeploy if needed.
4. Sign in with each household account. Confirm both see the same records. Confirm an unapproved account cannot sign in or download a document.
5. On a phone, open the HTTPS URL and use Add to Home Screen. Camera capture, image resizing, and regular upload are available. Offline financial writes are not supported; keep the page open until saving finishes.

The included `vercel.json` contains no credentials. [Vercel deploy documentation](https://vercel.com/docs/cli/deploy).

## Moving local records to the cloud

Do not just change `DATABASE_URL` and expect local records to appear remotely. Take a database backup and copy the document objects first. See `OPERATIONS.md`. A blank new remote database starts empty. Keep the local database until the migration and uploaded originals are verified.
