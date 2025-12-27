import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment.development';

@Injectable({
    providedIn: 'root'
})
export class LicenseeService {
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

    async getLicensees() {
        if (!this.supabase) {
            console.warn('Supabase no inicializado');
            return [];
        }
        const { data, error } = await this.supabase
            .schema('public')
            .from('licensees') 
            .select('*');
        if (error) {
            console.error('Error fetching licensees:', error);
            return [];
        }
        return data;
    }
    
}

