import { Observable } from 'rxjs';
import { Tier } from '../types/enums';

export interface BootstrapResponse {
  storeId: string;
  licenseId: string;
  membershipId: string;
}

export interface BootstrapRepository {
  bootstrapNewUser(storeName: string, tier: Tier): Observable<BootstrapResponse>;
}

