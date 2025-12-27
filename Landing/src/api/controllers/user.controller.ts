import { Service } from 'typedi';
import { Response } from 'express';
import { UserService } from '../services/user.service';
import { LicenseService } from '../services/license.service';
import { AuthenticatedRequest } from '../types/auth';
import { createSuccessResponse, createErrorResponse, ApiException } from '../types/errors';

@Service()
export class UserController {
  constructor(
    private userService: UserService,
    private licenseService: LicenseService
  ) { }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(401, 'User not authenticated')
        );
        return;
      }

      const user = await this.userService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json(
          createErrorResponse(404, 'User not found')
        );
        return;
      }

      res.json(createSuccessResponse(user));
    } catch (error) {
      console.error('[UserController] Error:', error);
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

  async getMyLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(401, 'User not authenticated')
        );
        return;
      }

      const license = await this.licenseService.getUserLicense(req.user.id);
      res.json(createSuccessResponse(license));
    } catch (error) {
      console.error('[UserController] Error:', error);
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

