import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../core/facades/auth.facade';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span>Kustomizer</span>
          <small>Client Portal</small>
        </div>
        <nav>
          <a routerLink="/app/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/app/stores" routerLinkActive="active">Stores</a>
          <a routerLink="/app/tier" routerLinkActive="active">Change tier</a>
          <a routerLink="/app/team" routerLinkActive="active">Team</a>
          <a routerLink="/app/install" routerLinkActive="active">Installation</a>
        </nav>
      </aside>
      <div class="content">
        <header>
          <div class="context" *ngIf="(activeStore$ | async) as store">
            <p class="eyebrow">Store</p>
            <h2>{{ store.name }}</h2>
          </div>
          <div class="user" *ngIf="(user$ | async) as user">
            <div>
              <p class="eyebrow">Signed in</p>
              <span>{{ user.name }}</span>
            </div>
            <button type="button" (click)="logout()">Log out</button>
          </div>
        </header>
        <section class="page">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        display: grid;
        grid-template-columns: minmax(200px, 240px) 1fr;
        min-height: 100vh;
      }

      .sidebar {
        padding: 2rem 1.5rem;
        border-right: 1px solid var(--border);
        background: rgba(9, 14, 18, 0.65);
      }

      .brand {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 2rem;
      }

      .brand span {
        font-family: 'Outfit', sans-serif;
        font-size: 1.3rem;
      }

      .brand small {
        color: var(--muted);
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      nav {
        display: grid;
        gap: 0.5rem;
      }

      nav a {
        padding: 0.65rem 0.8rem;
        border-radius: 12px;
        background: transparent;
        color: var(--muted);
        border: 1px solid transparent;
        transition: all 0.2s ease;
      }

      nav a.active,
      nav a:hover {
        color: var(--foreground);
        border-color: var(--border);
        background: rgba(255, 255, 255, 0.06);
      }

      .content {
        padding: 2rem 2.5rem 3rem;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
      }

      .context h2 {
        margin: 0;
      }

      .eyebrow {
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.2em;
        color: var(--muted);
        margin-bottom: 0.35rem;
      }

      .user {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: var(--card);
        border: 1px solid var(--border);
        padding: 0.75rem 1rem;
        border-radius: 16px;
      }

      .user button {
        border: none;
        background: transparent;
        color: var(--primary);
        font-weight: 600;
        cursor: pointer;
      }

      .page {
        display: block;
      }

      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          border-right: none;
          border-bottom: 1px solid var(--border);
        }

        nav {
          grid-auto-flow: column;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }
      }
    `,
  ],
})
export class PortalComponent {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly user$ = this.auth.currentUser$;
  readonly activeStore$ = this.auth.activeStore$;

  logout(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigate(['/login']);
    });
  }
}
