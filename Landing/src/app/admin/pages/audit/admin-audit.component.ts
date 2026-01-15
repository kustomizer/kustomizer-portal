import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AdminAuditFacade } from '../../../core/facades/admin-audit.facade';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <div>
        <h2>Audit logs</h2>
        <p>Track changes across licenses, stores, and domains.</p>
      </div>
    </div>

    <ng-container *ngIf="auditLogs$ | async as auditState">
      <div *ngIf="auditState.state === 'loading'" class="state">Loading audit logs...</div>
      <div *ngIf="auditState.state === 'error'" class="state error">{{ auditState.error }}</div>
      <div *ngIf="auditState.state === 'empty'" class="state">No audit events yet.</div>
      <div *ngIf="auditState.state === 'ready'" class="list">
        <div class="card" *ngFor="let log of auditState.data ?? []">
          <div>
            <p class="label">{{ log.entityType | titlecase }} · {{ log.action | titlecase }}</p>
            <h3>{{ log.summary }}</h3>
            <p class="meta">Actor {{ log.actorId }} · {{ log.timestamp | date: 'medium' }}</p>
          </div>
          <span class="pill">{{ log.entityId }}</span>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .header {
        margin-bottom: 1.5rem;
      }

      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }

      .list {
        display: grid;
        gap: 1rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .label {
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.15em;
        color: var(--muted);
      }

      .meta {
        color: var(--muted);
        font-size: 0.85rem;
      }

      .pill {
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
      }
    `,
  ],
})
export class AdminAuditComponent {
  private readonly facade = inject(AdminAuditFacade);

  readonly auditLogs$ = this.facade.auditLogs$;
}
