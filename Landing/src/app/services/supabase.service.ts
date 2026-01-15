import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private _client: SupabaseClient | null = null;
    private _initialized = false;
    private _initializationError: Error | null = null;

    get client(): SupabaseClient {
        if (!this._client && !this._initializationError) {
            this.initialize();
        }

        if (this._initializationError) {
            throw this._initializationError;
        }

        if (!this._client) {
            throw new Error('Supabase client failed to initialize');
        }

        return this._client;
    }

    get isInitialized(): boolean {
        return this._initialized && this._client !== null;
    }

    private initialize(): void {
        if (this._initialized) {
            return;
        }

        try {
            const { supabaseUrl, supabaseKey } = environment;

            if (!supabaseUrl || !supabaseKey) {
                const error = new Error('Supabase URL or Key not configured in environment');
                this._initializationError = error;
                console.error('[SupabaseService]', error.message);
                throw error;
            }

            this._client = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                },
            });

            this._initialized = true;
            console.log('[SupabaseService] Client initialized successfully');
        } catch (error) {
            this._initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
            console.error('[SupabaseService] Initialization failed:', this._initializationError);
            throw this._initializationError;
        }
    }

    async getUsers() {
        try {
            const { data, error } = await this.client
                .schema('public')
                .from('users')
                .select('*');

            if (error) {
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('[SupabaseService] Error fetching users:', error);
            return [];
        }
    }
}
