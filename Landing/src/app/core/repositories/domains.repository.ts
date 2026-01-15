import { Observable } from 'rxjs';
import { Domain } from '../models';

export interface DomainsRepository {
  listDomains(storeId: string): Observable<Domain[]>;
  addDomain(storeId: string, domain: string): Observable<Domain>;
  removeDomain(domainId: string): Observable<void>;
}
