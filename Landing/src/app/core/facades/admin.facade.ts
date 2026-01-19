import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, tap, shareReplay } from 'rxjs/operators';
import { Store, License } from '../models';
import { Tier } from '../types/enums';
import { ADMIN_REPOSITORY } from '../repositories';
import { AdminStoreDetail } from '../repositories/admin.repository';
import { Loadable, toLoadable } from '../../shared/utils/loadable';
import { getLicenseStatusLabel, getTierLabel } from '../../shared/utils/enum-labels';

export interface AdminStoreViewModel extends Store {
  licenseStatus?: string;
  licenseTier?: string;
}

export interface AdminStoresViewModel {
  stores: AdminStoreViewModel[];
}

export interface AdminStoreDetailViewModel extends AdminStoreDetail {
  licenseStatusLabel?: string;
  licenseTierLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminFacade {
  private readonly adminRepo = inject(ADMIN_REPOSITORY);

  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private readonly selectedStoreIdSubject = new BehaviorSubject<string | null>(null);

  readonly stores$: Observable<Loadable<AdminStoresViewModel>> = this.refreshTrigger$.pipe(
    switchMap(() =>
      toLoadable(
        this.adminRepo.listAllStores().pipe(
          map((stores) => ({
            stores: stores.map((s) => ({ ...s, licenseStatus: undefined, licenseTier: undefined })),
          }))
        ),
        (vm) => vm.stores.length === 0
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly selectedStoreDetail$: Observable<Loadable<AdminStoreDetailViewModel>> =
    this.selectedStoreIdSubject.pipe(
      switchMap((storeId) => {
        if (!storeId) {
          return [{ state: 'empty' as const }];
        }

        return toLoadable(
          this.adminRepo.getStoreDetail(storeId).pipe(
            map((detail) => ({
              ...detail,
              licenseStatusLabel: detail.license
                ? getLicenseStatusLabel(detail.license.active, detail.license.expiresAt)
                : undefined,
              licenseTierLabel: detail.license ? getTierLabel(detail.license.tier) : undefined,
            }))
          )
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  loadStores(): void {
    this.refreshTrigger$.next();
  }

  selectStore(storeId: string): void {
    this.selectedStoreIdSubject.next(storeId);
  }

  updateLicense(
    licenseId: string,
    changes: {
      tier?: Tier;
      expiresAt?: string | null;
    }
  ): Observable<License> {
    return this.adminRepo.updateLicense(licenseId, changes).pipe(
      tap(() => {
        // Refresh the selected store detail
        const storeId = this.selectedStoreIdSubject.value;
        if (storeId) {
          this.selectedStoreIdSubject.next(storeId);
        }
      })
    );
  }

  updateStore(storeId: string, changes: Partial<Store>): Observable<Store> {
    return this.adminRepo.updateStore(storeId, changes).pipe(
      tap(() => {
        // Refresh stores list and detail
        this.refreshTrigger$.next();
        if (this.selectedStoreIdSubject.value === storeId) {
          this.selectedStoreIdSubject.next(storeId);
        }
      })
    );
  }

  isAdmin(): Observable<boolean> {
    return this.adminRepo.isAdmin();
  }
}
