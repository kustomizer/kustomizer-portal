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
              statusLabel: getLicenseStatusLabel(license.active, license.expiresAt),
              expiresIn: getExpirationLabel(license.expiresAt ?? undefined),
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
          return this.licensesRepo.getLicenseByStore(storeId).pipe(
            switchMap((license) => {
              if (!license) {
                throw new Error('License not found');
              }
              return this.licensesRepo.updateTier!(license.id, newTier);
            })
          );
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
    };
  }
}
