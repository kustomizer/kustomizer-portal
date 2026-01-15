import { Injectable, inject } from '@angular/core';
import { map, filter, shareReplay, switchMap } from 'rxjs/operators';
import { AuthFacade } from './auth.facade';
import { STORES_REPOSITORY } from '../repositories';
import { toLoadable } from '../../shared/utils/loadable';

@Injectable({ providedIn: 'root' })
export class PortalStoresFacade {
  private readonly auth = inject(AuthFacade);
  private readonly storesRepository = inject(STORES_REPOSITORY);

  private readonly orgId$ = this.auth.session$.pipe(
    map(session => session?.orgId),
    filter((orgId): orgId is string => Boolean(orgId)),
    shareReplay(1)
  );

  readonly stores$ = this.orgId$.pipe(
    switchMap(orgId => toLoadable(this.storesRepository.listStores(orgId), stores => stores.length === 0)),
    shareReplay(1)
  );
}
