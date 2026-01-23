import { StoreDomain, UserEmail } from '../types/ids';

/**
 * Store entity (maps to backend stores table)
 */
export interface Store {
  id: StoreDomain; // Alias for legacy storeId usage
  domain: StoreDomain;
  name: string;
  ownerEmail: UserEmail;
  createdAt?: string;
}

export interface StoreMetadata {
  [key: string]: any;
}
