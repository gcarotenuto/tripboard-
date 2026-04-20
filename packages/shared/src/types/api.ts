export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export function isApiError(result: unknown): result is ApiError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as ApiError).error === "object"
  );
}
