
interface Props {
  pageNumber: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pageNumber, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const getPages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= pageNumber - delta && i <= pageNumber + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <nav className="pagination" id="product-pagination" aria-label="Phân trang sản phẩm">
      <button
        className="pagination__btn pagination__btn--prev"
        disabled={pageNumber <= 1}
        onClick={() => onPageChange(pageNumber - 1)}
        aria-label="Trang trước"
      >
        ← Trước
      </button>

      <div className="pagination__pages">
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination__ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`pagination__page ${p === pageNumber ? 'pagination__page--active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === pageNumber ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        className="pagination__btn pagination__btn--next"
        disabled={pageNumber >= totalPages}
        onClick={() => onPageChange(pageNumber + 1)}
        aria-label="Trang sau"
      >
        Sau →
      </button>
    </nav>
  );
}
