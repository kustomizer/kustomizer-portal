import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-portal-tier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <h2>Change tier</h2>
      <p>Upgrade when you are ready. Billing is not active in this MVP.</p>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Starter</h3>
        <p class="price">$29 / month</p>
        <ul>
          <li>1 store</li>
          <li>3 domains per store</li>
          <li>Email support</li>
        </ul>
        <button type="button" (click)="notify()">Choose Starter</button>
      </div>
      <div class="card highlight">
        <div class="badge">Popular</div>
        <h3>Growth</h3>
        <p class="price">$99 / month</p>
        <ul>
          <li>3 stores</li>
          <li>10 domains per store</li>
          <li>Priority support</li>
        </ul>
        <button type="button" (click)="notify()">Upgrade to Growth</button>
      </div>
      <div class="card">
        <h3>Enterprise</h3>
        <p class="price">Custom</p>
        <ul>
          <li>Unlimited stores</li>
          <li>Unlimited domains</li>
          <li>Dedicated CSM</li>
        </ul>
        <button type="button" (click)="notify('Contact sales for Enterprise')">Contact sales</button>
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        margin-bottom: 2rem;
      }

      .grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
        position: relative;
      }

      .card.highlight {
        border-color: var(--primary);
        box-shadow: var(--shadow-strong);
      }

      .badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--primary);
        color: #0a0d10;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.7rem;
        text-transform: uppercase;
      }

      .price {
        font-size: 1.4rem;
        font-weight: 600;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.4rem;
        color: var(--muted);
      }

      button {
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        cursor: pointer;
        padding: 0.7rem 1rem;
      }
    `,
  ],
})
export class PortalTierComponent {
  notify(message = 'Billing is coming soon. Reach out for upgrades.'): void {
    window.alert(message);
  }
}
