import { Injectable, inject } from '@angular/core';
import { shareReplay } from 'rxjs/operators';
import { AUDIT_LOGS_REPOSITORY } from '../repositories';
import { toLoadable } from '../../shared/utils/loadable';

@Injectable({ providedIn: 'root' })
export class AdminAuditFacade {
  private readonly auditRepository = inject(AUDIT_LOGS_REPOSITORY);

  readonly auditLogs$ = toLoadable(this.auditRepository.listAuditLogs(), logs => logs.length === 0).pipe(
    shareReplay(1)
  );
}
