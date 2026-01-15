import { Router } from 'express';
import { container } from '../di/container';

const router = Router();
const controller = container.licenseController;

router.post('/validate', (req, res) => {
  controller.validate(req, res);
});

export default router;

