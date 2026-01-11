import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminOrgsFacade } from '../../../core/facades/admin-orgs.facade';

@Component({
  selector: 'app-admin-orgs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Organizations</h2>
        <p>Manage tenants and their access in the Kustomizer platform.</p>
      </div>
    </div>

    <form class="card form" [formGroup]="orgForm" (ngSubmit)="createOrg()">
      <div>
        <label>Organization name</label>
        <input formControlName="name" placeholder="e.g. Nova Commerce" />
      </div>
      <button type="submit" [disabled]="orgForm.invalid || creating">
        {{ creating ? 'Creating...' : 'Create org' }}
      </button>
    </form>

    <ng-container *ngIf="organizations$ | async as orgsState">
      <div *ngIf="orgsState.state === 'loading'" class="state">Loading organizations...</div>
      <div *ngIf="orgsState.state === 'error'" class="state error">{{ orgsState.error }}</div>
      <div *ngIf="orgsState.state === 'empty'" class="state">No organizations found.</div>
      <div *ngIf="orgsState.state === 'ready'" class="grid">
        <div class="card" *ngFor="let org of orgsState.data ?? []">
          <div>
            <h3>{{ org.name }}</h3>
            <p>Created {{ org.createdAt | date: 'mediumDate' }}</p>
          </div>
          <div class="actions">
            <a [routerLink]="['/admin/orgs', org.id]">View</a>
            <button type="button" class="ghost" (click)="renameOrg(org.id, org.name)">Rename</button>
            <button type="button" class="ghost danger" (click)="deleteOrg(org.id)">
              Delete
            </button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .header {
        margin-bottom: 1.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.25rem;
        display: grid;
        gap: 1rem;
      }

      .form {
        margin-bottom: 1.5rem;
        grid-template-columns: 1fr 160px;
        align-items: end;
      }

      label {
        display: block;
        font-size: 0.75rem;
        color: var(--muted);
        margin-bottom: 0.35rem;
      }

      input {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        padding: 0.6rem 0.8rem;
        color: var(--foreground);
      }

      button,
      a {
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        cursor: pointer;
        padding: 0.6rem 0.9rem;
        text-align: center;
      }

      .ghost {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--foreground);
      }

      .ghost.danger {
        color: var(--danger);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }

      @media (max-width: 720px) {
        .form {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminOrgsComponent {
  private readonly facade = inject(AdminOrgsFacade);
  private readonly formBuilder = inject(FormBuilder);

  readonly organizations$ = this.facade.organizations$;
  creating = false;

  readonly orgForm = this.formBuilder.group({
    name: ['', Validators.required],
  });

  createOrg(): void {
    if (this.orgForm.invalid) {
      return;
    }
    const { name } = this.orgForm.getRawValue();
    if (!name) {
      return;
    }
    this.creating = true;
    this.facade
      .createOrganization(name)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(() => this.orgForm.reset({ name: '' }));
  }

  renameOrg(orgId: string, currentName: string): void {
    const name = prompt('New organization name', currentName);
    if (!name || name === currentName) {
      return;
    }
    this.facade.updateOrganization(orgId, { name }).subscribe();
  }

  deleteOrg(orgId: string): void {
    if (!confirm('Delete this organization and all related data?')) {
      return;
    }
    this.facade.deleteOrganization(orgId).subscribe();
  }
}
