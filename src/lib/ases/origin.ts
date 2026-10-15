/** Match the browser Origin against the incoming Host, not Next's normalized
 * internal URL hostname (localhost for a request received on 127.0.0.1 in dev).
 * Do not trust arbitrary forwarded-host headers or allow wildcard origins. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const source = new URL(origin);
    return source.origin === origin && source.host === host.toLowerCase()
      && source.protocol === new URL(request.url).protocol
      && ["http:", "https:"].includes(source.protocol);
  } catch { return false; }
}
