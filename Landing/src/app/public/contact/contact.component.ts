import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  readonly currentYear = new Date().getFullYear();
  readonly contactEmail = environment.publicDemoEmail;
}
