import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';

class SupabaseServerSingleton {
  private static instance: SupabaseClient | null = null;

  static getClient(): SupabaseClient {
    if (!SupabaseServerSingleton.instance) {
      const { supabaseUrl, supabaseKey } = environment;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL or Key not configured in environment');
      }

      SupabaseServerSingleton.instance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
    }

    return SupabaseServerSingleton.instance;
  }
}

export function getSupabaseClient(): SupabaseClient {
  return SupabaseServerSingleton.getClient();
}

