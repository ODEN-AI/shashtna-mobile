import { ApiError, configureApi, request } from '@/src/api/client';

function respond(status: number, body: unknown) {
  return jest.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })));
}

describe('API client', () => {
  const onUnauthorized = jest.fn();

  beforeEach(() => {
    onUnauthorized.mockReset();
    configureApi({ baseUrl: 'https://api.test', getToken: () => 'tok', onUnauthorized, timeoutMs: 50 });
  });

  it('sends the Bearer token and JSON body', async () => {
    const fetchImpl = respond(200, { success: true, value: 1 });
    configureApi({ fetchImpl });
    await expect(request('/x', { body: { a: 1 } })).resolves.toEqual({ success: true, value: 1 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/x');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
  });

  it('never sends the token to public endpoints', async () => {
    const fetchImpl = respond(200, { success: true });
    configureApi({ fetchImpl });
    await request('/public', { auth: false });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('401 signs out once, centrally', async () => {
    configureApi({ fetchImpl: respond(401, { success: false, message: 'expired' }) });
    await expect(request('/me')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('a wrong password on login is not treated as an expired session', async () => {
    configureApi({ fetchImpl: respond(401, { success: false, code: 'INVALID_CREDENTIALS', message: 'رقم الهاتف أو كلمة المرور غير صحيحة.' }) });
    await expect(request('/login', { auth: false })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', message: 'رقم الهاتف أو كلمة المرور غير صحيحة.' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('shows server validation messages but hides 5xx details', async () => {
    configureApi({ fetchImpl: respond(400, { success: false, message: 'الباقة غير متاحة' }) });
    await expect(request('/o')).rejects.toMatchObject({ kind: 'validation', message: 'الباقة غير متاحة' });

    configureApi({ fetchImpl: respond(500, { success: false, message: 'TypeError at line 3' }) });
    const error = (await request('/o').catch((caught: unknown) => caught)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('server');
    expect(error.message).not.toContain('TypeError');
    expect(error.retryable).toBe(true);
  });

  it('maps network failures and timeouts', async () => {
    configureApi({ fetchImpl: jest.fn(() => Promise.reject(new TypeError('Network request failed'))) });
    await expect(request('/x')).rejects.toMatchObject({ kind: 'offline' });

    configureApi({
      fetchImpl: jest.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
      ) as unknown as typeof fetch,
    });
    await expect(request('/slow')).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('404 maps to not_found', async () => {
    configureApi({ fetchImpl: respond(404, { success: false, message: 'انتهى' }) });
    await expect(request('/content/1')).rejects.toMatchObject({ kind: 'not_found', retryable: false });
  });
});
