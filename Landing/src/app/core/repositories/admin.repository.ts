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
  getStoreDetail(storeId: string): Observable<AdminStoreDetail>;
  updateStore(storeId: string, changes: Partial<Store>): Observable<Store>;
  deleteStore(storeId: string): Observable<void>;
  
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
