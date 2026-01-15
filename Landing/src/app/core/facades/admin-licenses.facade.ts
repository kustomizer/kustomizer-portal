import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';
import { LICENSES_REPOSITORY } from '../repositories';
import { toLoadable } from '../../shared/utils/loadable';
import { License } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminLicensesFacade {
  private readonly licensesRepository = inject(LICENSES_REPOSITORY);
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  readonly licenses$ = this.refreshSubject.pipe(
    switchMap(() => toLoadable(this.licensesRepository.listLicenses(), licenses => licenses.length === 0)),
    shareReplay(1)
  );

  updateLicense(id: string, changes: Partial<License>): Observable<License> {
    return this.licensesRepository.updateLicense(id, changes).pipe(
      tap(() => this.refreshSubject.next(undefined))
    );
  }
}
