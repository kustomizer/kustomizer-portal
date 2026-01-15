import { Observable } from 'rxjs';
import { Store, License, Membership, LicenseLimits } from '../models';
import { LicenseStatus, Tier } from '../types/enums';

export interface AdminStoreDetail {
  store: Store;
  license?: License;
  memberships: Membership[];
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
      status?: LicenseStatus;
      tier?: Tier;
      limits?: LicenseLimits;
      expiresAt?: string;
    }
  ): Observable<License>;
  
  // Check admin status
  isAdmin(): Observable<boolean>;
}

