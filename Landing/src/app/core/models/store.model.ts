import { StoreId, DomainId } from '../types/ids';

/**
 * Store entity (maps to backend stores table)
 *
 * IMPORTANT: id is bigint in database but comes as string from PostgREST
 * to avoid JavaScript number precision issues.
 *
 * @see https://supabase.com/docs/guides/api/rest/postgres-types#bigint-int8
 */
export interface Store {
  id: StoreId;
  name: string;
  createdAt: string;
  metadata?: StoreMetadata;
}

export interface StoreMetadata {
  shopName?: string;
  email?: string;
  country?: string;
  currency?: string;
  installedAt?: string;
  [key: string]: any; // jsonb allows arbitrary fields
}

/**
 * Domain entity (maps to backend domains table)
 *
 * IMPORTANT: IDs are bigint in database but come as strings from PostgREST
 */
export interface Domain {
  id: DomainId;
  storeId: StoreId;
  domain: string;
  createdAt: string;
}

// Alias for backward compatibility if needed
export type StoreDomain = Domain;
