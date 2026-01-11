import { Injectable, inject } from '@angular/core';
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthFacade } from './auth.facade';
import { DOMAINS_REPOSITORY, LICENSES_REPOSITORY, STORES_REPOSITORY } from '../repositories';
import { toLoadable } from '../../shared/utils/loadable';
import { StoreDomain } from '../models';

@Injectable({ providedIn: 'root' })
export class PortalStoreFacade {
  private readonly auth = inject(AuthFacade);
  private readonly storesRepository = inject(STORES_REPOSITORY);
  private readonly domainsRepository = inject(DOMAINS_REPOSITORY);
  private readonly licensesRepository = inject(LICENSES_REPOSITORY);
  private readonly domainsRefreshSubject = new BehaviorSubject<void>(undefined);

  private readonly orgId$ = this.auth.session$.pipe(
    map(session => session?.orgId),
    filter((orgId): orgId is string => Boolean(orgId)),
    shareReplay(1)
  );

  readonly license$ = this.orgId$.pipe(
    switchMap(orgId => toLoadable(this.licensesRepository.getLicenseForOrg(orgId))),
    shareReplay(1)
  );

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

  ensureStoreInOrg(storeId: string): Observable<boolean> {
    return this.orgId$.pipe(
      take(1),
      switchMap(orgId =>
        this.storesRepository.getStore(storeId).pipe(
          map(store => store?.orgId === orgId)
        )
      )
    );
  }
}
