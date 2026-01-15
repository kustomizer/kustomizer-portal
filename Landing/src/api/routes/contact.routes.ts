import { Router } from 'express';
import { container } from '../di/container';

const router = Router();
const controller = container.contactController;

router.post('/', (req, res) => {
  controller.submit(req, res);
});

export default router;

