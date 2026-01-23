import { Tier } from '../types/enums';
import { LicenseId } from '../types/ids';

/**
 * License entity (maps to backend licenses table)
 */
export interface License {
  id: LicenseId;
  tier: Tier;
  createdAt: string;
  expiresAt?: string | null;
  active: boolean;
}
