// True when the Origin header names the host serving this request. A value that is not a URL (e.g. "null" from a
// sandboxed iframe) is never the same host, so it gets the caller's 403 instead of throwing.
export function sameHost(origin: string, requestUrl: string): boolean {
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}
