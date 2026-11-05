/**
 * Every way a conversion request can fail. The API answers with the code only
 * (never the URL, never upstream text), and the page turns it into a message
 * in the visitor's language.
 */
export type FetchErrorCode =
  | 'invalid_url'
  | 'blocked'
  | 'too_many_redirects'
  | 'timeout'
  | 'too_large'
  | 'not_html'
  | 'empty_content'
  | 'too_complex'
  | 'upstream_error'
  | 'network';

export class FetchError extends Error {
  readonly code: FetchErrorCode;

  constructor(code: FetchErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = 'FetchError';
    this.code = code;
  }
}

/** HTTP status the API uses for each failure. */
export const STATUS_BY_CODE: Readonly<Record<FetchErrorCode, number>> = {
  invalid_url: 400,
  blocked: 403,
  too_large: 413,
  not_html: 415,
  empty_content: 422,
  too_complex: 422,
  too_many_redirects: 502,
  upstream_error: 502,
  network: 502,
  timeout: 504,
};
