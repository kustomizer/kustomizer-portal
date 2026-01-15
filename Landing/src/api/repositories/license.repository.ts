import { Service } from 'typedi';
import { BaseRepository } from './base.repository';
import { License, LicenseStatus, LicenseUpdatePayload } from '../types/license';

@Service()
export class LicenseRepository extends BaseRepository {
  protected override get tableName(): string {
    return 'licenses';
  }

  async findByKey(key: string): Promise<License | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  async findByUserId(userId: string): Promise<License | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async findAll(): Promise<License[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async update(id: string, updates: LicenseUpdatePayload): Promise<License> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('License not found');
      }
      throw error;
    }

    return data;
  }

  async updateKey(id: string, newKey: string): Promise<License> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ key: newKey })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateStatus(id: string, status: LicenseStatus): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}

