export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}

export class PaginatedResponseDto<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
}

export class BulkOperationResponseDto {
  success: boolean;
  count: number;
  timestamp: string;
}

export class ErrorResponseDto {
  success: false;
  message: string;
  code?: string;
  timestamp: string;
  errors?: any[];
}
