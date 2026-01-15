import { Observable } from 'rxjs';
import { StoreDomain } from '../models';

export interface DomainsRepository {
  listDomains(storeId: string): Observable<StoreDomain[]>;
  addDomain(storeId: string, domain: string): Observable<StoreDomain>;
  removeDomain(domainId: string): Observable<void>;
}
