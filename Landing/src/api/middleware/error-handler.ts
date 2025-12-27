import { Request, Response, NextFunction } from 'express';
import { ApiException, createErrorResponse } from '../types/errors';

export function errorHandler(
  err: Error | ApiException,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiException) {
    res.status(err.statusCode).json(createErrorResponse(
      err.statusCode,
      err.message,
      err.details
    ));
    return;
  }

  console.error('[API Error]', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json(createErrorResponse(
    500,
    'Internal server error',
    process.env['NODE_ENV'] === 'development' ? err.message : undefined
  ));
}

