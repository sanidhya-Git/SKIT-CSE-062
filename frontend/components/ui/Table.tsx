'use client';

import React from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  emptyAction?: React.ReactNode;
  skeletonRows?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  keyExtractor: (row: T, index: number) => string;
}

export function Table<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nothing here yet',
  emptyDescription,
  emptyIcon,
  emptyAction,
  skeletonRows = 5,
  sortKey,
  sortDir,
  onSort,
  keyExtractor,
}: TableProps<T>) {
  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? '📋'}
        title={emptyMessage}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.sortable ? 'sortable' : ''}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={
                  col.sortable && sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {col.header}
                {col.sortable && sortKey === col.key && (
                  <span aria-hidden="true" style={{ marginLeft: '0.25rem', opacity: 0.6 }}>
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="table-skeleton">
                  {columns.map(col => (
                    <td key={col.key}>
                      <div
                        className="skeleton-line"
                        style={{ width: `${60 + Math.random() * 30}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, i) => (
                <tr key={keyExtractor(row, i)}>
                  {columns.map(col => (
                    <td key={col.key}>{col.render(row, i)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
