# Deployment and authentication repair guide

Follow these steps in order. They are written for a Vercel frontend, an Express core service, a FastAPI ML service, and PostgreSQL. Replace every `your-...` placeholder with your own public URL or database value. Keep database URLs and `JWT_SECRET_KEY` in hosting secret settings; never paste them into browser code or commit them.

Current supplied origins: frontend `https://sl-lms-ten.vercel.app`, core `https://sl-lms-backend.onrender.com`, ML `https://sl-lms-ml.onrender.com`. The cloud environment variables are reported as valid. Verify the actual deployed requests before changing a working cloud value.

## 1. Write down the three public URLs

From each hosting dashboard, copy:

- Frontend origin, such as `https://your-frontend.vercel.app`
- Core origin, such as `https://your-core-service.example.com`
- ML origin, such as `https://your-ml-service.example.com`

An **origin** is the scheme and hostname, with a port if needed. Leave off a trailing slash and path. All three public URLs should use HTTPS. The frontend sends auth requests to the **core**, not the ML service.

## 2. Configure and deploy core first

Set the core service's root directory to `core`. Use a Node runtime, `npm install` or `npm ci`, build command `npm run build`, and start command `npm run start`. The host should expose the port in its `PORT` variable. A local template is at `core/.env.example`.

Set these core environment variables in the host:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL used at runtime. |
| `DIRECT_URL` | Direct PostgreSQL URL used by Prisma schema commands; it may equal `DATABASE_URL` if your provider supports that. |
| `JWT_SECRET_KEY` | A long, random, persistent secret. Keep the same value across all core replicas and redeploys. |
| `ALLOWED_ORIGINS` | Exact frontend origin. Separate multiple origins with commas. |
| `PORT` | Usually supplied by the host. Local default is 5000. |

`FRONTEND_URL` also works for one origin. Set `ALLOWED_ORIGINS` for all actual frontend domains, including a custom domain if used. A Vercel preview domain needs its exact origin added for preview testing. Changing environment variables requires a core restart or redeploy.

Before opening registration to the public, decide who is allowed to create mentor accounts. The current registration API accepts a caller-supplied `MENTOR` role, and mentors can edit lessons and view student information.

Check `https://your-core-service.example.com/health` in a browser. Expect `{"status":"ok","service":"core-backend"}`. This endpoint does **not** check PostgreSQL.

After deploying the new core code, check `https://sl-lms-backend.onrender.com/health/ready`. Expect `{"status":"ok","service":"core-backend","database":"ready"}`. A 503 means the core process cannot query the `User` table; inspect core logs and database networking/schema. This check reads data only.

### Prepare the database

In the core host's console, verify that `DATABASE_URL` and `DIRECT_URL` point to the intended database. Back up an existing database before applying schema changes. There are no checked-in Prisma migrations in this repository. On a fresh or controlled database, run from `core`:

```powershell
npx.cmd prisma db push
```

On Linux hosting, use `npx prisma db push`. Review Prisma's proposed changes before accepting any destructive operation. Do not run `core/seed.mjs` or `core/seed2.mjs` on a database with data: they delete existing lesson and progress rows. The README's demo accounts are not automatically created by the core service.

## 3. Configure and deploy the frontend

Set the Vercel project **Root Directory** to `frontend`. Framework: Vite. Build command: `npm run build`. Output directory: `dist/public`. The SPA rewrite is in `frontend/vercel.json`. A local template is at `frontend/.env.example`.

Set these **Vercel build environment** variables for each environment being deployed:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Public HTTPS core origin, with no trailing slash or `/auth` suffix. |
| `VITE_ML_BASE_URL` | Public HTTPS ML origin, with no trailing slash. |
| `VITE_USE_MOCK` | `false` for real authentication. |

Vite puts `VITE_*` values into the JavaScript bundle at build time. **Redeploy the frontend after setting or changing them.** Setting them only on the core host, or changing them without a frontend rebuild, will not affect the browser. Never put `DATABASE_URL` or `JWT_SECRET_KEY` in a `VITE_*` variable.

The build now stops with a clear error if the core or ML URL is missing in real API mode. This prevents publishing a bundle that silently calls localhost. The two values must be present in the Vercel environment for the specific deployment target.

After deployment, open the frontend's `/login` page. In browser Developer Tools -> Network, submit the login form and check that the request URL is `https://your-core-service.example.com/auth/login`. If it points to `127.0.0.1:5000`, the Vercel variable was missing when that build was made. If it points to the ML URL, the wrong service was configured.

## 4. Configure and deploy ML

Set the ML service root to `ml` and deploy with `ml/Dockerfile` (or install `requirements.txt` and run `uvicorn main:app --host 0.0.0.0 --port $PORT`). Set `ALLOWED_ORIGINS` to the exact frontend origin; multiple origins can be comma separated. The Dockerfile now accepts the host's `PORT`. A local template is at `ml/.env.example`.

The trained `ml/models/isl_classifier.pkl` is ignored by Git and is about 250 MB locally. A Git-only deployment will not contain it. Put that artifact into the ML deployment at the path named by `MODEL_PATH`, or mount/download it as part of your private deployment process. The training CSV files are also ignored, so automatic training on a fresh Git deployment will not work without those files. Do not assume `/health` returning 200 means predictions work: verify `"model_loaded": true` at `https://your-ml-service.example.com/health`.

ML is not required for login. Repair core/frontend auth first, then verify ML assessment separately.

## 5. Check browser CORS and auth, one step at a time

From a machine with internet access, run the read-only automated smoke test at the repository root:

```powershell
node scripts/auth-smoke.mjs
```

It defaults to the three supplied public URLs. It tests the frontend page, core process and database readiness, CORS, missing/invalid tokens, an unknown login, and ML health/model status. It never creates an account. To test login with an existing account, set `SMOKE_EMAIL` and `SMOKE_PASSWORD` in your local shell before running it. Do not put them in the command line, commit them, or share the output with a token. Clear those two shell variables afterward.

Open the deployed frontend in a private browser window and Developer Tools -> Network. Filter for `auth` and preserve the log. Use an account that exists in the **same database** the deployed core uses, or create a new test account through `/register` if appropriate for that environment.

1. Submit `/register` once. Expect `POST /auth/register` to return 200 with account fields, followed by `POST /auth/login` returning 200 with `token.access_token` and `user`.
2. Confirm the browser reaches `/dashboard` and `GET /users/me` returns 200. Refresh `/dashboard`; it should load again.
3. Log out, then log in with the same email/password. Expect `POST /auth/login` 200 and `GET /users/me` 200.
4. Try an incorrect password. Expect a visible `Invalid credentials` error on the login page, without repeated redirects.
5. If testing mentor registration, confirm `/users/me` returns role `MENTOR`. Accounts created before the role fix may already be stored as `STUDENT` and need an individually reviewed correction in PostgreSQL.

Avoid posting screenshots that show a JWT, password, or full database URL. A JWT in browser localStorage is a credential; remove it from logs before sharing.

### Optional core preflight check from PowerShell

This only checks CORS; it does not create database records. Replace both origins:

```powershell
$coreUrl = 'https://your-core-service.example.com'
$frontendOrigin = 'https://your-frontend.vercel.app'
Invoke-WebRequest -Method Options -Uri "$coreUrl/auth/login" -Headers @{
  Origin = $frontendOrigin
  'Access-Control-Request-Method' = 'POST'
  'Access-Control-Request-Headers' = 'content-type'
}
```

The response should include `Access-Control-Allow-Origin` matching `$frontendOrigin`. A missing or different value means the core's origin settings do not match the browser's actual Origin. `curl` or a browser address bar can reach `/health` even when browser CORS blocks login.

## 6. Interpret the first failing request

| Symptom in Network/Console | Check and action |
| --- | --- |
| Request goes to `127.0.0.1:5000` | Set `VITE_API_BASE_URL` in Vercel, then redeploy frontend. |
| Request URL ends in `/auth/auth/login` | Use only the core origin for `VITE_API_BASE_URL`; remove `/auth`. |
| Browser reports CORS preflight failure | Add the exact frontend origin to core `ALLOWED_ORIGINS`, then restart core. Check scheme, domain, port, and Vercel preview versus production URL. |
| `POST /auth/login` returns 401 | Verify account exists in the connected PostgreSQL database and password is correct. Demo accounts in README are not guaranteed. |
| `POST /auth/register` returns 409 | The email already exists; log in or use another address. |
| Auth returns 500 or registration returns 400 | Check core logs and database connectivity/schema. Confirm `DATABASE_URL`, `DIRECT_URL`, and `User` table. |
| Core fails at startup with `JWT_SECRET_KEY must be configured` | Set the secret on the core host and redeploy. |
| Login succeeds, then `/users/me` fails | Check token in the Authorization header, core JWT secret consistency across replicas, and whether the user exists in the connected database. |
| `/health` is 200 but `/health/ready` is 503 | Core is running, but PostgreSQL or the `User` table is unavailable. Check core logs, connection settings, network access, and schema. |
| Frontend page refresh returns a hosting 404 | Confirm Vercel Root Directory is `frontend` and redeploy so `frontend/vercel.json` is applied. |
| ML `/health` has `model_loaded: false` | Supply the model file and set `MODEL_PATH`; then restart ML. |

## 7. Local checks and safe test policy

On Windows PowerShell, use `npm.cmd` if `.ps1` execution is disabled:

```powershell
cd frontend
npm.cmd ci
npm.cmd run check
$env:VITE_API_BASE_URL = 'https://sl-lms-backend.onrender.com'
$env:VITE_ML_BASE_URL = 'https://sl-lms-ml.onrender.com'
npx.cmd vite build --configLoader runner
npx.cmd vitest run --config auth-vitest.config.mjs
```

```powershell
cd core
npm.cmd ci
npm.cmd run build
```

For ML, create a Python 3.11 environment, install `ml/requirements.txt`, place the trained model and test CSVs in their expected directories, then run `python test_pipeline.py` from `ml`. The pipeline tests now send the same 10,000-pixel payload as the API schemas.

The existing `core/run-all-e2e.mjs`, `core/run-e2e-tests.mjs`, `core/e2e-test.mjs`, and frontend integration tests create records and assume a running backend. Point them only at a disposable test database, never a production database. Run one suite at a time on an isolated test deployment. Do not run the seed scripts just to make the demo credentials work.
