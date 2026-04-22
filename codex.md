# Job Application Tracker (MERN) - `codex.md`

## 1) Project Overview
- **Problem**: Job seekers track applications across spreadsheets/chats/notes, miss follow-ups, and lack visibility into progress.
- **Solution**: A multi-tenant web app that lets users **track applications**, **manage resume versions**, **automate reminders**, and **share selected applications read-only** via secure expiring links.
- **Primary users**: Students, job seekers, career switchers.
- **Core value**: Centralized pipeline + tasks + documents + analytics, with minimal friction via Google sign-in.

## 2) Tech Stack (with Justification)
- **Frontend**: React (SPA)
  - Fast iteration, component-driven UI, great ecosystem for tables, Kanban drag/drop, and form state.
- **Backend**: Node.js + Express (REST API)
  - Simple, proven REST + middleware, easy integration with Firebase Admin, SendGrid, Cloudinary.
- **Database**: MongoDB + Mongoose
  - Flexible schema for applications (nested interview rounds), tasks, and document metadata; good indexing options for search and multi-tenant isolation.
- **Auth**: Firebase Authentication (Google Sign-In) + Firebase Admin verification on backend
  - Production-ready OAuth implementation; backend trusts only verified Firebase ID tokens.
- **File storage**: Cloudinary (free tier)
  - Handles uploads + hosted file URLs; store metadata in MongoDB.
- **Email**: SendGrid
  - Transactional email for reminders and daily digests.

## 3) Architecture
### Frontend
- React SPA with:
  - Auth integration via Firebase client SDK.
  - API calls to Express using `Authorization: Bearer <firebaseIdToken>`.
  - Views: Kanban, Table, Application detail, Tasks, Documents, Settings, Shared view (public).

### Backend
- Express REST API with layered structure:
  - Routes -> Controllers -> Services -> Models
  - Middleware for Firebase token verification and request validation.
  - Background jobs for reminder emails + daily digests.

### Database
- MongoDB collections:
  - `users`, `companies`, `applications`, `tasks`, `documents`, `shares`
- Multi-tenant isolation via `userId` on all private records, enforced in queries and indexes.

### Auth Flow (high-level)
1. Frontend: user signs in with Google via Firebase Auth.
2. Frontend: obtains Firebase ID token.
3. Frontend -> Backend: sends requests with `Authorization: Bearer <idToken>`.
4. Backend: verifies token using Firebase Admin SDK; upserts user record; scopes access using `req.user`.

## 4) Data Models
### User
- Fields
  - `firebaseUid` (string, unique, required)
  - `email` (string, required)
  - `name` (string)
  - `photoURL` (string)
  - `createdAt`, `updatedAt`
  - `settings` (object)
    - `timezone` (string, default: user/browser)
    - `emailRemindersEnabled` (bool, default: true)
    - `dailyDigestEnabled` (bool, default: true)
    - `dailyDigestTime` (string, default: `"09:00"`)
    - `followUpDefaultDays` (number, default: 4) // used to auto-create follow-up tasks
- Indexes
  - unique: `firebaseUid`
  - unique: `email`

### Company
- Fields
  - `userId` (ObjectId, required) // owner
  - `name` (string, required)
  - `website` (string)
  - `hqLocation` (string)
  - `notes` (string)
  - `createdAt`, `updatedAt`
- Constraints / Indexes
  - unique per user: `{ userId, name }`

### Document (Resume Versioning)
- Purpose: stores resume/cover letter/portfolio references (upload or external link), reusable across applications.
- Fields
  - `userId` (ObjectId, required)
  - `type` (enum: `resume | cover_letter | portfolio`)
  - `name` (string, required) // e.g., "Resume - Backend v3"
  - `roleFocus` (string) // e.g., "frontend", "backend"
  - `tags` (string[])
  - `notes` (string)
  - `source` (enum: `cloudinary | external`)
  - `file` (object, optional when `source=external`)
    - `cloudinaryPublicId` (string)
    - `resourceType` (string) // "raw" or "image" etc.
    - `format` (string) // "pdf", "docx"
    - `bytes` (number)
    - `originalFilename` (string)
    - `secureUrl` (string)
  - `externalUrl` (string, optional when `source=cloudinary`)
  - `createdAt`, `updatedAt`
- Indexes
  - `{ userId, type, createdAt }`

### Application
- Fields
  - `userId` (ObjectId, required)
  - `companyId` (ObjectId ref Company, required)
  - `role` (string, required)
  - `status` (enum, required)
  - `appliedDate` (date, required)
  - Optional
    - `jobLink` (string)
    - `location` (string)
    - `salaryRange` (string)
    - `source` (string) // e.g., LinkedIn, Referral, Careers page
    - `notes` (string)
  - Documents (reusable references)
    - `documentIds` (ObjectId[] ref Document) // resumes/cover letters/portfolio used for this application
  - Interview rounds (embedded array)
    - `interviewRounds` (array of InterviewRound subdocs)
  - `createdAt`, `updatedAt`
- Indexes
  - `{ userId, status }`
  - `{ userId, appliedDate }`
  - text index (optional): `role`, `notes` (and optionally company name via denormalized field if needed)

### InterviewRound (subdocument inside Application)
- Fields
  - `roundType` (enum: `HR | Technical | Managerial | Final | Other`)
  - `scheduledAt` (date)
  - `status` (enum: `Scheduled | Completed | Cleared | Rejected`)
  - `notes` (string)

### Task (Reminder + automation)
- Purpose: follow-ups, interview prep, custom reminders.
- Fields
  - `userId` (ObjectId, required)
  - `applicationId` (ObjectId ref Application, required)
  - `type` (enum: `follow_up | interview_prep | custom`)
  - `title` (string, required)
  - `description` (string)
  - `dueAt` (date, required)
  - Reminder configuration
    - `remindAt` (date, optional) // when to trigger email/in-app reminder
    - `channels` (object)
      - `inApp` (bool, default: true)
      - `email` (bool, default: true)
  - State
    - `status` (enum: `open | done | dismissed`, default: `open`)
    - `completedAt` (date)
    - `dismissedAt` (date)
  - Email delivery tracking
    - `emailLastSentAt` (date)
    - `emailSendCount` (number, default: 0)
  - `createdAt`, `updatedAt`
- Indexes
  - `{ userId, status, dueAt }`
  - `{ userId, remindAt }`

### Share (Read-only Sharing)
- Purpose: public read-only access to a single application via secret token.
- Fields
  - `userId` (ObjectId, required) // owner of shared item
  - `applicationId` (ObjectId ref Application, required)
  - `tokenHash` (string, required, unique) // store hash, never store raw token
  - `expiresAt` (date, optional) // default: now + 30 days
  - `revokedAt` (date, optional)
  - `includeDocuments` (bool, default: false) // privacy control
  - `createdAt`, `updatedAt`
- Indexes
  - unique: `tokenHash`
  - `{ applicationId, revokedAt, expiresAt }`

## 5) Relationships Between Entities
- `User 1-N Company`
- `User 1-N Document`
- `User 1-N Application`
- `Company 1-N Application`
- `Application 1-N Task`
- `Application N-N Document` (via `application.documentIds`; same Document can be reused)
- `Application 1-N Share` (multiple tokens possible, if allowed; otherwise enforce one active share)

## 6) API Design (REST)
### Conventions
- Base: `/api`
- Protected routes require Firebase ID token.
- All protected queries must include `userId` filter from auth middleware.
- Return consistent envelope:
  - `{ data, error }` (or standard HTTP errors with JSON body)

### Auth / User
- `GET /api/auth/me` - return current user profile + settings (create user if missing).
- `PATCH /api/users/settings` - update user settings (timezone, digest on/off, defaults).

### Companies
- `GET /api/companies` - list companies (per user).
- `POST /api/companies` - create company.
- `PATCH /api/companies/:id` - update company (must belong to user).
- `DELETE /api/companies/:id` - delete company (only if no applications, or soft-delete).

### Documents (resume versions)
- `GET /api/documents` - list documents (filter by type/tags).
- `POST /api/documents` - create document (external link) OR create after upload.
- `POST /api/documents/upload` - upload file to Cloudinary and create Document record.
- `PATCH /api/documents/:id` - update metadata (name, tags, roleFocus, notes).
- `DELETE /api/documents/:id` - delete document (and optionally Cloudinary asset).

### Applications
- `GET /api/applications` - list applications (filters: status, companyId, date ranges, search).
- `POST /api/applications` - create application (optionally create company inline).
- `GET /api/applications/:id` - application details (incl. rounds, tasks summary, documents).
- `PATCH /api/applications/:id` - update fields (role, link, etc.).
- `PATCH /api/applications/:id/status` - set status (used by Kanban drag/drop).
- `DELETE /api/applications/:id` - delete application (also cascade/cleanup tasks + shares).

### Interview Rounds
- `POST /api/applications/:id/rounds` - add round.
- `PATCH /api/applications/:id/rounds/:roundId` - update round.
- `DELETE /api/applications/:id/rounds/:roundId` - remove round.

### Tasks / Reminders
- `GET /api/tasks` - list tasks (filters: status, due range, applicationId).
- `POST /api/tasks` - create custom task/reminder.
- `PATCH /api/tasks/:id` - update task (title, dueAt, remindAt, channels).
- `PATCH /api/tasks/:id/complete` - mark done.
- `PATCH /api/tasks/:id/dismiss` - dismiss reminder.
- `DELETE /api/tasks/:id` - delete task.

### Sharing (token-based read-only)
- `POST /api/shares` - create share link for an application (default expiry 30 days; includeDocuments default false).
- `GET /api/shares` - list active shares for current user.
- `PATCH /api/shares/:id/revoke` - revoke a share.
- Public (no auth):
  - `GET /public/shares/:token` - read-only application view by token (respect expiry/revocation; hide documents unless enabled).

### Analytics (MVP-lite)
- `GET /api/analytics/summary` - counts by status, applications/week, response rate (basic).

## 7) Authentication Flow (Firebase + Backend Verification)
### Frontend
- Firebase client SDK:
  - Google popup/redirect sign-in.
  - Retrieve ID token: `getIdToken()`.
- Attach token to each API request:
  - `Authorization: Bearer <firebaseIdToken>`

### Backend
- Use Firebase Admin SDK to verify token:
  - Validate signature, issuer, audience, expiry.
  - Extract `uid`, `email`, `name`, `picture`.
- Upsert user:
  - Find by `firebaseUid`; create if missing.
- Set request context:
  - `req.user = { userId, firebaseUid, email }`
- Authorization rule:
  - Every write/read must enforce ownership by `userId`.

## 8) Core Features (MVP)
- Google sign-in via Firebase; multi-tenant user isolation.
- Application tracking:
  - Create/edit/delete applications; status lifecycle; notes; job link; location; source; salary range.
- Dual views:
  - **Kanban** with drag/drop status updates.
  - **Table** with sort/filter/search.
- Company management (created automatically when adding application; editable later).
- Interview rounds per application (add/edit status + notes).
- Tasks + reminders:
  - Follow-up tasks auto-created on “Applied” (based on user setting days).
  - Interview reminders 1 day before scheduled rounds.
  - In-app reminders view (due/overdue).
- Documents:
  - Resume versioning (upload or external link), tags/role focus, attach to applications.
- Read-only sharing:
  - Create expiring secret link per selected application; revoke anytime.
  - Privacy by default: documents hidden unless explicitly included.
- Basic analytics:
  - Counts by status; applications over time; simple response rate.

## 9) Advanced Features (Future Scope)
- Gmail parsing to suggest application creation (out of MVP).
- Calendar sync (Google Calendar) for interviews (out of MVP).
- Mentor commenting (requires auth for viewers; out of MVP).
- Web push notifications (out of MVP).
- AI suggestions (resume match, follow-up text) (out of MVP).

## 10) Reminder System (Logic + Delivery)
### Logic
- Follow-up automation:
  - When an application is created with status `Applied`, create a `follow_up` task at `appliedDate + followUpDefaultDays`.
- Interview automation:
  - For each interview round with `scheduledAt`, create/update an `interview_prep` task at `scheduledAt - 1 day` (or configurable later).
- Manual reminders:
  - Users can create custom tasks with `dueAt` and optional `remindAt`.

### Delivery
- **In-app**:
  - Dashboard badges for due/overdue tasks.
  - Tasks page with filters.
- **Email (SendGrid)**:
  - Transactional emails for tasks when `remindAt <= now` and task is `open` and `channels.email=true`.
  - Prevent spam: only send once per task per reminder window (use `emailLastSentAt` and `emailSendCount`).
- **Daily digest**:
  - Once per day per user (based on `settings.dailyDigestTime` and `settings.timezone`), email summary:
    - Tasks due in next 24–48h (configurable later)
    - Interviews scheduled soon
    - Overdue follow-ups

### Scheduling (production-safe)
- Implement a small job runner in backend (e.g., cron-based) OR use hosting provider scheduled jobs.
- Two jobs:
  - `reminder-dispatch` (runs every 1–5 minutes)
  - `daily-digest` (runs hourly; sends digests for users whose local time matches digest time)

## 11) File Handling (Cloudinary + Metadata)
- Upload flow:
  1. Frontend selects file (PDF/DOCX).
  2. Frontend calls backend upload endpoint.
  3. Backend uploads to Cloudinary using server credentials.
  4. Backend stores `Document` record with returned metadata + `secureUrl`.
- Constraints:
  - Validate MIME types and max file size (align with free-tier limits).
  - Store only metadata + URLs in MongoDB.
- Deletion:
  - When deleting a Document, optionally delete Cloudinary asset (ensure not referenced by other apps first, or allow orphan cleanup later).

## 12) Sharing System (Token-based, Expiry, Privacy Controls)
- Share creation:
  - Generate random token (32+ bytes), return **only once** to user as URL.
  - Store `tokenHash = sha256(token + pepper)` (pepper from env).
  - Default `expiresAt = now + 30 days`; user may override or set no expiry.
  - `includeDocuments=false` by default.
- Share access:
  - Public endpoint takes token, hashes, finds active share:
    - `revokedAt` must be null
    - `expiresAt` must be null or in future
  - Returns read-only application data; includes documents only if `includeDocuments=true`.
- Revocation:
  - Set `revokedAt`.

## 13) Application Statuses (Enum)
- `Saved`
- `Applied`
- `Interview`
- `Offer`
- `Accepted`
- `Rejected`
- `Withdrawn`

## 14) Interview Rounds Structure
- Stored in `application.interviewRounds[]`:
  - `roundType`: `HR | Technical | Managerial | Final | Other`
  - `scheduledAt`: date/time
  - `status`: `Scheduled | Completed | Cleared | Rejected`
  - `notes`: string

## 15) Resume Versioning System
- Model: `Document` acts as a “version” (each upload/link is a version).
- Features:
  - Create multiple resume versions with metadata (tags, role focus).
  - Attach one or more documents to an application.
  - Reuse the same document across many applications.
  - Document visibility in sharing is opt-in per share link.

## 16) UI/UX Structure (Kanban + Table)
### Core pages
- `/login` - Google sign-in.
- `/dashboard` - overview (counts, upcoming tasks, recent applications).
- `/applications` - toggle **Kanban/Table** view.
- `/applications/:id` - detail view:
  - company info, application fields, attached documents, interview rounds, tasks.
- `/documents` - manage resume versions.
- `/tasks` - all tasks/reminders.
- `/settings` - timezone, email toggles, defaults.
- `/share/:token` - public read-only application view.

### Kanban UX
- Columns = statuses.
- Drag card to change status; optimistic UI update with rollback on error.
- Quick actions: add task, add interview round, attach documents.

### Table UX
- Search + filters (status, company, date range).
- Sort by applied date / updated date.

## 17) Security Considerations
- **Auth enforcement**:
  - Verify Firebase ID token on every protected request.
  - Never trust frontend-provided `userId`.
- **Multi-tenant isolation**:
  - All queries must filter by `req.user.userId`.
  - Validate object ownership on `:id` resources (Company/Application/Task/Document/Share).
- **Input validation**:
  - Server-side schema validation (e.g., Zod/Joi).
  - Sanitize strings to reduce injection risks; limit payload sizes.
- **Rate limiting**:
  - Apply to auth/me and public share endpoints to reduce abuse.
- **Share token safety**:
  - Store only hash; use pepper; rotate pepper by invalidating all shares if needed.
  - Don’t expose documents in shares by default.
- **CORS/Headers**:
  - Restrict `CORS_ORIGIN` to frontend domain.
  - Set security headers (helmet).

## 18) Folder Structure (Clean MERN, MVC Backend)
### Repo
- `client/` - React app
- `server/` - Express API

### `server/` (suggested)
- `server/src/index.ts|js` - app entry
- `server/src/app.ts` - express app wiring
- `server/src/config/` - env, db, firebase admin, cloudinary, sendgrid
- `server/src/models/` - mongoose schemas
- `server/src/routes/` - route definitions
- `server/src/controllers/` - request handlers
- `server/src/services/` - business logic (sharing, reminders, uploads)
- `server/src/middleware/` - auth, validation, error handling
- `server/src/jobs/` - reminder dispatch, daily digest
- `server/src/utils/` - token hashing, date helpers

### `client/` (suggested)
- `client/src/api/` - API client (axios/fetch wrapper)
- `client/src/auth/` - firebase client init, auth hooks
- `client/src/features/` - applications, documents, tasks, sharing
- `client/src/components/` - shared UI components
- `client/src/pages/` - routes/pages
- `client/src/state/` - store (context/zustand/redux)

## 19) Environment Variables Required
### Backend (`server/.env`)
- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `CORS_ORIGIN`
- Firebase Admin
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (handle newlines safely)
- Cloudinary
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- SendGrid
  - `SENDGRID_API_KEY`
  - `EMAIL_FROM`
  - `EMAIL_REPLY_TO` (optional)
- Sharing
  - `SHARE_TOKEN_PEPPER`
- App
  - `APP_BASE_URL` (frontend base URL; used for share links)

### Frontend (`client/.env`)
- `VITE_API_BASE_URL`
- Firebase client
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

## 20) Deployment Plan
- **Frontend**: Vercel (or Netlify)
  - Configure `VITE_API_BASE_URL` to backend URL.
  - Ensure SPA routing handled (rewrite to index.html if needed).
- **Backend**: Render / Fly.io / Railway (any Node hosting)
  - Set env vars; configure CORS to frontend domain.
  - Run background jobs:
    - Use provider cron/scheduled jobs if available, or keep a small worker process.
- **Database**: MongoDB Atlas
  - Enable IP access / networking; create indexes (userId, status, dates, tokenHash).
- **Storage**: Cloudinary (free tier)
  - Secure upload via backend only (never expose API secret to client).
- **Email**: SendGrid
  - Verify sender domain/email; use templates later if desired.

## 21) Build Phases (3-phase plan)
### Phase 1 - Foundation + MVP Tracking
- Auth + user bootstrap: Firebase Google sign-in, backend token verification, `/api/auth/me`.
- Core CRUD: Companies, Applications (statuses), Interview rounds, Tasks (manual).
- UI: Kanban (drag/drop), Table (search/filter/sort), Application detail page.
- Multi-tenant enforcement: strict `userId` scoping on every private query + essential indexes.
- Deployment-ready skeleton: env var wiring, CORS, centralized errors, basic logging.

### Phase 2 - Resume Versioning + Sharing
- Documents: Cloudinary upload + external links + metadata; attach docs to applications.
- Sharing: token-based public read-only view with expiry + revocation + includeDocuments toggle.
- UX polish: quick actions (add task/round/attach doc), consistent loading/toasts, empty states.
- Analytics (MVP-lite): status counts + applications over time.

### Phase 3 - Reminder Automation + Production Hardening
- Automation: auto follow-up task on `Applied`; auto interview reminders from `scheduledAt`.
- Email: SendGrid reminders + daily digest (timezone-aware) with delivery tracking and anti-spam limits.
- Security hardening: validation, upload limits, rate limiting (especially public share), least-privilege queries.
- Reliability/ops: job idempotency + retries, health checks, and a simple deployment runbook.
