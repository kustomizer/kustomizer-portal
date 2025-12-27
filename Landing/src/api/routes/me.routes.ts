import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { container } from '../di/container';

const router = Router();
const controller = container.userController;

router.get('/', authenticate, (req, res) => {
  controller.getMe(req, res);
});

router.get('/license', authenticate, (req, res) => {
  controller.getMyLicense(req, res);
});

export default router;

