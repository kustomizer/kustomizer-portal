import { Injectable, inject } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { toLoadable } from '../../shared/utils/loadable';
import { LICENSES_REPOSITORY, ORGANIZATIONS_REPOSITORY, STORES_REPOSITORY } from '../repositories';
import { AuthFacade } from './auth.facade';

@Injectable({ providedIn: 'root' })
export class AdminOrgDetailFacade {
  private readonly organizations = inject(ORGANIZATIONS_REPOSITORY);
  private readonly licenses = inject(LICENSES_REPOSITORY);
  private readonly stores = inject(STORES_REPOSITORY);
  private readonly auth = inject(AuthFacade);

  org(orgId: string) {
    return toLoadable(this.organizations.getOrganization(orgId), org => !org);
  }

  license(orgId: string) {
    return toLoadable(this.licenses.getLicenseForOrg(orgId));
  }

  storesForOrg(orgId: string) {
    return toLoadable(this.stores.listStores(orgId), stores => stores.length === 0);
  }

  members(orgId: string) {
    return toLoadable(
      combineLatest([
        this.organizations.listMemberships(orgId),
        this.auth.listUsers(),
      ]).pipe(
        map(([memberships, users]) =>
          memberships.map(member => ({
            ...member,
            user: users.find(user => user.id === member.userId) ?? null,
          }))
        )
      ),
      members => members.length === 0
    ).pipe(shareReplay(1));
  }
}
