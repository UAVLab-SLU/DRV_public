/* eslint-env jest */
import { parseApiError, getErrorMessage } from '../utils/apiError';

function mockResponse(body, status = 500, headers = {}) {
  const headersMap = new Headers(headers);
  return {
    status,
    ok: false,
    headers: headersMap,
    json: () => Promise.resolve(body),
  };
}

function mockTextResponse(status = 500, headers = {}) {
  const headersMap = new Headers(headers);
  return {
    status,
    ok: false,
    headers: headersMap,
    json: () => Promise.reject(new Error('not json')),
  };
}

describe('parseApiError', () => {
  test('extracts fields from standard error envelope', async () => {
    const res = mockResponse(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid drone data',
          details: { missing_fields: ['id'] },
          timestamp: '2025-11-18T10:30:00Z',
          request_id: 'abc-123',
        },
      },
      422,
    );
    const parsed = await parseApiError(res);
    expect(parsed.code).toBe('VALIDATION_ERROR');
    expect(parsed.message).toBe('Invalid drone data');
    expect(parsed.details).toEqual({ missing_fields: ['id'] });
    expect(parsed.requestId).toBe('abc-123');
  });

  test('falls back when response is not JSON', async () => {
    const res = mockTextResponse(502);
    const parsed = await parseApiError(res);
    expect(parsed.code).toBe('UNKNOWN_ERROR');
    expect(parsed.message).toContain('502');
  });

  test('falls back for non-standard JSON body', async () => {
    const res = mockResponse({ msg: 'something went wrong' }, 500);
    const parsed = await parseApiError(res);
    expect(parsed.code).toBe('UNKNOWN_ERROR');
    expect(parsed.message).toContain('500');
  });

  test('reads X-Request-ID header when request_id is missing from body', async () => {
    const res = mockResponse(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected error',
          details: {},
        },
      },
      500,
      { 'X-Request-ID': 'header-id-456' },
    );
    const parsed = await parseApiError(res);
    expect(parsed.requestId).toBe('header-id-456');
  });
});

describe('getErrorMessage', () => {
  test('returns just the message string', async () => {
    const res = mockResponse(
      {
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Drone not found',
          details: { drone_id: 'Drone3' },
          request_id: 'xyz',
        },
      },
      404,
    );
    const msg = await getErrorMessage(res);
    expect(msg).toBe('Drone not found');
  });
});
