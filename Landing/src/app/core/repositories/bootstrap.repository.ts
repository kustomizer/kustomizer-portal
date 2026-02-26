import { Observable } from 'rxjs';
import { Tier } from '../types/enums';

export interface BootstrapResponse {
  shopId: string;
  shopifyDomain: string;
  licenseId: string;
}

export interface BootstrapRepository {
  bootstrapOwnerStore(storeName: string, domain: string, tier: Tier): Observable<BootstrapResponse>;
}
