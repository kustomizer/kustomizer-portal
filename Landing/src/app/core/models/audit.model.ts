export type AuditEntityType =
  | 'organization'
  | 'membership'
  | 'invitation'
  | 'license'
  | 'store'
  | 'domain';

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
