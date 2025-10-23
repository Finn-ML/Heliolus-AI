/**
 * Error Handling Middleware
 * Centralized error handling with proper logging and response formatting
 */

import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
// Mock error types
interface ServiceError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

interface ValidationError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const timestamp = new Date().toISOString();
  const path = request.url;
  const method = request.method;

  request.log.error({
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    path,
    method,
    userId: (request as any).user?.id,
  }, 'Request error');

  let response: ErrorResponse;

  // Handle different error types
  if (error instanceof ZodError) {
    // Validation errors from Zod
    response = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: {
        fields: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
      timestamp,
      path,
      method,
    };
  } else if (error.code === 'FST_ERR_VALIDATION') {
    // Fastify validation errors
    response = {
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: {
        validation: error.validation,
        validationContext: error.validationContext,
      },
      timestamp,
      path,
      method,
    };
  } else if (error.statusCode === 401) {
    // Authentication errors
    response = {
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
      statusCode: 401,
      timestamp,
      path,
      method,
    };
  } else if (error.statusCode === 403) {
    // Authorization errors
    response = {
      message: 'Insufficient permissions',
      code: 'FORBIDDEN',
      statusCode: 403,
      timestamp,
      path,
      method,
    };
  } else if (error.statusCode === 404) {
    // Not found errors
    response = {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp,
      path,
      method,
    };
  } else if (error.statusCode === 409) {
    // Conflict errors (e.g., duplicate email)
    response = {
      message: error.message || 'Resource conflict',
      code: 'CONFLICT',
      statusCode: 409,
      timestamp,
      path,
      method,
    };
  } else if (error.statusCode === 429) {
    // Rate limiting errors
    response = {
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      timestamp,
      path,
      method,
    };
  } else if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    // Body too large
    response = {
      message: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE',
      statusCode: 413,
      timestamp,
      path,
      method,
    };
  } else if (error.name === 'ServiceError') {
    // Custom service errors
    const serviceError = error as ServiceError;
    response = {
      message: serviceError.message,
      code: serviceError.code,
      statusCode: serviceError.statusCode || 500,
      details: serviceError.details,
      timestamp,
      path,
      method,
    };
  } else if (error.name === 'ValidationError') {
    // Custom validation errors
    const validationError = error as ValidationError;
    response = {
      message: validationError.message,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: validationError.details,
      timestamp,
      path,
      method,
    };
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    response = {
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      statusCode: 401,
      timestamp,
      path,
      method,
    };
  } else if (error.name === 'TokenExpiredError') {
    // JWT expired
    response = {
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      statusCode: 401,
      timestamp,
      path,
      method,
    };
  } else {
    // Generic server errors
    response = {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500,
      timestamp,
      path,
      method,
    };

    // Log full error details in development
    if (process.env.NODE_ENV !== 'production') {
      response.details = {
        stack: error.stack,
        name: error.name,
      };
    }
  }

  reply.status(response.statusCode).send(response);
}

export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const response: ErrorResponse = {
    message: 'Route not found',
    code: 'NOT_FOUND',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  };

  request.log.warn({
    path: request.url,
    method: request.method,
  }, 'Route not found');

  reply.status(404).send(response);
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  statusCode: number = 400,
  details?: any
): ErrorResponse {
  return {
    message,
    code,
    statusCode,
    details,
    timestamp: new Date().toISOString(),
    path: '',
    method: '',
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}