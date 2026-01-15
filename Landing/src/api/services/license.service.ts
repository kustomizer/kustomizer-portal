import { Service } from 'typedi';
import { LicenseRepository } from '../repositories/license.repository';
import {
  License,
  LicenseStatus,
  LicenseValidationRequest,
  LicenseValidationResponse,
  LicenseUpdatePayload,
} from '../types/license';
import { randomBytes } from 'crypto';

@Service()
export class LicenseService {
  constructor(private licenseRepository: LicenseRepository) { }

  async validateLicense(
    request: LicenseValidationRequest
  ): Promise<LicenseValidationResponse> {
    const license = await this.licenseRepository.findByKey(request.key);

    if (!license) {
      return {
        valid: false,
        reason: 'License key not found',
      };
    }

    if (license.status !== LicenseStatus.ACTIVE) {
      return {
        valid: false,
        reason: `License is ${license.status}`,
        license: {
          id: license.id,
          tier: license.tier,
          status: license.status,
          expires_at: license.expires_at,
        },
      };
    }

    if (license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      const now = new Date();

      if (expiresAt < now) {
        await this.licenseRepository.updateStatus(license.id, LicenseStatus.EXPIRED);

        return {
          valid: false,
          reason: 'License has expired',
          license: {
            id: license.id,
            tier: license.tier,
            status: LicenseStatus.EXPIRED,
            expires_at: license.expires_at,
          },
        };
      }
    }

    if (license.allowlist && license.allowlist.length > 0) {
      const domain = request.domain;
      const ip = request.ip;

      if (!domain && !ip) {
        return {
          valid: false,
          reason: 'Domain or IP required for allowlist validation',
        };
      }

      const isAllowed = license.allowlist.some((allowed) => {
        if (domain && (allowed === domain || domain.endsWith(`.${allowed}`))) {
          return true;
        }
        if (ip && allowed === ip) {
          return true;
        }
        return false;
      });

      if (!isAllowed) {
        return {
          valid: false,
          reason: 'Domain or IP not in allowlist',
          license: {
            id: license.id,
            tier: license.tier,
            status: license.status,
            expires_at: license.expires_at,
          },
        };
      }
    }

    return {
      valid: true,
      license: {
        id: license.id,
        tier: license.tier,
        status: license.status,
        expires_at: license.expires_at,
      },
    };
  }

  async getUserLicense(userId: string): Promise<License | null> {
    return this.licenseRepository.findByUserId(userId);
  }

  async getAllLicenses(): Promise<License[]> {
    return this.licenseRepository.findAll();
  }

  async updateLicense(id: string, updates: LicenseUpdatePayload): Promise<License> {
    return this.licenseRepository.update(id, updates);
  }

  async rotateLicenseKey(id: string): Promise<{ id: string; key: string; rotated_at: string }> {
    const newKey = randomBytes(32).toString('base64url');
    const updated = await this.licenseRepository.updateKey(id, newKey);

    return {
      id: updated.id,
      key: updated.key,
      rotated_at: updated.updated_at,
    };
  }
}

