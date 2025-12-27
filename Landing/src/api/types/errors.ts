export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export class ApiException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiException';
  }

  toJSON(): ApiError {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error: {
      error: 'ApiError',
      message,
      statusCode,
      details,
    },
  };
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

