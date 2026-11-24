/**
 * One source of truth for the site's HTTP security headers.
 * - `vite build` writes them to dist/_headers (read by Netlify and Cloudflare Pages)
 *   and adds the CSP as a <meta> tag so it still applies on hosts that ignore _headers.
 * - `vite preview` serves them, so the production build can be tested with them on.
 * The dev server is left alone: Vite's hot reload needs inline scripts.
 */

const csp = ({ https = true, meta = false } = {}) =>
  [
    "default-src 'self'",
    "script-src 'self'",
    // Google Fonts stylesheet; 'unsafe-inline' only covers style attributes / small injected rules
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // frame-ancestors is ignored inside <meta>, so it only goes in the real header
    !meta && "frame-ancestors 'none'",
    https && 'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ')

export const securityHeaders = ({ https = true } = {}) => ({
  'Content-Security-Policy': csp({ https }),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  ...(https ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains' } : {}),
})

/** Vite plugin: emits dist/_headers and injects the CSP meta tag into the built index.html. */
export function securityHeadersPlugin() {
  return {
    name: 'petale-security-headers',
    apply: 'build',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp({ meta: true }) }, injectTo: 'head-prepend' }]
    },
    generateBundle() {
      const block = (path, headers) => `${path}\n${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`
      const source = [
        block('/*', securityHeaders()),
        block('/assets/*', { 'Cache-Control': 'public, max-age=31536000, immutable' }),
        block('/photos/*', { 'Cache-Control': 'public, max-age=2592000' }),
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: '_headers', source })
    },
  }
}
