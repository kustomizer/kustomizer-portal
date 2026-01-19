import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-portal-install',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header">
      <h2>Installation Guide</h2>
      <p>Get started with Kustomizer in minutes</p>
    </div>

    <section class="card">
      <h3>1. Install the NPM Package</h3>
      <p class="muted">Add Kustomizer to your project using npm or yarn:</p>
      <div class="code-block">
        <code>npm install @kustomizer/client</code>
        <button type="button" (click)="copy('npm install @kustomizer/client')" class="btn-copy">
          {{ copied === 'npm' ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div class="code-block">
        <code>yarn add @kustomizer/client</code>
        <button type="button" (click)="copy('yarn add @kustomizer/client', 'yarn')" class="btn-copy">
          {{ copied === 'yarn' ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </section>

    <section class="card">
      <h3>2. Initialize in Your App</h3>
      <p class="muted">Import and configure Kustomizer with your store domain and user email:</p>
      <div class="code-block large">
        <pre><code>import &#123; KustomizerClient &#125; from '@kustomizer/client';

const kustomizer = new KustomizerClient(&#123;
  domain: 'your-store-domain.com',
  domain: window.location.hostname
&#125;);

// Fetch your customizations
const config = await kustomizer.getConfig();
console.log(config);</code></pre>
        <button type="button" (click)="copy(initCode)" class="btn-copy">
          {{ copied === 'init' ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </section>

    <section class="card">
      <h3>3. Apply Customizations</h3>
      <p class="muted">Use the fetched configuration to customize your storefront:</p>
      <div class="code-block large">
        <pre><code>// Apply theme colors
document.documentElement.style.setProperty('--primary-color', config.theme.primaryColor);

// Show/hide features
if (config.features.showReviews) &#123;
  document.getElementById('reviews').style.display = 'block';
&#125;

// Load custom CSS
if (config.customCSS) &#123;
  const style = document.createElement('style');
  style.textContent = config.customCSS;
  document.head.appendChild(style);
&#125;</code></pre>
        <button type="button" (click)="copy(applyCode)" class="btn-copy">
          {{ copied === 'apply' ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </section>

    <section class="card">
      <h3>4. Invite Team Members</h3>
      <p class="muted">
        Add team members in the <a routerLink="/app/team">Team</a> section so they can access the
        Kustomizer editor with their email.
      </p>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div>
            <strong>Go to Team</strong>
            <p>Open your team management screen</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div>
            <strong>Add team member</strong>
            <p>Enter their email and assign a role</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div>
            <strong>Start editing</strong>
            <p>Admins and read-only users authenticate with domain + email</p>
          </div>
        </div>
      </div>
    </section>

    <div class="info-box">
      <h4>📚 Additional Resources</h4>
      <ul>
        <li><a href="#" target="_blank">Full Documentation</a></li>
        <li><a href="#" target="_blank">Code Examples</a></li>
        <li><a href="#" target="_blank">Support & FAQ</a></li>
      </ul>
    </div>
  `,
  styles: [
    `
      .header {
        margin-bottom: 2rem;
      }

      .header p {
        color: var(--muted);
        margin-top: 0.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 1.5rem;
      }

      .card h3 {
        margin: 0 0 0.75rem 0;
      }

      .muted {
        color: var(--muted);
        margin: 0 0 1rem 0;
      }

      .code-block {
        position: relative;
        padding: 1rem;
        border-radius: 12px;
        background: #1a1a1a;
        border: 1px solid var(--border);
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .code-block.large {
        padding: 1.5rem;
      }

      .code-block code {
        flex: 1;
        color: #e2e8f0;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
      }

      .code-block pre {
        margin: 0;
        overflow-x: auto;
      }

      .code-block pre code {
        display: block;
        line-height: 1.6;
      }

      .btn-copy {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity 0.2s;
      }

      .btn-copy:hover {
        opacity: 0.9;
      }

      .steps {
        display: grid;
        gap: 1rem;
      }

      .step {
        display: flex;
        gap: 1rem;
        align-items: start;
        padding: 1rem;
        border-radius: 12px;
        background: var(--card-soft);
      }

      .step-number {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: var(--primary);
        color: #0a0d10;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        flex-shrink: 0;
      }

      .step strong {
        display: block;
        margin-bottom: 0.25rem;
      }

      .step p {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .info-box {
        padding: 1.5rem;
        border-radius: 16px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid #3b82f6;
      }

      .info-box h4 {
        margin: 0 0 1rem 0;
        color: #3b82f6;
      }

      .info-box ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      .info-box li {
        margin-bottom: 0.5rem;
      }

      .info-box a {
        color: #3b82f6;
        text-decoration: underline;
      }

      .info-box a:hover {
        color: #60a5fa;
      }

      @media (max-width: 768px) {
        .code-block {
          flex-direction: column;
          align-items: stretch;
        }

        .btn-copy {
          width: 100%;
        }
      }
    `,
  ],
})
export class PortalInstallComponent {
  copied: string | null = null;

  readonly initCode = `import { KustomizerClient } from '@kustomizer/client';

const domain = window.location.hostname;
const email = 'owner@yourstore.com';

const authResponse = await fetch(\`\${SUPABASE_URL}/functions/v1/kustomizer_auth\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain, email }),
});

const { license } = await authResponse.json();
if (!license.active) {
  throw new Error('License inactive or expired');
}

const kustomizer = new KustomizerClient({ domain, email });
const config = await kustomizer.getConfig();
console.log(config);`;

  readonly applyCode = `// Apply theme colors
document.documentElement.style.setProperty('--primary-color', config.theme.primaryColor);

// Show/hide features
if (config.features.showReviews) {
  document.getElementById('reviews').style.display = 'block';
}

// Load custom CSS
if (config.customCSS) {
  const style = document.createElement('style');
  style.textContent = config.customCSS;
  document.head.appendChild(style);
}`;

  copy(text: string, id: string = 'npm'): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied = id;
      setTimeout(() => (this.copied = null), 2000);
    });
  }
}
