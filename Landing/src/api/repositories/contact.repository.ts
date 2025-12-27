import { Service } from 'typedi';
import { BaseRepository } from './base.repository';
import { ContactRequest } from '../types/contact';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  platform: string | null;
  stack: string | null;
  gmv: string | null;
  notes: string | null;
  created_at: string;
}

@Service()
export class ContactRepository extends BaseRepository {
  protected override get tableName(): string {
    return 'contact_submissions';
  }

  async create(data: ContactRequest): Promise<ContactSubmission> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        platform: data.platform || null,
        stack: data.stack || null,
        gmv: data.gmv || null,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }
}

