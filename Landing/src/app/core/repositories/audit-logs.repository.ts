import { Observable } from 'rxjs';
import { AuditLog } from '../models';

export interface AuditLogsRepository {
  listAuditLogs(orgId?: string): Observable<AuditLog[]>;
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Observable<AuditLog>;
}
