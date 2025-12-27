import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portal-container">
      <h1>Portal</h1>
      <p>Client portal coming soon...</p>
    </div>
  `,
  styles: [`
    .portal-container {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class PortalComponent { }

