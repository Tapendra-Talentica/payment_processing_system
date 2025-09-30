export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(page = 1, limit = 10) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;

  return {
    skip,
    take: validLimit,
    page: validPage,
    limit: validLimit,
  };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
