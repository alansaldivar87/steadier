# Operations and recovery

## Starting and checking

Use Node 22+ and the committed npm lockfile. `npm run doctor` prints configuration readiness without revealing keys. `npm run typecheck`, `npm test`, and `npm run build` are the release checks; The GitHub Actions template in `ci/github-actions.yml` can run them on pushes and pull requests once enabled. The current GitHub OAuth authorization lacks workflow scope, so it was saved as a template instead of an active workflow. Application money is stored server-side, not in the browser.

## Document states

`uploaded -> processing -> review -> done`, with an `error` state that retains the original file. A processing lease expires after two minutes; **Read document** can reclaim an interrupted job. Extracted drafts and the final document transition commit in one database transaction. Reprocessing a successfully staged document returns its prior state without adding rows. Hash-based identity catches the same bytes under a renamed filename. A simultaneous duplicate upload can leave an unreferenced file object; remove orphan objects only after comparing storage keys with document records and taking a backup.

PDF or provider errors are shown in the document shelf. Use smaller documents or a provider with the necessary image/PDF capability. Files are limited to 4 MB; CSVs to 500 rows; extraction to 250 proposed items; long text over the extraction limit is rejected instead of silently clipped. Review extraction for completeness against the original and statement totals. If the model omits a row, enter it manually and reconcile the closing balance.

## Shared edits

Each record has a revision. If the other spouse changes it, a stale save fails with a refresh message. Reload the item, reapply the intended edit, and save. Every app write/deletion leaves an audit entry. Calendar-linked transactions must be reopened from payment history before editing/deleting them. Reopening retains the ledger transaction; link it again after correction instead of creating a duplicate.

## Backups

Use **Household -> Export our records** for a portable JSON snapshot. This includes source text and metadata but not original binary files. Download originals from Documents or back up the configured object bucket separately. For a local full recovery backup, stop the server and copy the `.data/steadier.db` file and `.data/uploads/` directory together. Keep the current application revision/lockfile with the backup. Do not copy only a running SQLite main file while ignoring its WAL; stop writes first or use a database-native backup.

On remote deployments, enable the database provider's backups and keep object storage backups. Restore to a new environment first and verify account closing balances, record counts, accepted draft links, and original document downloads before switching the household app.

## Local-to-cloud migration

For this libSQL schema, migrate all four tables (`records`, `audit`, `ai_usage`, `unique_keys`) using a database export/import supported by the chosen provider. Preserve IDs, household ID, revisions and unique keys. Move each original upload to the configured remote store using its existing `storageKey`. Vercel Blob's returned pathname must be reflected in the document metadata if it differs. Test against a separate destination and retain the local source. The app does not yet have a one-click migration/restore UI; the JSON export is an additional recovery artifact, not a complete binary backup.

## AI spend and availability

Each call reserves a durable daily slot before network activity; success/failure and returned token counts are recorded. A request killed by the runtime can remain `reserved`; it still counts toward the cap. Do not reset these rows automatically because the provider may have billed the request. Configure the provider's own monetary spending cap. Missing/unavailable AI never disables manual entries, calendar use, export or deterministic CSV import.

Provider keys are server-only environment settings. Changing the model/provider changes where future document contents and chat context are sent. Test a synthetic receipt, an ordinary text PDF, and a scanned PDF with the selected model before relying on live extraction. Model support differs; a failed extraction is preserved for retry.

## Auth and deployment

The preview on localhost is explicitly labeled local workspace. `LOCAL_ACCESS` never permits access in a production build or on Vercel. Google requires an OAuth client and the configured approved emails. `AUTH_URL` and Google callback URLs must match the deployed origin. A new Gmail address is not admitted until the exact server allowlist is updated. The app requests sign-in identity only, not mailbox access.

Files and AI are separate adapters; changing a database URL does not migrate file storage. On a self-hosted container, persist `/app/.data` and supply configuration as runtime environment variables. Never put real `.env.local` in the image; `.dockerignore` excludes it.

## Human routine

Daily: record money spent/received. Weekly: review drafts, reconcile statements, check the next payday, and update the calendar. Monthly: refresh debt statement balances and category targets. No recurring notifications or bank sync are activated in this version. The household can ask the coach for a weekly review whenever needed.
