import { Observable } from 'rxjs';

export type ShopifyCredentialsUpsertResult = {
  shopifyDomain: string;
  lastValidatedAt: string | null;
};

export interface ShopifyCredentialsRepository {
  upsertCredentials(domain: string, shopifyDomain: string, accessToken: string): Observable<ShopifyCredentialsUpsertResult>;
}
