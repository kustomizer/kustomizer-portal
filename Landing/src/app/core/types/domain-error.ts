export enum DomainErrorType {
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  Validation = 'Validation',
  Unknown = 'Unknown',
}

export class DomainError extends Error {
  constructor(
    public readonly type: DomainErrorType,
    message: string,
    public readonly reason?: string
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static unauthorized(message = 'Unauthorized'): DomainError {
    return new DomainError(DomainErrorType.Unauthorized, message);
  }

  static forbidden(message = 'Forbidden'): DomainError {
    return new DomainError(DomainErrorType.Forbidden, message);
  }

  static notFound(message = 'Resource not found'): DomainError {
    return new DomainError(DomainErrorType.NotFound, message);
  }

  static conflict(message: string, reason?: string): DomainError {
    return new DomainError(DomainErrorType.Conflict, message, reason);
  }

  static validation(message: string): DomainError {
    return new DomainError(DomainErrorType.Validation, message);
  }

  static unknown(message = 'An unexpected error occurred'): DomainError {
    return new DomainError(DomainErrorType.Unknown, message);
  }
}

