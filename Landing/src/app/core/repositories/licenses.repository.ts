import { Observable } from 'rxjs';
import { License } from '../models';
import { Tier } from '../types/enums';

export interface LicensesRepository {
  listLicenses(): Observable<License[]>;
  getLicenseByStore(domain: string): Observable<License | null>;
  updateLicense(id: string, changes: Partial<License>): Observable<License>;
  updateTier?(licenseId: string, tier: Tier): Observable<License>;
}
