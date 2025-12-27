import { Service } from 'typedi';
import { BaseRepository } from './base.repository';

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

@Service()
export class UserRepository extends BaseRepository {
  protected override get tableName(): string {
    return 'users';
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('id, email, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('id, email, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}

