import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TeacherPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const TeacherPagination: React.FC<TeacherPaginationProps> = memo(({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  onLimitChange
}) => {
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return (
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Menampilkan {totalRecords} dari {totalRecords} data
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Tampilkan:</label>
            <select
              value={recordsPerPage}
              onChange={(e) => onLimitChange(Number(e.target.value))}
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

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
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
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
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
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-md transition-colors"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
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
            onChange={(e) => onLimitChange(Number(e.target.value))}
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

TeacherPagination.displayName = 'TeacherPagination';

export default TeacherPagination;