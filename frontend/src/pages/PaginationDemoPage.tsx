import React, { useMemo, useState } from 'react';
import { PaginatedListController } from '../components/v1/PaginatedListController';

const DEMO_TOTAL_ITEMS = 137;
const DEMO_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export const PaginationDemoPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(DEMO_TOTAL_ITEMS / pageSize));

  const visibleItems = useMemo(() => {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, DEMO_TOTAL_ITEMS);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, idx) => `Demo Item #${start + idx}`);
  }, [page, pageSize]);

  return (
    <section className="game-lobby" aria-label="Pagination Demo Page">
      <div className="lobby-header">
        <h2>Pagination Controller Demo</h2>
        <p>Use this page to verify page navigation and page-size behavior.</p>
      </div>

      <div className="lobby-empty" style={{ alignItems: 'flex-start' }}>
        <strong>Visible items</strong>
        <ul style={{ marginTop: '0.5rem' }}>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <PaginatedListController
        page={page}
        pageSize={pageSize}
        total={DEMO_TOTAL_ITEMS}
        totalPages={totalPages}
        onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEMO_PAGE_SIZE_OPTIONS}
        testId="pagination-demo-controller"
      />
    </section>
  );
};

export default PaginationDemoPage;
