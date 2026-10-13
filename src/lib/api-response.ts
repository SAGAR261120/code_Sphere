import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Enable automatic BigInt serialization in JSON.stringify
if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: unknown;

  constructor(statusCode: number, message: string, errorCode = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class ApiResponse {
  static success<T>(data: T, message = 'Success', status = 200, pagination?: PaginationMeta) {
    const serializedData = JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
    );

    return NextResponse.json(
      {
        success: true,
        message,
        data: serializedData,
        ...(pagination && { pagination }),
      },
      { status }
    );
  }

  static error(message: string, errorCode = 'INTERNAL_ERROR', status = 500, details?: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          ...(details !== undefined ? { details } : {}),
        },
      },
      { status }
    );
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof ApiError) {
    return ApiResponse.error(error.message, error.errorCode, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    return ApiResponse.error(
      'Validation failed for input data',
      'VALIDATION_ERROR',
      400,
      error.flatten().fieldErrors
    );
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };
    if (prismaError.code === 'P2002') {
      return ApiResponse.error(
        'A unique constraint violation occurred (duplicate record)',
        'DUPLICATE_RECORD',
        409,
        prismaError.meta
      );
    }
    if (prismaError.code === 'P2025') {
      return ApiResponse.error(
        'The requested record was not found',
        'NOT_FOUND',
        404
      );
    }
  }

  const fallbackMessage =
    error instanceof Error ? error.message : 'An unexpected server error occurred';

  return ApiResponse.error(fallbackMessage, 'INTERNAL_SERVER_ERROR', 500);
}
