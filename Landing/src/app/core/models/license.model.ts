import { LicenseStatus, Tier } from '../types/enums';
import { LicenseId, StoreId } from '../types/ids';

export interface LicenseLimits {
  stores: number;
  domainsPerStore: number;
  seats: number;
  [key: string]: any; // jsonb allows arbitrary fields
}

/**
 * License entity (maps to backend licenses table)
 *
 * IMPORTANT: IDs are bigint in database but come as strings from PostgREST
 * to avoid JavaScript number precision issues.
 *
 * @see https://supabase.com/docs/guides/api/rest/postgres-types#bigint-int8
 */
export interface License {
  id: LicenseId;
  storeId: StoreId;
  status: LicenseStatus; // 0=Trial, 1=Active, 2=Expired, 3=Suspended
  tier: Tier; // 0=Starter, 1=Growth, 2=Enterprise
  limits: LicenseLimits;
  expiresAt?: string;
  createdAt?: string;
}

// Legacy type aliases for backward compatibility
export type LicenseStatusString = 'trial' | 'active' | 'expired' | 'suspended';
export type LicenseTierString = 'starter' | 'growth' | 'enterprise';
