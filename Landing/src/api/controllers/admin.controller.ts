import { Service } from 'typedi';
import { Response } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../types/auth';
import { LicenseUpdatePayload } from '../types/license';
import { createSuccessResponse, createErrorResponse, ApiException } from '../types/errors';

@Service()
export class AdminController {
  constructor(private adminService: AdminService) { }

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await this.adminService.getAllUsers();
      res.json(createSuccessResponse(users));
    } catch (error) {
      console.error('[AdminController] Error:', error);
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

  async getLicenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const licenses = await this.adminService.getAllLicenses();
      res.json(createSuccessResponse(licenses));
    } catch (error) {
      console.error('[AdminController] Error:', error);
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

  async updateLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: LicenseUpdatePayload = req.body;

      const allowedFields = ['status', 'tier', 'expires_at', 'allowlist'];
      const hasValidUpdate = Object.keys(updates).some((key) =>
        allowedFields.includes(key)
      );

      if (!hasValidUpdate) {
        res.status(400).json(
          createErrorResponse(
            400,
            `At least one of the following fields must be provided: ${allowedFields.join(', ')}`
          )
        );
        return;
      }

      const license = await this.adminService.updateLicense(id, updates);
      res.json(createSuccessResponse(license));
    } catch (error) {
      console.error('[AdminController] Error:', error);
      if (error instanceof ApiException) {
        res.status(error.statusCode).json(createErrorResponse(
          error.statusCode,
          error.message,
          error.details
        ));
        return;
      }

      if (error instanceof Error && error.message === 'License not found') {
        res.status(404).json(
          createErrorResponse(404, 'License not found')
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(500, 'Internal server error', error)
      );
    }
  }

  async rotateLicenseKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.adminService.rotateLicenseKey(id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('[AdminController] Error:', error);
      if (error instanceof ApiException) {
        res.status(error.statusCode).json(createErrorResponse(
          error.statusCode,
          error.message,
          error.details
        ));
        return;
      }

      if (error instanceof Error && error.message === 'License not found') {
        res.status(404).json(
          createErrorResponse(404, 'License not found')
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(500, 'Internal server error', error)
      );
    }
  }
}

