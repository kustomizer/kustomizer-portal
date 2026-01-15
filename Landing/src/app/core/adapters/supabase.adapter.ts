import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseAdapter {
  readonly supabaseUrl = environment.supabaseUrl;
  readonly supabaseAnonKey = environment.supabaseKey;

  constructor() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('[SupabaseAdapter] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }
  }

  async getSession(): Promise<unknown> {
    throw new Error('SupabaseAdapter.getSession not implemented');
  }

  async fetchLicenses(): Promise<unknown> {
    throw new Error('SupabaseAdapter.fetchLicenses not implemented');
  }

  async fetchStores(): Promise<unknown> {
    throw new Error('SupabaseAdapter.fetchStores not implemented');
  }
}
