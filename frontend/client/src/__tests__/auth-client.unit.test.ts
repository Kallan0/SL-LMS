import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, apiService } from '@/services/api';

const tokenKey = 'sign_language_lms_token';
let values: Map<string, string>;
let location: { href: string };

beforeEach(() => {
  values = new Map();
  location = { href: '/login' };
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubGlobal('window', { location });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authentication HTTP client', () => {
  it('shows the Express error on a bad login without redirecting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )));

    await expect(apiService.login('wrong@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    expect(location.href).toBe('/login');
    expect(values.has(tokenKey)).toBe(false);
  });

  it('stores the JWT returned by a successful login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      token: { access_token: 'test-jwt', token_type: 'bearer' },
      user: { id: 'user-1', username: 'test', role: 'STUDENT' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    await apiService.login('test@example.com', 'password');
    expect(values.get(tokenKey)).toBe('test-jwt');
  });

  it('clears an expired session when a protected request returns 401', async () => {
    values.set(tokenKey, 'old-jwt');
    location.href = '/dashboard';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )));

    await expect(apiFetch('/users/me')).rejects.toThrow('Unauthorized');
    expect(values.has(tokenKey)).toBe(false);
    expect(location.href).toBe('/login');
  });
});
