<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 1v1Vote

Live head-to-head creator voting battles with stock-style momentum charts.

The project originated in Google AI Studio and is now organized for deployment from GitHub.

## Run Locally

**Prerequisites:** Node.js 20+


1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `ADMIN_PASSWORD` to a strong private password.
4. Run the app: `npm run dev`

## Admin access

The admin panel is not linked from the public navigation. Open `/admin` directly and sign in with the server-side `ADMIN_PASSWORD`. The password is never sent to the browser or committed to the repository.

## Deployment

The app runs as one Express/Vite service and listens on the hosting provider's `PORT`. Set `NODE_ENV=production`, `ADMIN_PASSWORD`, `DATA_DIR`, and `BACKUP_DIR`. For a host without persistent disks, also set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; Turso stores the complete application state in one SQLite-compatible row while the JSON file remains a local mirror and backup source.

The JSON store is intended for one Node instance. Turso keeps state across deploys and restarts, but this service still assumes a single application instance because it keeps an in-memory snapshot. Run `npm run backup` from a host scheduler for an additional backup cycle, and copy the backup directory to separate object storage for disaster recovery.

GitHub Pages remains a static preview only. It does not run the account, voting, admin, or backup API.

For container-based hosting, build with `docker build -t 1v1vote .` and run with `docker run --rm -p 3000:3000 -e NODE_ENV=production -e ADMIN_PASSWORD='use-a-private-value' 1v1vote`.
