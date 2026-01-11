import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';
import { ORGANIZATIONS_REPOSITORY } from '../repositories';
import { toLoadable } from '../../shared/utils/loadable';
import { Organization } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminOrgsFacade {
  private readonly organizations = inject(ORGANIZATIONS_REPOSITORY);
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  readonly organizations$ = this.refreshSubject.pipe(
    switchMap(() => toLoadable(this.organizations.listOrganizations(), orgs => orgs.length === 0)),
    shareReplay(1)
  );

  createOrganization(name: string): Observable<Organization> {
    return this.organizations.createOrganization(name).pipe(
      tap(() => this.refreshSubject.next(undefined))
    );
  }

  updateOrganization(id: string, changes: Partial<Organization>): Observable<Organization> {
    return this.organizations.updateOrganization(id, changes).pipe(
      tap(() => this.refreshSubject.next(undefined))
    );
  }

  deleteOrganization(id: string): Observable<void> {
    return this.organizations.deleteOrganization(id).pipe(
      tap(() => this.refreshSubject.next(undefined))
    );
  }
}
