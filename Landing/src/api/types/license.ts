export enum LicenseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum LicenseTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
}

export interface License {
  id: string;
  key: string;
  status: LicenseStatus;
  tier: LicenseTier;
  expires_at: string | null;
  allowlist: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface LicenseValidationRequest {
  key: string;
  domain?: string;
  ip?: string;
}

export interface LicenseValidationResponse {
  valid: boolean;
  license?: {
    id: string;
    tier: LicenseTier;
    status: LicenseStatus;
    expires_at: string | null;
  };
  reason?: string;
}

export interface LicenseUpdatePayload {
  status?: LicenseStatus;
  tier?: LicenseTier;
  expires_at?: string | null;
  allowlist?: string[];
}

