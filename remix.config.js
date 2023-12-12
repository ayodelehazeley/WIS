/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */

module.exports = {
  devServerPort: 8002,
  future: {
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  ignoredRouteFiles: ['**/.*'],
  serverModuleFormat: 'cjs', // would be changing to esm
}
