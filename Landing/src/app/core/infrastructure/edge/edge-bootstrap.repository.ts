import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BootstrapRepository,
  BootstrapResponse,
  SyncOwnerStoresResponse,
} from '../../repositories/bootstrap.repository';
import { Tier } from '../../types/enums';
import {
  BootstrapOwnerStoreRequest,
  BootstrapOwnerStoreResponse,
  SyncOwnerStoresFromLegacyResponse,
} from '../../types/edge-functions';
import { EdgeClientService } from './edge-client.service';

@Injectable()
export class EdgeBootstrapRepository implements BootstrapRepository {
  private readonly edgeClient = inject(EdgeClientService);

  bootstrapOwnerStore(storeName: string, domain: string, tier: Tier): Observable<BootstrapResponse> {
    const request: BootstrapOwnerStoreRequest = {
      store_name: storeName,
      domain: domain,
      tier: tier,
    };

    return this.edgeClient
      .callFunction<BootstrapOwnerStoreRequest, BootstrapOwnerStoreResponse>(
        'bootstrap_owner_store',
        request
      )
      .pipe(
        map((response) => ({
          storeDomain: response.store_domain,
          licenseId: response.license_id,
        }))
      );
  }

  syncOwnerStoresFromLegacy(): Observable<SyncOwnerStoresResponse> {
    return this.edgeClient
      .callFunction<Record<string, never>, SyncOwnerStoresFromLegacyResponse>(
        'sync_owner_stores_from_legacy',
        {}
      )
      .pipe(
        map((response) => ({
          synced: response.synced,
          stores: response.stores.map((store) => ({
            domain: store.domain,
            shopifyDomain: store.shopify_domain,
            source: store.source,
          })),
        }))
      );
  }
}
