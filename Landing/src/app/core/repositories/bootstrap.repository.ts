import { Observable } from 'rxjs';
import { Tier } from '../types/enums';

export interface BootstrapResponse {
  storeDomain: string;
  licenseId: string;
}

export interface SyncOwnerStoresResponse {
  synced: number;
  stores: Array<{
    domain: string;
    shopifyDomain: string | null;
    source: 'legacy_store_users' | 'legacy_shops';
  }>;
}

export interface BootstrapRepository {
  bootstrapOwnerStore(storeName: string, domain: string, tier: Tier): Observable<BootstrapResponse>;
  syncOwnerStoresFromLegacy(): Observable<SyncOwnerStoresResponse>;
}
