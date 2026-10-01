/**
 * Read-only deployment smoke test. Requires Node.js 18+.
 * Optional SMOKE_EMAIL and SMOKE_PASSWORD test an existing account.
 * This script never registers a user or writes to the database.
 */

const core = (process.env.CORE_URL || 'https://sl-lms-backend.onrender.com').replace(/\/+$/, '');
const frontend = (process.env.FRONTEND_URL || 'https://sl-lms-ten.vercel.app').replace(/\/+$/, '');
const ml = (process.env.ML_URL || 'https://sl-lms-ml.onrender.com').replace(/\/+$/, '');
const timeout = Number(process.env.SMOKE_TIMEOUT_MS || 90000);
let failures = 0;

async function probe(label, url, options = {}) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
    return response;
  } catch (error) {
    console.error(`FAIL ${label}: ${error.message}`);
    failures++;
    return null;
  }
}

function check(label, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`);
  if (!condition) failures++;
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

const page = await probe('frontend /login', `${frontend}/login`);
if (page) {
  check('frontend /login', page.ok && (page.headers.get('content-type') || '').includes('text/html'), `HTTP ${page.status}`);
  await page.body?.cancel();
}

const health = await probe('core /health', `${core}/health`);
if (health) {
  const body = await readJson(health);
  check('core /health', health.status === 200 && body.service === 'core-backend', `HTTP ${health.status}`);
}

const ready = await probe('core /health/ready', `${core}/health/ready`);
if (ready) {
  const body = await readJson(ready);
  check('core database readiness', ready.status === 200 && body.database === 'ready', `HTTP ${ready.status}`);
}

const preflight = await probe('core CORS preflight', `${core}/auth/login`, {
  method: 'OPTIONS',
  headers: {
    Origin: frontend,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  },
});
if (preflight) {
  check('core CORS preflight', preflight.ok && preflight.headers.get('access-control-allow-origin') === frontend,
    `HTTP ${preflight.status}; allowed origin ${preflight.headers.get('access-control-allow-origin') || '(none)'}`);
  await preflight.body?.cancel();
}

const unauthorized = await probe('core unauthenticated profile', `${core}/users/me`);
if (unauthorized) {
  check('core unauthenticated profile', unauthorized.status === 401, `HTTP ${unauthorized.status}`);
  await unauthorized.body?.cancel();
}

const invalidToken = await probe('core invalid token', `${core}/users/me`, {
  headers: { Authorization: 'Bearer invalid-smoke-token' },
});
if (invalidToken) {
  check('core invalid token', invalidToken.status === 401, `HTTP ${invalidToken.status}`);
  await invalidToken.body?.cancel();
}

const unknownLogin = await probe('core unknown login', `${core}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: frontend },
  body: JSON.stringify({ email: `smoke-${Date.now()}@example.invalid`, password: 'never-a-real-password' }),
});
if (unknownLogin) {
  check('core unknown login', unknownLogin.status === 401, `HTTP ${unknownLogin.status}`);
  await unknownLogin.body?.cancel();
}

if (process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD) {
  const login = await probe('core existing-account login', `${core}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: frontend },
    body: JSON.stringify({ email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD }),
  });
  if (login) {
    const body = await readJson(login);
    const token = body.token?.access_token;
    check('core existing-account login', login.status === 200 && typeof token === 'string' && !!body.user?.id, `HTTP ${login.status}`);
    if (token) {
      const profile = await probe('core authenticated profile', `${core}/users/me`, {
        headers: { Authorization: `Bearer ${token}`, Origin: frontend },
      });
      if (profile) {
        const user = await readJson(profile);
        check('core authenticated profile', profile.status === 200 && user.id === body.user.id, `HTTP ${profile.status}`);
      }
    }
  }
} else {
  console.log('SKIP existing-account login: set SMOKE_EMAIL and SMOKE_PASSWORD to verify it');
}

const mlHealth = await probe('ML /health', `${ml}/health`);
if (mlHealth) {
  const body = await readJson(mlHealth);
  check('ML /health', mlHealth.status === 200 && body.service === 'isl-inference', `HTTP ${mlHealth.status}`);
  check('ML model loaded', body.model_loaded === true, `model_loaded=${body.model_loaded}`);
}

console.log(`Smoke test finished: ${failures} failure(s)`);
process.exitCode = failures ? 1 : 0;
