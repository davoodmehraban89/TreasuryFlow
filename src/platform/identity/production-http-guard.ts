/** Default-deny HTTP boundary for unprovisioned production deployments. */
export function isProductionOperationBlocked(
  env: Readonly<Record<string,string|undefined>>,
  pathname: string
): boolean {
  if (env.NODE_ENV !== 'production' || env.TREASURYFLOW_DESKTOP_LOCAL === '1') return false;
  // Only a public readiness endpoint and the login view are non-operational.
  return pathname !== '/api/ready' && pathname !== '/login';
}
