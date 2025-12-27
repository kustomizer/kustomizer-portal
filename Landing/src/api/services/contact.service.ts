import { Service } from 'typedi';
import { ContactRepository } from '../repositories/contact.repository';
import { ContactRequest, ContactResponse } from '../types/contact';

@Service()
export class ContactService {
  constructor(private contactRepository: ContactRepository) { }

  async submitContactForm(data: ContactRequest): Promise<ContactResponse> {
    const submission = await this.contactRepository.create(data);

    return {
      id: submission.id,
      submitted_at: submission.created_at,
    };
  }
}

