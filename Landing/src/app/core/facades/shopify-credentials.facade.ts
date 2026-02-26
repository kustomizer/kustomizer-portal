import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SHOPIFY_CREDENTIALS_REPOSITORY } from '../repositories';
import { ShopifyCredentialsUpsertResult } from '../repositories/shopify-credentials.repository';

@Injectable({ providedIn: 'root' })
export class ShopifyCredentialsFacade {
  private readonly repo = inject(SHOPIFY_CREDENTIALS_REPOSITORY);

  upsertCredentials(
    shopId: string,
    shopifyDomain: string,
    accessToken: string
  ): Observable<ShopifyCredentialsUpsertResult> {
    return this.repo.upsertCredentials(shopId, shopifyDomain, accessToken);
  }
}
