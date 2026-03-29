import React from 'react';
import './PaginatedListController.css';

export interface PaginatedListControllerProps {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onNext: () => void;
    onPrev: () => void;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    isLoading?: boolean;
    disabled?: boolean;
    pageSizeOptions?: number[];
    className?: string;
    testId?: string;
    errorMessage?: string | null;
    onRetry?: () => void;
    showKeyboardHints?: boolean;
}

export const PaginatedListController: React.FC<PaginatedListControllerProps> = ({
    page,
    pageSize,
    total,
    totalPages,
    onNext,
    onPrev,
    onPageChange,
    onPageSizeChange,
    isLoading = false,
    disabled = false,
    pageSizeOptions,
    className = '',
    testId = 'paginated-list-controller',
    errorMessage = null,
    onRetry,
    showKeyboardHints = false,
}) => {
    const isFirstPage = page <= 1;
    const isLastPage = page >= totalPages;
    const isControlsDisabled = disabled || isLoading || total === 0;

    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const delta = 2;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                pages.push(i);
            } else if ((i === page - delta - 1 && i > 1) || (i === page + delta + 1 && i < totalPages)) {
                pages.push('...');
            }
        }
        return pages.filter((v, i, a) => v !== '...' || a[i - 1] !== '...');
    };

    const hasError = Boolean(errorMessage);
    const shouldShowEmpty = total === 0 && !isLoading && !hasError;
    const shouldShowPageSizeControl = Boolean(onPageSizeChange) && Boolean(pageSizeOptions?.length);

    const handlePageSizeChange = (nextPageSize: number) => {
        if (!onPageSizeChange) return;

        onPageSizeChange(nextPageSize);

        const nextTotalPages = Math.max(1, Math.ceil(total / nextPageSize));
        const nextPage = Math.min(page, nextTotalPages);
        if (nextPage !== page) onPageChange(nextPage);
    };

    if (shouldShowEmpty) {
        return (
            <div className={`paginated-list-empty ${className}`} data-testid={testId}>
                <span className="pagination-info">No items to display</span>
            </div>
        );
    }

    return (
        <div
            className={`paginated-list-controller ${className} ${isLoading ? 'is-loading' : ''}`}
            data-testid={testId}
            role="navigation"
            aria-label="Pagination Navigation"
        >
            {hasError && (
                <div className="pagination-error" role="alert" data-testid={`${testId}-error`}>
                    <span>{errorMessage}</span>
                    {onRetry && (
                        <button
                            type="button"
                            className="pagination-btn pagination-retry-btn"
                            onClick={onRetry}
                            data-testid={`${testId}-retry`}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            <div className="pagination-info-section">
                <span className="pagination-info">
                    Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{total}</strong>
                </span>
            </div>

            <div className="pagination-controls-section">
                <button
                    className="pagination-btn pagination-nav-btn"
                    onClick={onPrev}
                    disabled={isControlsDisabled || isFirstPage}
                    aria-label="Go to previous page"
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {showKeyboardHints && <span className="pagination-kbd-hint" aria-hidden="true">←</span>}
                </button>

                <div className="pagination-pages">
                    {getPageNumbers().map((p, idx) => (
                        <React.Fragment key={`${p}-${idx}`}>
                            {p === '...' ? (
                                <span className="pagination-ellipsis">...</span>
                            ) : (
                                <button
                                    className={`pagination-btn pagination-page-btn ${p === page ? 'is-active' : ''}`}
                                    onClick={() => onPageChange(p as number)}
                                    disabled={isControlsDisabled || p === page}
                                    aria-label={`Go to page ${p}`}
                                    aria-current={p === page ? 'page' : undefined}
                                    type="button"
                                >
                                    {p}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    className="pagination-btn pagination-nav-btn"
                    onClick={onNext}
                    disabled={isControlsDisabled || isLastPage}
                    aria-label="Go to next page"
                    type="button"
                >
                    {showKeyboardHints && <span className="pagination-kbd-hint" aria-hidden="true">→</span>}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {shouldShowPageSizeControl && (
                <div className="pagination-settings-section">
                    <label htmlFor="pagination-page-size" className="pagination-label">
                        Items per page
                    </label>
                    <select
                        id="pagination-page-size"
                        className="pagination-select"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        disabled={isControlsDisabled}
                        aria-label="Items per page"
                    >
                        {pageSizeOptions!.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};