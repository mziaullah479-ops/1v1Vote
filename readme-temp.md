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

The app runs as one Express/Vite service and listens on the hosting provider's `PORT`. Set `NODE_ENV=production`, `ADMIN_PASSWORD`, and any provider-specific secrets. The current demo data store uses browser storage; a shared production vote database should be added before launch at scale.

For container-based hosting, build with `docker build -t 1v1vote .` and run with `docker run --rm -p 3000:3000 -e NODE_ENV=production -e ADMIN_PASSWORD='use-a-private-value' 1v1vote`.
