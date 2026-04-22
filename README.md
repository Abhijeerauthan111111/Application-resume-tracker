# Application Tracker (Phase 1)

## What you get in Phase 1
- Firebase Google sign-in (client) + backend Firebase ID token verification
- Multi-tenant data isolation (`userId` scoped queries)
- CRUD (MVP): Applications + Companies (auto-create by company name), Interview rounds, Tasks
- UI: Kanban + Table views, Application details, Tasks page

## Phase 2 add-ons in this repo
- Documents (resume versions): upload to Cloudinary or save external links
- Attach documents to applications
- Read-only sharing: generate a secret link per application (token-based)
- Analytics summary (counts by status)

## Prereqs
- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project (Web app + service account)

## Setup
1) Backend
- `cd application-tracker/server`
- `Copy-Item .env.example .env`
- Fill:
  - `MONGODB_URI`
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  - `CORS_ORIGIN` (default `http://localhost:5173`)
  - Phase 2:
    - `SHARE_TOKEN_PEPPER` (any long random string)
    - For uploads: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
    - `APP_BASE_URL` (where the frontend runs; used to build share links)
- Install + run:
  - `npm install`
  - `npm run dev`

2) Frontend
- `cd application-tracker/client`
- `Copy-Item .env.example .env`
- Fill Firebase client vars:
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- Install + run:
  - `npm install`
  - `npm run dev`

## Firebase checklist (required for sign-in)
In Firebase Console:
- Authentication -> Sign-in method: enable **Google** provider
- Authentication -> Settings -> Authorized domains: ensure `localhost` is listed for local dev
- Project settings -> General: create/register a **Web app** to get the client config values
- Project settings -> Service accounts: generate **Admin SDK** private key JSON for backend verification

Note: after editing `client/.env`, restart the Vite dev server.

## Local URLs
- Client: `http://localhost:5173`
- Server: `http://localhost:4000`
