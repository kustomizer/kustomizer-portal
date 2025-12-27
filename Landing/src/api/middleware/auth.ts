import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, TokenPayload, UserRole } from '../types/auth';
import { ApiException, createErrorResponse } from '../types/errors';
import { getSupabaseClient } from '../utils/supabase-server';

function extractToken(req: Request): string | null {
  const authHeader = req.headers['authorization'] as string | undefined;

  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

async function verifyToken(token: string): Promise<TokenPayload> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new ApiException(401, 'Invalid or expired token', error);
    }

    const role = (data.user.user_metadata?.['role'] as UserRole) || UserRole.USER;

    return {
      sub: data.user.id,
      email: data.user.email || '',
      role,
    };
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(401, 'Token verification failed', error);
  }
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json(
        createErrorResponse(401, 'Authentication required. Please provide a valid token.')
      );
      return;
    }

    const payload = await verifyToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiException) {
      res.status(error.statusCode).json(createErrorResponse(
        error.statusCode,
        error.message,
        error.details
      ));
      return;
    }

    res.status(500).json(
      createErrorResponse(500, 'Authentication error', error)
    );
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json(
      createErrorResponse(401, 'Authentication required')
    );
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json(
      createErrorResponse(403, 'Admin access required')
    );
    return;
  }

  next();
}

