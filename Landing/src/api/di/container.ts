import { Container } from 'typedi';
import { ContactController } from '../controllers/contact.controller';
import { UserController } from '../controllers/user.controller';
import { LicenseController } from '../controllers/license.controller';
import { AdminController } from '../controllers/admin.controller';

export const container = {
  get contactController(): ContactController {
    return Container.get(ContactController);
  },

  get userController(): UserController {
    return Container.get(UserController);
  },

  get licenseController(): LicenseController {
    return Container.get(LicenseController);
  },

  get adminController(): AdminController {
    return Container.get(AdminController);
  },
};
