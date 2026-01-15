import express, { Express } from 'express';
import { errorHandler } from './middleware/error-handler';
import contactRoutes from './routes/contact.routes';
import meRoutes from './routes/me.routes';
import licenseRoutes from './routes/license.routes';
import adminRoutes from './routes/admin.routes';

export function setupApiRoutes(app: Express): void {
  app.use('/api', express.json());

  app.use('/api/contact', contactRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/license', licenseRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', errorHandler);
}

