import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = memo(({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  onLimitChange,
  className = ''
}) => {
  const startRecord = totalRecords > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  const getVisiblePages = () => {
    if (totalPages <= 1) return [];
    
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    if (totalPages > 1) {
      rangeWithDots.push(1);
    }

    // Calculate range around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    // Add dots after first page if needed
    if (start > 2) {
      rangeWithDots.push('...');
    }

    // Add pages around current page
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }
    rangeWithDots.push(...range);

    // Add dots before last page if needed
    if (end < totalPages - 1) {
      rangeWithDots.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Remove duplicates and sort
    const uniquePages = Array.from(new Set(rangeWithDots)).sort((a, b) => {
      if (a === '...' || b === '...') return 0;
      return (a as number) - (b as number);
    });

    return uniquePages;
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    if (newLimit !== recordsPerPage) {
      onLimitChange(newLimit);
    }
  };

  if (totalRecords === 0) {
    return (
      <div className={`bg-white px-4 py-3 border-t border-gray-200 sm:px-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Tidak ada data untuk ditampilkan
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Tampilkan:</label>
            <select
              value={recordsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">per halaman</span>
          </div>
        </div>
      </div>
    );
  }

  if (totalPages <= 1) {
    return (
      <div className={`bg-white px-4 py-3 border-t border-gray-200 sm:px-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Menampilkan {startRecord}-{endRecord} dari {totalRecords} data
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Tampilkan:</label>
            <select
              value={recordsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">per halaman</span>
          </div>
        </div>
      </div>
    );
  }

  const visiblePages = getVisiblePages();

  return (
    <div className={`bg-white px-4 py-3 border-t border-gray-200 sm:px-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        {/* Records Info */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Menampilkan {startRecord}-{endRecord} dari {totalRecords} data
          </span>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-1">
          {/* First Page */}
          <button
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {visiblePages.map((page, index) => (
              <React.Fragment key={`${page}-${index}`}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-gray-500 text-sm">...</span>
                ) : (
                  <button
                    onClick={() => handlePageClick(page as number)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-w-[40px] ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Page */}
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Records Per Page */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Tampilkan:</label>
          <select
            value={recordsPerPage}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700">per halaman</span>
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;