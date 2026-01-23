import { Observable } from 'rxjs';
import { Store, License, StoreUser } from '../models';
import { Tier } from '../types/enums';

export interface AdminStoreDetail {
  store: Store;
  license: License | null;
  storeUsers: StoreUser[];
}

export interface AdminRepository {
  // Store management
  listAllStores(): Observable<Store[]>;
  getStoreDetail(domain: string): Observable<AdminStoreDetail>;
  updateStore(domain: string, changes: Partial<Store>): Observable<Store>;
  deleteStore(domain: string): Observable<void>;
  
  // License management
  updateLicense(
    licenseId: string,
    changes: {
      tier?: Tier;
      expiresAt?: string | null;
    }
  ): Observable<License>;
  
  // Check admin status
  isAdmin(): Observable<boolean>;
}
