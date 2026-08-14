import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { SortDirection } from '../types/pagination';
import type { TableDensityPreference } from '../services/global-state-store';
import './DataTable.css';

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  sortAccessor?: (row: T) => string | number;
};

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  density?: TableDensityPreference;
  className?: string;
  testId?: string;
  skeletonRowCount?: number;
  onSortChange?: (field: string, direction: SortDirection) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  initialSortField?: string;
  initialSortDirection?: SortDirection;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  ariaLabel?: string;
}

function toggleDirection(current: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc';
}

function skeletonWidth(rowIndex: number, columnIndex: number): string {
  const widths = ['72%', '56%', '64%', '48%', '80%'];
  return widths[(rowIndex + columnIndex) % widths.length];
}

export function DataTable<T extends object>({
  columns,
  data,
  pageSize = 10,
  isLoading = false,
  emptyMessage = 'No records found.',
  density = 'standard',
  className = '',
  testId = 'data-table',
  skeletonRowCount,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  initialSortField,
  initialSortDirection = 'asc',
  searchable = false,
  searchPlaceholder = 'Search records…',
  searchFn,
  ariaLabel = 'Data table',
}: DataTableProps<T>): React.JSX.Element {
  const [sortField, setSortField] = useState<string | undefined>(initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query || !searchFn) return data;
    return data.filter((row) => searchFn(row, query));
  }, [data, searchFn, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    const col = columns.find((c) => c.key === sortField);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = col.sortAccessor
        ? col.sortAccessor(a)
        : (a as Record<string, unknown>)[sortField];
      const bValue = col.sortAccessor
        ? col.sortAccessor(b)
        : (b as Record<string, unknown>)[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return -1;
      if (bValue == null) return 1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return sortDirection === 'asc' ? aStr : -aStr;
    });
  }, [filteredData, columns, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / currentPageSize));

  const pagedData = useMemo(() => {
    const start = (page - 1) * currentPageSize;
    return sortedData.slice(start, start + currentPageSize);
  }, [sortedData, page, currentPageSize]);

  const changeSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    const field = String(column.key);
    const nextDirection = sortField === field ? toggleDirection(sortDirection) : 'asc';
    setSortField(field);
    setSortDirection(nextDirection);
    setPage(1);
    onSortChange?.(field, nextDirection);
  };

  const changePage = (nextPage: number) => {
    const p = Math.min(Math.max(1, nextPage), totalPages);
    setPage(p);
    onPageChange?.(p);
  };

  const changePageSize = (size: number) => {
    setCurrentPageSize(size);
    setPage(1);
    onPageSizeChange?.(size);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  if (isLoading) {
    const rowCount = Math.max(1, Math.min(skeletonRowCount ?? pageSize, 10));

    return (
      <div
        className={[
          'data-table',
          'data-table--loading',
          density === 'compact' ? 'data-table--compact' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-busy="true"
        data-testid="data-table-loading"
        data-density={density}
      >
        <span className="data-table-loading__status" role="status" aria-live="polite">
          Loading table rows...
        </span>
        <table aria-hidden="true">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} style={column.width ? { width: column.width } : undefined}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr key={`skeleton-row-${rowIndex}`} data-testid="data-table-skeleton-row">
                {columns.map((column, columnIndex) => (
                  <td key={`${String(column.key)}-skeleton-${rowIndex}`}>
                    <span
                      className="data-table-skeleton-cell"
                      style={{ width: skeletonWidth(rowIndex, columnIndex) }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="data-table-empty" data-testid="data-table-empty">{emptyMessage}</div>;
  }

  const firstResult = sortedData.length === 0 ? 0 : (page - 1) * currentPageSize + 1;
  const lastResult = Math.min(page * currentPageSize, sortedData.length);

  return (
    <div
      className={['data-table', density === 'compact' ? 'data-table--compact' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-testid={testId}
      data-density={density}
      role="region"
      aria-label={ariaLabel}
    >
      <div className="data-table-toolbar">
        {searchable ? (
          <label className="data-table-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              data-testid="data-table-search"
            />
          </label>
        ) : <span />}
        <div className="data-table-toolbar__summary">
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>{sortedData.length} result{sortedData.length === 1 ? '' : 's'}</span>
        </div>
      </div>
      {sortedData.length === 0 ? (
        <div className="data-table-empty data-table-empty--filtered" role="status">
          No matching records. Clear or refine your search.
        </div>
      ) : (
      <>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                style={column.width ? { width: column.width } : undefined}
                className={column.sortable ? 'sortable' : undefined}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className="data-table-sort-button"
                    onClick={() => changeSort(column)}
                    aria-label={`Sort by ${column.header}${sortField === String(column.key) ? `, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                    aria-pressed={sortField === String(column.key)}
                    data-testid={`data-table-header-${String(column.key)}`}
                  >
                    {column.header}
                    {sortField === String(column.key) && (
                      <span className="sort-indicator" aria-hidden="true">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </button>
                ) : <span data-testid={`data-table-header-${String(column.key)}`}>{column.header}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedData.map((row, rowIndex) => (
            <tr key={rowIndex} data-testid={`data-table-row-${rowIndex}`}>
              {columns.map((column) => (
                <td key={`${String(column.key)}-${rowIndex}`}>
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[String(column.key)] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="data-table-pagination">
        <span className="data-table-pagination__summary">
          Showing {firstResult}–{lastResult} of {sortedData.length}
        </span>
        <div className="page-controls">
          <button onClick={() => changePage(page - 1)} disabled={page === 1} data-testid="data-table-prev">
            Prev
          </button>
          <span data-testid="data-table-page-info">
            Page {page} of {totalPages}
          </span>
          <button onClick={() => changePage(page + 1)} disabled={page === totalPages} data-testid="data-table-next">
            Next
          </button>
        </div>
        <div className="page-size">
          <label htmlFor="page-size-select">Rows per page:</label>
          <select
            id="page-size-select"
            value={currentPageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            data-testid="data-table-page-size"
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
