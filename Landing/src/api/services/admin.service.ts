import { Service } from 'typedi';
import { UserService } from './user.service';
import { LicenseService } from './license.service';

@Service()
export class AdminService {
  constructor(
    private userService: UserService,
    private licenseService: LicenseService
  ) { }

  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  async getAllLicenses() {
    return this.licenseService.getAllLicenses();
  }

  async updateLicense(id: string, updates: Parameters<LicenseService['updateLicense']>[1]) {
    return this.licenseService.updateLicense(id, updates);
  }

  async rotateLicenseKey(id: string) {
    return this.licenseService.rotateLicenseKey(id);
  }
}

