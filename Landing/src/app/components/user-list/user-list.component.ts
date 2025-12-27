import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {
    
  }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.supabaseService.getUsers();
      this.error = null;
    } catch (err) {
      this.error = 'Error al cargar usuarios';
      console.error('Error:', err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
