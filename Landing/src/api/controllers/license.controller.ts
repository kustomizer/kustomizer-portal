import { Service } from 'typedi';
import { Request, Response } from 'express';
import { LicenseService } from '../services/license.service';
import { LicenseValidationRequest } from '../types/license';
import { createSuccessResponse, createErrorResponse, ApiException } from '../types/errors';

@Service()
export class LicenseController {
  constructor(private licenseService: LicenseService) { }

  async validate(req: Request, res: Response): Promise<void> {
    try {
      const body: LicenseValidationRequest = req.body;

      if (!body.key) {
        res.status(400).json(
          createErrorResponse(400, 'License key is required')
        );
        return;
      }

      const result = await this.licenseService.validateLicense(body);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('[LicenseController] Error:', error);
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

