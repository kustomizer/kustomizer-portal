import { UserEmail } from '../types/ids';

/**
 * Store entity (maps to backend stores table)
 */
export interface Store {
  id: string;
  shopifyDomain: string;
  name: string;
  ownerEmail: UserEmail;
  createdAt?: string;
  shopifyConnected?: boolean;
  shopifyLastValidatedAt?: string | null;
}

export interface StoreMetadata {
  [key: string]: any;
}
