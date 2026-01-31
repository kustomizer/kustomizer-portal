import { AuthError } from '@supabase/supabase-js';
import { DomainError, DomainErrorType } from '../../types/domain-error';

export function mapSupabaseErrorToDomainError(error: any): DomainError {
  // Handle Supabase AuthError
  if (error instanceof AuthError || error?.name === 'AuthApiError') {
    return mapAuthErrorToDomainError(error);
  }

  // Handle PostgrestError (database errors)
  if (error?.code && typeof error.code === 'string') {
    return mapPostgrestErrorToDomainError(error);
  }

  // Fallback to generic error
  return DomainError.unknown(error?.message || 'An unexpected error occurred');
}

export function mapHttpErrorToDomainError(status: number, body?: any): DomainError {
  const messageFromBody = body?.message || body?.error;
  const message = messageFromBody || 'Request failed';
  const reason = body?.reason;

  switch (status) {
    case 401:
      return DomainError.unauthorized(message);
    case 403:
      return DomainError.forbidden(message);
    case 404:
      return DomainError.notFound(message);
    case 409:
      return DomainError.conflict(reason ? `${message} (${reason})` : message, reason);
    case 400:
      return DomainError.validation(message);
    case 422:
      return DomainError.validation(message);
    default:
      if (status >= 500) {
        return DomainError.unknown(messageFromBody || 'Server error occurred');
      }
      return DomainError.unknown(message);
  }
}

function mapAuthErrorToDomainError(error: AuthError | any): DomainError {
  const message = error.message || 'Authentication failed';

  // Map common Supabase auth error codes
  switch (error.status) {
    case 400:
      if (message.includes('already registered') || message.includes('already exists')) {
        return DomainError.conflict('User already exists');
      }
      if (message.includes('Invalid login credentials')) {
        return DomainError.unauthorized('Invalid email or password');
      }
      return DomainError.validation(message);
    case 401:
      return DomainError.unauthorized(message);
    case 403:
      return DomainError.forbidden(message);
    case 422:
      return DomainError.validation(message);
    default:
      return DomainError.unknown(message);
  }
}

function mapPostgrestErrorToDomainError(error: any): DomainError {
  const message = error.message || 'Database error occurred';
  const code = error.code;

  // PostgreSQL error codes
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (code === '23505') {
    // unique_violation
    return DomainError.conflict('Resource already exists');
  }

  if (code === '23503') {
    // foreign_key_violation
    return DomainError.validation('Invalid reference to related resource');
  }

  if (code === '42501') {
    // insufficient_privilege (RLS policy violation)
    return DomainError.forbidden('You do not have permission to perform this action');
  }

  if (code.startsWith('23')) {
    // integrity_constraint_violation
    return DomainError.validation(message);
  }

  if (code.startsWith('42')) {
    // syntax_error or access_rule_violation
    return DomainError.validation(message);
  }

  return DomainError.unknown(message);
}
