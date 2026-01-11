import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditLogsRepository } from '../repositories';
import { AuditLog } from '../models';
import { MockApiService } from './mock-api.service';
import { MockDataStore } from './mock-data.store';
import { createId, nowIso } from './mock-helpers';

@Injectable()
export class InMemoryAuditLogsRepository implements AuditLogsRepository {
  constructor(
    private readonly store: MockDataStore,
    private readonly api: MockApiService
  ) {}

  listAuditLogs(orgId?: string): Observable<AuditLog[]> {
    if (!orgId) {
      return this.api.simulate([...this.store.auditLogs], { failureKey: 'audit.list' });
    }
    const logs = this.store.auditLogs.filter(log => {
      if (log.entityType === 'organization' || log.entityType === 'license') {
        return log.entityId === orgId;
      }
      const store = this.store.stores.find(item => item.id === log.entityId);
      return store?.orgId === orgId;
    });
    return this.api.simulate([...logs], { failureKey: 'audit.list' });
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Observable<AuditLog> {
    const created: AuditLog = {
      ...entry,
      id: createId('log'),
      timestamp: nowIso(),
    };
    this.store.auditLogs.unshift(created);
    return this.api.simulate(created, { failureKey: 'audit.add' });
  }
}
