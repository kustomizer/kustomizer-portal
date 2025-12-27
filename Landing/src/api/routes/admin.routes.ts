import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { container } from '../di/container';

const router = Router();
const controller = container.adminController;

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', (req, res) => {
  controller.getUsers(req, res);
});

router.get('/licenses', (req, res) => {
  controller.getLicenses(req, res);
});

router.patch('/licenses/:id', (req, res) => {
  controller.updateLicense(req, res);
});

router.post('/licenses/:id/rotate-key', (req, res) => {
  controller.rotateLicenseKey(req, res);
});

export default router;
