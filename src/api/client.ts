import { API_BASE_URL } from '@/src/lib/config';
import { recordError } from '@/src/lib/diagnostics';

/**
 * The one place that talks HTTP. Screens never call fetch directly: they use
 * the domain modules in src/api/*, which use this client.
 *
 * - adds the Bearer token from the session store
 * - times out slow requests (mobile networks)
 * - turns every failure into an ApiError with a kind the UI can act on
 * - reports 401s so the session can be cleared once, centrally
 */

export type ApiErrorKind = 'offline' | 'timeout' | 'unauthorized' | 'forbidden' | 'not_found' | 'validation' | 'server';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status = 0,
    public readonly code?: string,
    /** The API path (no query), shown with the status so a customer's report says where it failed. */
    public readonly path?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Worth retrying automatically (network trouble or a server hiccup). */
  get retryable() {
    return this.kind === 'offline' || this.kind === 'timeout' || this.kind === 'server';
  }
}

export const MESSAGES: Record<ApiErrorKind, string> = {
  offline: 'ماكو اتصال بالإنترنت. تأكد من الشبكة وحاول مرة ثانية.',
  timeout: 'الاتصال بطيء حاليًا. حاول مرة ثانية.',
  unauthorized: 'انتهت جلسة تسجيل الدخول. سجّل دخولك مرة ثانية.',
  forbidden: 'ما عندك صلاحية لهذا الإجراء.',
  not_found: 'العنصر غير موجود أو لم يعد متاحًا.',
  validation: 'تأكد من البيانات وحاول مرة ثانية.',
  server: 'صار خطأ بالخادم. حاول بعد شوية.',
};

type Config = {
  getToken: () => string | null;
  onUnauthorized: () => void;
  fetchImpl: typeof fetch;
  baseUrl: string;
  timeoutMs: number;
};

const config: Config = {
  getToken: () => null,
  onUnauthorized: () => undefined,
  fetchImpl: (...args) => fetch(...args),
  baseUrl: API_BASE_URL,
  timeoutMs: 20_000,
};

export function configureApi(next: Partial<Config>) {
  Object.assign(config, next);
}

export function apiUrl(path: string) {
  return `${config.baseUrl}${path}`;
}

/** Headers for requests made outside the client (e.g. authenticated images). */
export function authHeaders(): Record<string, string> {
  const token = config.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status >= 400 && status < 500) return 'validation';
  return 'server';
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  form?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = config.getToken();

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;

  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? config.timeoutMs);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort);

  let response: Response;

  try {
    response = await config.fetchImpl(apiUrl(path), {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    const aborted = controller.signal.aborted;
    throw new ApiError(aborted ? 'timeout' : 'offline', aborted ? MESSAGES.timeout : MESSAGES.offline);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }

  let data: Record<string, unknown> | null = null;

  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    const kind = response.ok ? 'validation' : kindForStatus(response.status);

    if (kind === 'unauthorized' && options.auth !== false) {
      config.onUnauthorized();
    }

    const serverMessage = typeof data?.message === 'string' && data.message ? data.message : null;
    if (kind === 'server') {
      recordError('api', `${options.method ?? 'GET'} ${path.split('?')[0]} → ${response.status}`);
    }

    // Server messages are written for customers; 5xx details are not.
    const message = kind === 'server' ? MESSAGES.server : serverMessage ?? MESSAGES[kind];

    throw new ApiError(kind, message, response.status, typeof data?.code === 'string' ? data.code : undefined, path.split('?')[0]);
  }

  return (data ?? {}) as T;
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return MESSAGES.server;
}
