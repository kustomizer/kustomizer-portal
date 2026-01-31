import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="navbar">
        <div class="container nav-row">
          <a class="brand" routerLink="/">
            <span class="brand-mark">K</span>
            <span class="brand-name">Kustomizer</span>
          </a>
          <nav class="nav-links">
            <a routerLink="/">Home</a>
            <a routerLink="/contact">Contact</a>
          </nav>
        </div>
      </header>

      <main>
        <section class="section hero">
          <div class="container">
            <h1>Security</h1>
            <p class="lead">Last updated: 2026-01-30</p>

            <div class="legal">
              <p>
                Security is a core requirement for Kustomizer. This page explains how we approach security
                and how to report vulnerabilities.
              </p>

              <h2>Security practices</h2>
              <ul>
                <li>Authentication is required to access the portal.</li>
                <li>We follow a least-privilege approach for third-party integrations (including Shopify scopes).</li>
                <li>We use encryption in transit (HTTPS) for Service traffic.</li>
                <li>We monitor for errors and suspicious activity to help keep the Service reliable and safe.</li>
              </ul>

              <h2>Data handling</h2>
              <ul>
                <li>Store-related content is designed to persist in Shopify-native storage when possible (e.g. metafields).</li>
                <li>Access to operational data is restricted to authorized users and service components.</li>
              </ul>

              <h2>Vulnerability reporting</h2>
              <p>
                If you believe you have found a security vulnerability, please report it to
                <a [href]="'mailto:' + contactEmail">{{ contactEmail }}</a>.
              </p>
              <p>
                Please include a clear description of the issue, reproduction steps, and any relevant logs.
                We will acknowledge receipt and work to remediate in a reasonable timeframe.
              </p>

              <h2>Responsible disclosure</h2>
              <p>
                Please do not publicly disclose vulnerabilities until we have had a reasonable opportunity
                to investigate and address them.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .legal {
        margin-top: 1.5rem;
        max-width: 860px;
      }

      .legal h2 {
        margin-top: 1.5rem;
      }

      .legal ul {
        padding-left: 1.25rem;
      }

      .muted {
        color: var(--muted);
      }
    `,
  ],
})
export class SecurityComponent {
  readonly contactEmail = environment.publicDemoEmail;
}
