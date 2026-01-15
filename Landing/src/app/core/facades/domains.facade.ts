import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap, shareReplay } from 'rxjs/operators';
import { Domain } from '../models';
import { DOMAINS_REPOSITORY } from '../repositories';
import { StoreContextFacade } from './store-context.facade';
import { Loadable, toLoadable } from '../../shared/utils/loadable';
import { normalizeDomain, getDomainValidationError } from '../../shared/validators/domain-validator';
import { DomainError } from '../types/domain-error';

export interface DomainsViewModel {
  domains: Domain[];
  limitReached: boolean;
  maxDomains: number;
}

@Injectable({ providedIn: 'root' })
export class DomainsFacade {
  private readonly domainsRepo = inject(DOMAINS_REPOSITORY);
  private readonly storeContext = inject(StoreContextFacade);

  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);

  readonly vm$: Observable<Loadable<DomainsViewModel>> = this.storeContext.activeStoreId$.pipe(
    switchMap((storeId) => {
      if (!storeId) {
        return of<Loadable<DomainsViewModel>>({
          state: 'empty',
          data: { domains: [], limitReached: false, maxDomains: 0 },
        });
      }

      return this.refreshTrigger$.pipe(
        switchMap(() =>
          toLoadable(
            this.domainsRepo.listDomains(storeId).pipe(
              map((domains) => ({
                domains,
                limitReached: false, // Will be set on add failure
                maxDomains: 20, // TODO: Get from license limits
              }))
            ),
            (vm) => vm.domains.length === 0
          )
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  loadDomains(): void {
    this.refreshTrigger$.next();
  }

  addDomain(domain: string): Observable<Domain> {
    // Normalize and validate
    const normalized = normalizeDomain(domain);
    const validationError = getDomainValidationError(domain);

    if (validationError) {
      throw DomainError.validation(validationError);
    }

    return this.storeContext.activeStoreId$.pipe(
      switchMap((storeId) => {
        if (!storeId) {
          throw DomainError.validation('No active store selected');
        }

        return this.domainsRepo.addDomain(storeId, normalized).pipe(
          tap(() => {
            // Refresh list after successful add
            this.refreshTrigger$.next();
          })
        );
      })
    );
  }

  removeDomain(domainId: string): Observable<void> {
    return this.domainsRepo.removeDomain(domainId).pipe(
      tap(() => {
        // Refresh list after successful removal
        this.refreshTrigger$.next();
      })
    );
  }
}

