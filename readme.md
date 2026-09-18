# 1v1Vote

Source-backed public-figure profiles with transparent daily voting and live rankings.

## Run Locally

**Prerequisites:** Node.js 20+


1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `ADMIN_PASSWORD` to a strong private password.
4. Run the app: `npm run dev`

## Admin access

The admin panel is not linked from the public navigation. Open `/admin` directly and sign in with the server-side `ADMIN_PASSWORD`. The password is never sent to the browser or committed to the repository.

## Deployment

The app runs as one Express/Vite service and listens on the hosting provider's `PORT`. Set `NODE_ENV=production`, `ADMIN_PASSWORD`, `DATA_DIR`, and `BACKUP_DIR`. For a host without persistent disks, also set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; Turso stores the complete application state in one SQLite-compatible row and is authoritative in production, while the JSON file is used for local fallback development.

The JSON store is intended for one Node instance. Turso keeps state across deploys and restarts, but this service still assumes a single application instance because it keeps an in-memory snapshot. Run `npm run backup` from a host scheduler for an additional backup cycle, and copy the backup directory to separate object storage for disaster recovery.

GitHub Pages remains a static preview only. It does not run the account, voting, admin, or backup API.

## Organic content drafts

The scheduled `organic-content.yml` workflow reads `/feed.xml` and creates a reviewable `organic-drafts.md` artifact with UTM-tagged profile links. It intentionally does not auto-publish, buy backlinks, generate visits, or send spam. Review each draft before sharing through a relevant platform.

For container-based hosting, build with `docker build -t 1v1vote .` and run with `docker run --rm -p 3000:3000 -e NODE_ENV=production -e ADMIN_PASSWORD='use-a-private-value' 1v1vote`.
