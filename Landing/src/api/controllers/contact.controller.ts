import { Service } from 'typedi';
import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import { ContactRequest } from '../types/contact';
import { createSuccessResponse, createErrorResponse, ApiException } from '../types/errors';

@Service()
export class ContactController {
  constructor(private contactService: ContactService) { }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const body: ContactRequest = req.body;

      if (!body.name || !body.email) {
        res.status(400).json(
          createErrorResponse(400, 'Name and email are required')
        );
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        res.status(400).json(
          createErrorResponse(400, 'Invalid email format')
        );
        return;
      }

      const result = await this.contactService.submitContactForm(body);
      res.status(201).json(createSuccessResponse(result));
    } catch (error) {
      console.error('[ContactController] Error:', error);
      if (error instanceof ApiException) {
        res.status(error.statusCode).json(createErrorResponse(
          error.statusCode,
          error.message,
          error.details
        ));
        return;
      }
      res.status(500).json(
        createErrorResponse(500, 'Internal server error', error)
      );
    }
  }
}

