import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-portal-install',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="redirect-card">
      <div class="icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
      </div>
      <h2>Documentation has moved</h2>
      <p>
        The installation guide, configuration reference, and all developer documentation
        is now available in a dedicated docs page.
      </p>
      <a class="btn-docs" href="/docs" target="_blank" rel="noopener">
        Go to Documentation
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="arrow">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
    }

    .redirect-card {
      text-align: center;
      max-width: 440px;
      padding: 2.5rem 2rem;
      border: 1px solid var(--border);
      border-radius: 20px;
      background: var(--card);
    }

    .icon-wrap {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.25rem;
      border-radius: 14px;
      background: rgba(46, 222, 191, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-wrap svg {
      width: 28px;
      height: 28px;
      color: var(--primary);
    }

    h2 {
      margin: 0 0 0.5rem;
    }

    p {
      color: var(--muted);
      margin: 0 0 1.5rem;
      line-height: 1.6;
    }

    .btn-docs {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.7rem 1.3rem;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--primary-strong));
      color: #041019;
      font-weight: 700;
      text-decoration: none;
      transition: transform 120ms ease, box-shadow 200ms ease;
    }

    .btn-docs:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px hsla(175, 80%, 50%, 0.35);
    }

    .arrow {
      width: 16px;
      height: 16px;
    }
  `],
})
export class PortalInstallComponent {}
