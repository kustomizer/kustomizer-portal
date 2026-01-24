import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  OwnerShopifyCredentialsUpsertRequest,
  OwnerShopifyCredentialsUpsertResponse,
} from '../../types/edge-functions';
import {
  ShopifyCredentialsRepository,
  ShopifyCredentialsUpsertResult,
} from '../../repositories/shopify-credentials.repository';
import { EdgeClientService } from './edge-client.service';

@Injectable()
export class EdgeShopifyCredentialsRepository implements ShopifyCredentialsRepository {
  private readonly edgeClient = inject(EdgeClientService);

  upsertCredentials(domain: string, shopifyDomain: string, accessToken: string): Observable<ShopifyCredentialsUpsertResult> {
    const request: OwnerShopifyCredentialsUpsertRequest = {
      domain,
      shopify_domain: shopifyDomain,
      access_token: accessToken,
    };

    return this.edgeClient
      .callFunction<OwnerShopifyCredentialsUpsertRequest, OwnerShopifyCredentialsUpsertResponse>(
        'owner_shopify_credentials_upsert',
        request
      )
      .pipe(
        map((response) => ({
          shopifyDomain: response.shopify_domain,
          lastValidatedAt: response.last_validated_at,
        }))
      );
  }
}
