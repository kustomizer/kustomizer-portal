export type LicenseStatus = 'trial' | 'active' | 'expired';
export type LicenseTier = 'starter' | 'growth' | 'enterprise';

export interface LicenseLimits {
  stores: number;
  domainsPerStore: number;
  seats: number;
}

export interface License {
  id: string;
  orgId: string;
  status: LicenseStatus;
  tier: LicenseTier;
  startedAt: string;
  expiresAt?: string;
  limits: LicenseLimits;
}
