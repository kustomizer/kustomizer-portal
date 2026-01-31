import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-terms',
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
            <h1>Terms of Service</h1>
            <p class="lead">Last updated: 2026-01-30</p>

            <div class="legal">
              <p>
                These Terms of Service ("Terms") govern your access to and use of the Kustomizer website,
                client portal, and related services (the "Service"). By using the Service, you agree to
                these Terms.
              </p>

              <h2>Accounts</h2>
              <ul>
                <li>You must provide accurate information and keep it up to date.</li>
                <li>You are responsible for safeguarding your credentials.</li>
                <li>You are responsible for activity performed under your account.</li>
              </ul>

              <h2>Shopify connection</h2>
              <p>
                The Service is designed to be used with Shopify stores. When you install/connect the
                Kustomizer Shopify app and authorize access, you grant us permission to access Shopify data
                as allowed by the scopes you approve. You are responsible for ensuring you have the right
                to connect the store and to grant those permissions.
              </p>

              <h2>Your data</h2>
              <ul>
                <li>You retain ownership of your store data and content.</li>
                <li>
                  You grant us a limited license to process your data solely to operate and provide the
                  Service.
                </li>
              </ul>

              <h2>Acceptable use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for unlawful, harmful, or abusive activities.</li>
                <li>Attempt unauthorized access to accounts, systems, or data.</li>
                <li>Interfere with or disrupt the Service, including rate-limit bypassing.</li>
                <li>Upload or transmit malicious code.</li>
              </ul>

              <h2>Fees and billing</h2>
              <p>
                Fees (if any) and billing terms will be presented to you during onboarding or in the
                Service. Unless otherwise stated, fees are non-refundable.
              </p>

              <h2>Availability and changes</h2>
              <p>
                We aim for reliable operation, but the Service may experience interruptions, maintenance,
                or outages. We may change or discontinue features at any time.
              </p>

              <h2>Intellectual property</h2>
              <p>
                The Service, including its software, design, and branding, is owned by Kustomizer and its
                licensors. These Terms do not grant you any rights to our trademarks or intellectual
                property except as necessary to use the Service.
              </p>

              <h2>Disclaimer</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS
                OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h2>Limitation of liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, KUSTOMIZER WILL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE,
                DATA, OR GOODWILL.
              </p>

              <h2>Termination</h2>
              <p>
                You may stop using the Service at any time. We may suspend or terminate access to the
                Service if we reasonably believe you have violated these Terms or if necessary to protect
                the Service or other users.
              </p>

              <h2>Contact</h2>
              <p>
                Questions about these Terms can be sent to
                <a [href]="'mailto:' + contactEmail">{{ contactEmail }}</a> or via the
                <a routerLink="/contact">contact page</a>.
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
export class TermsComponent {
  readonly contactEmail = environment.publicDemoEmail;
}
