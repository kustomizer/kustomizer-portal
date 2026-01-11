import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { toLoadable } from '../../shared/utils/loadable';
import { DOMAINS_REPOSITORY, STORES_REPOSITORY } from '../repositories';
import { StoreDomain } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminStoreDomainsFacade {
  private readonly storesRepository = inject(STORES_REPOSITORY);
  private readonly domainsRepository = inject(DOMAINS_REPOSITORY);
  private readonly domainsRefreshSubject = new BehaviorSubject<void>(undefined);

  store(storeId: string) {
    return toLoadable(this.storesRepository.getStore(storeId), store => !store);
  }

  domains(storeId: string) {
    return this.domainsRefreshSubject.pipe(
      switchMap(() => toLoadable(this.domainsRepository.listDomains(storeId), domains => domains.length === 0))
    );
  }

  addDomain(storeId: string, domain: string): Observable<StoreDomain> {
    return this.domainsRepository.addDomain(storeId, domain).pipe(
      tap(() => this.domainsRefreshSubject.next(undefined))
    );
  }

  removeDomain(domainId: string): Observable<void> {
    return this.domainsRepository.removeDomain(domainId).pipe(
      tap(() => this.domainsRefreshSubject.next(undefined))
    );
  }
}
