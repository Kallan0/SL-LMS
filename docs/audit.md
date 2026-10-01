# End-to-end audit: frontend, core, ML

Audited 2026-10-01. This is a source and local-runtime audit. The user supplied these deployed origins: frontend `https://sl-lms-ten.vercel.app`, core `https://sl-lms-backend.onrender.com`, and ML `https://sl-lms-ml.onrender.com`. The user's cloud environment settings are considered valid, but this workspace could not connect to the public hosts or remote database; production authentication remains unverified. Existing uncommitted frontend and README work was left in place.

## Authentication path

1. `frontend/client/src/pages/Login.tsx` calls the auth context.
2. `frontend/client/src/hooks/useAuth.ts` calls the production API service when `VITE_USE_MOCK` is not `true`.
3. `frontend/client/src/services/api.ts` sends `POST {VITE_API_BASE_URL}/auth/login` to the Express core. The core returns a JWT and user; the frontend stores the JWT and later calls `/users/me`.
4. The core checks the request Origin through CORS, signs/verifies JWTs with `JWT_SECRET_KEY`, and reads users from PostgreSQL through Prisma.
5. The ML service is separate from login. Assessment and webcam calls use `VITE_ML_BASE_URL`.

## Findings and changes

| Priority | Finding | Evidence and effect | Change |
| --- | --- | --- | --- |
| Critical if omitted in a build | Frontend API URL missing from local `frontend/.env` | Only `VITE_USE_MOCK=false` is present locally. `api.ts` otherwise uses `http://127.0.0.1:5000`, which points to a visitor's own computer in production. The user says cloud environment values are valid, so this local finding does not prove the deployed build has the problem. | Added `frontend/.env.example` and build-time verification steps in `instructions.md`. |
| High | Missing service URLs could produce a broken frontend bundle | Vite formerly built the real API mode with localhost fallbacks when the build environment omitted service URLs. | Production builds now fail with a specific message unless both public core and ML origins are configured. Development still supports local defaults. |
| High | Core ignored `ALLOWED_ORIGINS` | `core/.env` has an origin list, while code previously allowed one hardcoded Vercel URL and `FRONTEND_URL` only. A different Vercel/custom domain would fail browser preflight. | Core now parses both configured variables as comma-separated exact origins, with localhost/127.0.0.1 allowed for development. The existing Vercel origin remains allowed for compatibility. |
| High | Registration did not establish a session | Core `/auth/register` returns account fields but no JWT. The registration page redirected to protected `/dashboard`, which returned to login. | The auth hook now logs in immediately after registration and sets session state before redirect. |
| High | Mentor registrations became students | The page sends `MENTOR`; core and mock API compared only with lowercase `mentor`. | Both now accept either case. Existing misclassified accounts need a manual database correction after verification. |
| Medium | Bad login returned a generic redirect error | The API interceptor redirected on every 401, including `/auth/login`, and did not read the Express `{error}` body. | Login 401 now stays on the form and displays the server error; protected-route 401 still clears the session. |
| Medium | Expired tokens stayed active in the browser | Core returned 403 for invalid/expired JWTs, while the frontend session interceptor handled 401. | Core now returns 401 for invalid/expired JWTs; mentor authorization still returns 403. Updated integration expectations. |
| Low | Token storage key differed across callers when configured empty/custom | Auth code used different fallback operators, and Assessment used a literal key. | Standardized the key fallback in the API and mock clients and made Assessment read the configured key. |
| Medium | Core process health did not test the database | `/health` always returned 200 even if the `User` table or database connection was unavailable. | Added read-only `/health/ready`, which returns 200 only if Prisma can count users, otherwise 503. Added a 10-second database connection timeout and login error logging. |
| Medium | Insecure fallback JWT secret | Core silently used `secret` when `JWT_SECRET_KEY` was absent. | Core now fails startup until a real secret is configured. |
| Medium | Deep link refresh on Vercel | No usable Vercel rewrite existed under the frontend root. | Added `frontend/vercel.json` to serve `index.html` for client routes. |
| Medium | ML origin setting was ineffective | FastAPI used wildcard origins despite `ALLOWED_ORIGINS`; the supplied helper was unused. | ML now uses configured origins plus local development origins. It does not use cookies, so credentialed CORS is disabled. |
| Medium | ML container fixed port 8001 | A host supplied `PORT` would not be honored by the Docker CMD. | Docker CMD now uses `${PORT:-8001}`. |
| Medium | ML pipeline endpoint tests sent obsolete payloads | `test_pipeline.py` sent 126 landmarks or `features`, but `schemas.py` requires 10,000 `pixels`. | Corrected both endpoint test payloads. |
| High, unresolved | Model and CSV are not in Git | `git ls-files ml/models ml/data` lists only README files. A deployment built solely from Git will lack the model and training CSV; `/health` may say `model_loaded: false`. | `instructions.md` explains how to provide the model artifact and verify it. |
| High, policy decision | Public mentor self-registration | `/auth/register` accepts `MENTOR` from any caller, and mentor routes use that role for lesson edits and student access. | Left the existing product flow intact; decide whether mentors should be approved or invited before exposing this publicly. |
| Medium, unresolved | Database deployment is not versioned | `core/prisma/migrations` is absent. Registration/login depend on the `User` table. | Instructions require a database backup and controlled schema setup before auth smoke tests. |
| Low, unresolved | Existing docs and tests contain stale contracts | README suggests demo credentials and `VITE_API_URL`; the actual code uses `VITE_API_BASE_URL`. Frontend integration tests assume a running DB-backed core and may create users. | Current deployment procedure is documented in `instructions.md`; older docs/tests should be updated separately when an isolated test DB is available. |

## Checks run

| Area | Check | Result |
| --- | --- | --- |
| Frontend | `npm.cmd run check` | Passed after changes. |
| Frontend | `npx.cmd vite build --configLoader runner` | Passed; Vite reported a bundle-size warning. Plain `npm.cmd run build` could not load the config in this restricted Windows workspace (`Access is denied` while esbuild traversed above the workspace). This is a local sandbox issue, not proof of a Vercel build failure. |
| Frontend | Production build with supplied service URLs | Passed; generated JavaScript contains the supplied core and ML hosts. Build without URLs fails early with `VITE_API_BASE_URL must be set...`, as intended. |
| Core | `npm.cmd run build` | Passed after auth/CORS changes. Prisma emitted only a deprecated preview-feature warning. |
| Core | Local HTTP smoke (`/health`, allowed and denied CORS preflight, empty login) | Health 200, allowed preflight 204 with matching origin, unlisted origin rejected, missing login fields 400. No database writes. |
| Core | Local HTTP smoke after second auth change | `/health` 200; unauthenticated and invalid-token `/users/me` both 401; `/health/ready` 503 with Prisma `EACCES` because this workspace cannot access the remote database. This does not establish the cloud database's status. |
| Frontend | `npx.cmd vitest run --config auth-vitest.config.mjs` | Passed 3 isolated auth client unit tests. The restricted workspace blocked Vitest's config loader; the run succeeded outside that filesystem restriction. No database writes. |
| ML | Python 3.11 `py_compile` of `main.py`, `schemas.py`, `test_pipeline.py` | Passed. Full pipeline was unavailable because this local Python has no FastAPI, NumPy, scikit-learn, or model runtime packages installed. |
| Cross-service | Live HTTPS requests to all three supplied origins | Web fetch could not open them; PowerShell could not connect; a separately attempted core health request timed out. The browser surface was unavailable. No live HTTP status was observed. |
| Cross-service | `scripts/auth-smoke.mjs` | Added a read-only deployment smoke script for frontend, core, CORS, login failure, optional existing-account login, and ML readiness. It could not complete from this network-restricted workspace. |
| Cross-service | Full registration -> login -> profile -> ML prediction against deployed services | Pending reachable deployment and an isolated test database. Existing E2E scripts write records to the configured database, so they were not run against the unknown live database. |

## Remaining verification

Follow `instructions.md` in order. In particular, confirm the deployed frontend bundle uses the supplied core URL, core's allowed frontend origin, `/health/ready`, and the ML `/health` model flag. A successful core `/health` only proves the HTTP process is alive; it does not prove database connectivity or authentication.
