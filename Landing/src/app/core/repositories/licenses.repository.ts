import { Observable } from 'rxjs';
import { License, LicenseLimits } from '../models';
import { LicenseStatus, Tier } from '../types/enums';

export interface LicensesRepository {
  listLicenses(): Observable<License[]>;
  getLicenseByStore(storeId: string): Observable<License | null>;
  updateLicense(id: string, changes: Partial<License>): Observable<License>;
  createLicense(storeId: string, license: Omit<License, 'id' | 'storeId'>): Observable<License>;
  
  // Tier management
  updateTier?(storeId: string, tier: Tier): Observable<License>;
}
