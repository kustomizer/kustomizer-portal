import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { AdminOrgDetailFacade } from '../../../core/facades/admin-org-detail.facade';

@Component({
  selector: 'app-admin-org-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="orgState$ | async as orgState">
      <div *ngIf="orgState.state === 'loading'" class="state">Loading organization...</div>
      <div *ngIf="orgState.state === 'error'" class="state error">{{ orgState.error }}</div>
      <div *ngIf="orgState.state === 'empty'" class="state">Organization not found.</div>

      <div *ngIf="orgState.state === 'ready'" class="grid">
        <section class="card">
          <h2>{{ orgState.data?.name }}</h2>
          <p>Created {{ orgState.data?.createdAt | date: 'mediumDate' }}</p>
          <a class="ghost" routerLink="/admin/orgs">Back to orgs</a>
        </section>

        <section class="card" *ngIf="licenseState$ | async as licenseState">
          <h3>License</h3>
          <div *ngIf="licenseState.state === 'loading'" class="state">Loading license...</div>
          <div *ngIf="licenseState.state === 'error'" class="state error">{{ licenseState.error }}</div>
          <div *ngIf="licenseState.state === 'empty'" class="state">No license assigned.</div>
          <div *ngIf="licenseState.state === 'ready'" class="stack">
            <p>Status: {{ licenseState.data?.status | titlecase }}</p>
            <p>Tier: {{ licenseState.data?.tier | titlecase }}</p>
            <p>Expires {{ licenseState.data?.expiresAt | date: 'mediumDate' }}</p>
          </div>
        </section>

        <section class="card" *ngIf="storesState$ | async as storesState">
          <h3>Stores</h3>
          <div *ngIf="storesState.state === 'loading'" class="state">Loading stores...</div>
          <div *ngIf="storesState.state === 'error'" class="state error">{{ storesState.error }}</div>
          <div *ngIf="storesState.state === 'empty'" class="state">No stores connected.</div>
          <div *ngIf="storesState.state === 'ready'" class="list">
            <div class="list-item store-item" *ngFor="let store of storesState.data ?? []">
              <div>
                <strong>{{ store.shopDomain }}</strong>
                <p>{{ store.status | titlecase }} · Last sync {{ store.lastSyncAt | date: 'short' }}</p>
              </div>
              <a class="ghost" [routerLink]="['/admin/stores', store.id, 'domains']">Domains</a>
            </div>
          </div>
        </section>

        <section class="card" *ngIf="membersState$ | async as membersState">
          <h3>Members</h3>
          <div *ngIf="membersState.state === 'loading'" class="state">Loading members...</div>
          <div *ngIf="membersState.state === 'error'" class="state error">{{ membersState.error }}</div>
          <div *ngIf="membersState.state === 'empty'" class="state">No members yet.</div>
          <div *ngIf="membersState.state === 'ready'" class="list">
            <div class="list-item" *ngFor="let member of membersState.data ?? []">
              <div>
                <strong>{{ member.user?.name || member.userId }}</strong>
                <p>{{ member.user?.email || 'unknown' }} · {{ member.role | titlecase }}</p>
              </div>
              <span>{{ member.createdAt | date: 'mediumDate' }}</span>
            </div>
          </div>
        </section>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.25rem;
      }

      .stack {
        display: grid;
        gap: 0.4rem;
      }

      .list {
        display: grid;
        gap: 0.75rem;
        margin-top: 0.75rem;
        width: 100%;
      }

      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 0.8rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        width: 100%;
        box-sizing: border-box;
      }

      .store-item {
        display: block;
      }

      .store-item .ghost {
        margin-top: 0.5rem;
        width: fit-content;
      }

      .ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.4rem 0.8rem;
        border-radius: 10px;
        border: 1px solid var(--border);
        color: var(--foreground);
      }

      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }
    `,
  ],
})
export class AdminOrgDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(AdminOrgDetailFacade);

  private readonly orgId$ = this.route.paramMap.pipe(map(params => params.get('orgId') ?? ''));

  readonly orgState$ = this.orgId$.pipe(switchMap(orgId => this.facade.org(orgId)));
  readonly licenseState$ = this.orgId$.pipe(switchMap(orgId => this.facade.license(orgId)));
  readonly storesState$ = this.orgId$.pipe(switchMap(orgId => this.facade.storesForOrg(orgId)));
  readonly membersState$ = this.orgId$.pipe(switchMap(orgId => this.facade.members(orgId)));
}
