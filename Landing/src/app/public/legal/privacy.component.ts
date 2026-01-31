import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-privacy',
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
            <h1>Privacy Policy</h1>
            <p class="lead">Last updated: 2026-01-30</p>

            <div class="legal">
              <p>
                This Privacy Policy explains how Kustomizer ("we", "us", "our") collects, uses, and shares
                information when you visit our website or use our client portal and related services
                (collectively, the "Service").
              </p>

              <h2>Information we collect</h2>
              <p>We may collect the following categories of information:</p>
              <ul>
                <li>
                  Account information: name, email address, and authentication details needed to create and
                  access your account.
                </li>
                <li>
                  Store information you provide: store name and store domain used to connect and configure
                  the Service for your Shopify store.
                </li>
                <li>
                  Shopify-related information: when you connect a Shopify store, Shopify may provide us
                  information and permissions necessary to operate the Service. The exact information depends
                  on the Shopify scopes granted during installation.
                </li>
                <li>
                  Support communications: information you send us (for example, emails, messages, and
                  troubleshooting details).
                </li>
                <li>
                  Usage and device data: basic logs and diagnostics (for example, event timestamps, pages
                  accessed, and error logs) to operate, secure, and improve the Service.
                </li>
              </ul>

              <h2>How we use information</h2>
              <ul>
                <li>Provide, operate, maintain, and improve the Service.</li>
                <li>Authenticate users and enforce role-based access within a workspace/store.</li>
                <li>Respond to support requests and communicate about onboarding and updates.</li>
                <li>Monitor for abuse, security incidents, and service reliability issues.</li>
                <li>Comply with applicable legal obligations and enforce our Terms of Service.</li>
              </ul>

              <h2>How we share information</h2>
              <p>We may share information in the following circumstances:</p>
              <ul>
                <li>
                  Service providers: we may use third-party providers (for example, hosting, authentication,
                  databases, analytics, and email tooling) to operate the Service.
                </li>
                <li>
                  Shopify: when you connect a Shopify store, data is exchanged with Shopify via their APIs to
                  provide the Service.
                </li>
                <li>
                  Legal and safety: if required by law, regulation, legal process, or to protect the rights,
                  security, or safety of our users and the Service.
                </li>
                <li>
                  Business transfers: in connection with a merger, acquisition, or sale of assets.
                </li>
              </ul>

              <h2>Cookies and local storage</h2>
              <p>
                We may use cookies and/or local storage to keep you signed in, remember preferences, and
                support core Service functionality.
              </p>

              <h2>Data retention</h2>
              <p>
                We retain information for as long as needed to provide the Service, comply with legal
                obligations, resolve disputes, and enforce agreements. You may request deletion of your
                account information, subject to retention requirements.
              </p>

              <h2>Security</h2>
              <p>
                We implement reasonable administrative, technical, and organizational measures designed to
                protect information. No method of transmission or storage is 100% secure.
              </p>

              <h2>Your rights and choices</h2>
              <p>
                Depending on your location, you may have rights to access, correct, or delete personal
                information, or object to certain processing. To request changes, contact us.
              </p>

              <h2>Contact</h2>
              <p>
                Privacy questions can be sent to <a [href]="'mailto:' + contactEmail">{{ contactEmail }}</a>
                or via the <a routerLink="/contact">contact page</a>.
              </p>

              <h2>Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will update the "Last updated" date
                above when changes are published.
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
export class PrivacyComponent {
  readonly contactEmail = environment.publicDemoEmail;
}
