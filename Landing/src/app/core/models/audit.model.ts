export type AuditEntityType =
  | 'license'
  | 'store'
  | 'store_user';

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  timestamp: string;
  summary: string;
  diff?: string;
}
