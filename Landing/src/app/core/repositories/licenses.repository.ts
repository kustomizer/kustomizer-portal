import { Observable } from 'rxjs';
import { License } from '../models';

export interface LicensesRepository {
  listLicenses(): Observable<License[]>;
  getLicenseForOrg(orgId: string): Observable<License | null>;
  updateLicense(id: string, changes: Partial<License>): Observable<License>;
  createLicense(orgId: string, license: Omit<License, 'id' | 'orgId'>): Observable<License>;
}
