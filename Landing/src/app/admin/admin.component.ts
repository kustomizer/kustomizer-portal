import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <h1>Admin</h1>
      <p>Backoffice coming soon...</p>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class AdminComponent { }

