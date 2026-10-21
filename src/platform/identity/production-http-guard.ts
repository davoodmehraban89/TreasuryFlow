/** Default-deny HTTP boundary for unprovisioned production deployments. */
export function isProductionOperationBlocked(
  env: Readonly<Record<string,string|undefined>>,
  pathname: string
): boolean {
  const externalProduction = env.NODE_ENV === 'production' && env.TREASURYFLOW_DESKTOP_LOCAL !== '1';
  const unauthorizedBankLive = env.BANK_ADAPTER_MODE === 'live';
  if (!externalProduction && !unauthorizedBankLive) return false;
  // Only a public readiness endpoint and the login view are non-operational.
  return pathname !== '/api/ready' && pathname !== '/login';
}
