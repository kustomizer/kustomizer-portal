import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-portal-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <h2>Installation</h2>
      <p>Follow these steps to install the Kustomizer SDK in your Angular storefront.</p>
    </div>

    <div class="card">
      <ol>
        <li>
          <strong>Install the SDK</strong>
          <pre><code>npm i @kustomizer/sdk</code></pre>
        </li>
        <li>
          <strong>Initialize in Angular</strong>
          <pre><code [innerText]="initSnippet"></code></pre>
        </li>
        <li>
          <strong>Connect your store</strong>
          <p>Once installed, the store will appear in this portal within minutes.</p>
        </li>
      </ol>
      <div class="note">
        This is a placeholder flow for the MVP; no real SDK calls are executed.
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        margin-bottom: 1.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
      }

      ol {
        display: grid;
        gap: 1.5rem;
        margin: 0;
        padding-left: 1.5rem;
      }

      pre {
        background: rgba(0, 0, 0, 0.4);
        padding: 0.75rem;
        border-radius: 12px;
        overflow-x: auto;
      }

      .note {
        margin-top: 1.5rem;
        color: var(--muted);
      }
    `,
  ],
})
export class PortalInstallComponent {
  readonly initSnippet = `import { provideKustomizer } from '@kustomizer/sdk';

bootstrapApplication(AppComponent, {
  providers: [
    provideKustomizer({
      storefrontId: 'your-storefront-id',
      apiKey: 'pk_live_xxx',
    })
  ]
});`;
}
