import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BootstrapRepository, BootstrapResponse } from '../../repositories/bootstrap.repository';
import { Tier } from '../../types/enums';
import {
  BootstrapOwnerStoreRequest,
  BootstrapOwnerStoreResponse,
} from '../../types/edge-functions';
import { EdgeClientService } from './edge-client.service';

@Injectable()
export class EdgeBootstrapRepository implements BootstrapRepository {
  private readonly edgeClient = inject(EdgeClientService);

  bootstrapOwnerStore(storeName: string, domain: string, tier: Tier): Observable<BootstrapResponse> {
    const request: BootstrapOwnerStoreRequest = {
      store_name: storeName,
      shopify_domain: domain,
      tier: tier,
    };

    return this.edgeClient
      .callFunction<BootstrapOwnerStoreRequest, BootstrapOwnerStoreResponse>(
        'bootstrap_owner_store',
        request
      )
      .pipe(
        map((response) => ({
          shopId: response.shop_id,
          shopifyDomain: response.shopify_domain,
          licenseId: response.license_id,
        }))
      );
  }
}
