import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  variant?: 'default' | 'compact';
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  variant = 'default'
}: PaginationProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center space-x-2 py-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-white/60'
          }`}
          style={{ color: '#6A8A82' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);

            const showEllipsis =
              (page === 2 && currentPage > 3) ||
              (page === totalPages - 1 && currentPage < totalPages - 2);

            if (showEllipsis) {
              return (
                <span key={page} className="px-1 text-xs text-gray-400">
                  ...
                </span>
              );
            }

            if (!showPage) return null;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === page
                    ? 'shadow-sm'
                    : 'hover:bg-white/40'
                }`}
                style={{
                  backgroundColor: currentPage === page ? '#6A8A82' : 'transparent',
                  color: currentPage === page ? '#ffffff' : '#1f2937',
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-white/60'
          }`}
          style={{ color: '#6A8A82' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border-2 p-4" style={{ borderColor: '#E8ECEC' }}>
      <div className="text-sm text-gray-600">
        Affichage de <span className="font-semibold" style={{ color: '#191919' }}>{startIndex + 1}</span> à{' '}
        <span className="font-semibold" style={{ color: '#191919' }}>{endIndex}</span> sur{' '}
        <span className="font-semibold" style={{ color: '#191919' }}>{totalItems}</span> éléments
      </div>

      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-md'
          }`}
          style={{
            backgroundColor: currentPage === 1 ? '#E8ECEC' : '#E8EFED',
            color: currentPage === 1 ? '#6B7280' : '#6A8A82',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Précédent</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);

            const showEllipsis =
              (page === 2 && currentPage > 3) ||
              (page === totalPages - 1 && currentPage < totalPages - 2);

            if (showEllipsis) {
              return (
                <span key={page} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            if (!showPage) return null;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  currentPage === page
                    ? 'shadow-md'
                    : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: currentPage === page ? '#6A8A82' : 'transparent',
                  color: currentPage === page ? '#ffffff' : '#191919',
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === totalPages
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-md'
          }`}
          style={{
            backgroundColor: currentPage === totalPages ? '#E8ECEC' : '#E8EFED',
            color: currentPage === totalPages ? '#6B7280' : '#6A8A82',
          }}
        >
          <span>Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
