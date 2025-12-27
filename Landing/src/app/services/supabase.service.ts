import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient | null = null;

    constructor() {
        const { supabaseUrl, supabaseKey } = environment;

        // Validar que las variables existan
        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase URL o Key no configuradas');
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async getUsers() {
        try {
            if (!this.supabase) {
                console.warn('Supabase no inicializado');
                return [];
            }
            const { data, error } = await this.supabase
                .schema('public')
                .from('users') // Reemplaza con tu tabla
                .select('*');

            if (error) {
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
}
