/**
 * Parses the standardized error response envelope returned by the backend.
 *
 * Expected shape:
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "User-friendly message",
 *     "details": { ... },
 *     "timestamp": "2025-11-18T10:30:00Z",
 *     "request_id": "550e8400-e29b-41d4-a716-446655440000"
 *   }
 * }
 */

/**
 * Extract a user-friendly message from a failed fetch Response.
 *
 * If the response body matches the standard error envelope, the `message`
 * field is returned.  Otherwise a generic fallback is built from the HTTP
 * status code and any available text.
 *
 * @param {Response} response - The fetch Response object (already known to be !ok).
 * @returns {Promise<{code: string, message: string, details: object, requestId: string}>}
 */
export async function parseApiError(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    return {
      code: 'UNKNOWN_ERROR',
      message: `Request failed with status ${response.status}`,
      details: {},
      requestId: response.headers.get('X-Request-ID') || '',
    };
  }

  if (body && body.error && body.error.code) {
    return {
      code: body.error.code,
      message: body.error.message || 'An error occurred',
      details: body.error.details || {},
      requestId: body.error.request_id || response.headers.get('X-Request-ID') || '',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: body.message || body.error || `Request failed with status ${response.status}`,
    details: {},
    requestId: response.headers.get('X-Request-ID') || '',
  };
}

/**
 * Convenience wrapper: extracts just the user-facing message string from a
 * failed response.  Useful when the caller only needs to display a message.
 *
 * @param {Response} response
 * @returns {Promise<string>}
 */
export async function getErrorMessage(response) {
  const parsed = await parseApiError(response);
  return parsed.message;
}
