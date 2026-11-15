'use client';

import { useState } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginationControls extends PaginationState {
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: (totalPages: number) => void;
  canGoNext: (totalPages: number) => boolean;
  canGoPrev: () => boolean;
  resetPage: () => void;
}

export function usePagination(initialPageSize = 20): PaginationControls {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);

  return {
    page,
    pageSize,
    setPage,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    goToFirst: () => setPage(1),
    goToLast: (totalPages: number) => setPage(totalPages),
    canGoNext: (totalPages: number) => page < totalPages,
    canGoPrev: () => page > 1,
    resetPage: () => setPage(1),
  };
}
