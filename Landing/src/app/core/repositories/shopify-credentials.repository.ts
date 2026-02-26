import { Observable } from 'rxjs';

export type ShopifyCredentialsUpsertResult = {
  shopifyDomain: string;
  lastValidatedAt: string | null;
};

export interface ShopifyCredentialsRepository {
  upsertCredentials(
    shopId: string,
    shopifyDomain: string,
    accessToken: string
  ): Observable<ShopifyCredentialsUpsertResult>;
}
