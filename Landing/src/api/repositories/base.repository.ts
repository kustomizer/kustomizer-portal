import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase-server';

export abstract class BaseRepository {
  protected get client(): SupabaseClient {
    return getSupabaseClient();
  }

  protected get tableName(): string {
    throw new Error('tableName must be implemented by subclass');
  }
}

