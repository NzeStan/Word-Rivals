import { API_BASE } from '@/config/app';
import { ERROR_MESSAGES } from '@/config/strings';
import { clearTokens, currentTokens, saveTokens, secondsUntilExpiry } from './tokens';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details: Record<string, any> = {},
  ) {
    super(ERROR_MESSAGES[code] ?? message);
  }
  /** First problem reported for a form field, if any. */
  field(name: string): string | undefined {
    const value = this.details?.[name];
    return Array.isArray(value) ? value[0] : undefined;
  }
}

let onSessionExpired: () => void = () => {};
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

const TIMEOUT_MS = 15000;

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}/${path}`, { ...init, signal: controller.signal });
  } catch {
    throw new ApiError('NETWORK', 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // A proxy or crash page. Reported below by status.
  }
  if (res.ok) return body as T;
  const err = body?.error;
  throw new ApiError(err?.code ?? `HTTP_${res.status}`, err?.message ?? 'Something went wrong.', res.status, err?.details);
}

// Refresh tokens rotate, so concurrent callers must share a single refresh.
let refreshing: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const refresh = currentTokens()?.refresh;
    if (!refresh) return null;
    const res = await rawFetch('auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.status === 400 || res.status === 401) {
      await clearTokens();
      onSessionExpired();
      return null;
    }
    const data = await parse<{ access: string; refresh?: string }>(res);
    await saveTokens({ access: data.access, refresh: data.refresh ?? refresh });
    return data.access;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** An access token good for at least the next 30 seconds, for opening sockets. */
export async function freshAccessToken(): Promise<string | null> {
  const access = currentTokens()?.access;
  if (!access) return null;
  const left = secondsUntilExpiry(access);
  return left !== null && left > 30 ? access : refreshAccessToken();
}

type Options = { method?: string; body?: unknown; auth?: boolean };

export async function api<T = any>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const send = (token?: string | null) =>
    rawFetch(path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  const token = auth ? currentTokens()?.access : null;
  let res = await send(token);
  if (res.status === 401 && auth && token) {
    const next = await refreshAccessToken();
    if (next) res = await send(next);
  }
  return parse<T>(res);
}
