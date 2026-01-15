import { Injectable, inject } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, shareReplay } from 'rxjs/operators';
import { License } from '../models';
import { Tier } from '../types/enums';
import { LICENSES_REPOSITORY } from '../repositories';
import { StoreContextFacade } from './store-context.facade';
import { Loadable, toLoadable } from '../../shared/utils/loadable';
import {
  getLicenseStatusLabel,
  getTierLabel,
  getExpirationLabel,
} from '../../shared/utils/enum-labels';

export interface LicenseViewModel {
  license: License | null;
  tierLabel: string;
  statusLabel: string;
  expiresIn: string;
  limits: {
    stores: number;
    domainsPerStore: number;
    seats: number;
  };
}

@Injectable({ providedIn: 'root' })
export class LicenseFacade {
  private readonly licensesRepo = inject(LICENSES_REPOSITORY);
  private readonly storeContext = inject(StoreContextFacade);

  readonly vm$: Observable<Loadable<LicenseViewModel>> = this.storeContext.activeStoreId$.pipe(
    switchMap((storeId) => {
      if (!storeId) {
        return of<Loadable<LicenseViewModel>>({
          state: 'empty',
          data: this.createEmptyViewModel(),
        });
      }

      return toLoadable(
        this.licensesRepo.getLicenseByStore(storeId).pipe(
          map((license) => {
            if (!license) {
              return this.createEmptyViewModel();
            }

            return {
              license,
              tierLabel: getTierLabel(license.tier),
              statusLabel: getLicenseStatusLabel(license.status),
              expiresIn: getExpirationLabel(license.expiresAt),
              limits: {
                stores: license.limits.stores || 0,
                domainsPerStore: license.limits.domainsPerStore || 0,
                seats: license.limits.seats || 0,
              },
            };
          })
        ),
        (vm) => vm.license === null
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  updateTier(newTier: Tier): Observable<License> {
    return this.storeContext.activeStoreId$.pipe(
      switchMap((storeId) => {
        if (!storeId) {
          throw new Error('No active store');
        }

        // If updateTier method exists on repo, use it
        if (this.licensesRepo.updateTier) {
          return this.licensesRepo.updateTier(storeId, newTier);
        }

        // Otherwise, fetch license and update via updateLicense
        return this.licensesRepo.getLicenseByStore(storeId).pipe(
          switchMap((license) => {
            if (!license) {
              throw new Error('License not found');
            }
            return this.licensesRepo.updateLicense(license.id, { tier: newTier });
          })
        );
      })
    );
  }

  private createEmptyViewModel(): LicenseViewModel {
    return {
      license: null,
      tierLabel: 'None',
      statusLabel: 'No License',
      expiresIn: 'N/A',
      limits: {
        stores: 0,
        domainsPerStore: 0,
        seats: 0,
      },
    };
  }
}

