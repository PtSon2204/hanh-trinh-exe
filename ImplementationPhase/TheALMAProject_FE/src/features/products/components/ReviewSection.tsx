import type { ProductReview } from '../../../shared/types/product.types';

interface Props {
  averageRating: number;
  reviewCount: number;
  reviews: ProductReview[];
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="rs-stars" aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`rs-star ${i < rating ? 'rs-star--filled' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

export default function ReviewSection({ averageRating, reviewCount, reviews }: Props) {
  return (
    <section className="rs" id="review-section">
      <h2 className="rs__title">Đánh giá sản phẩm</h2>

      {/* Summary */}
      <div className="rs__summary">
        <div className="rs__score">
          <span className="rs__score-num">{averageRating.toFixed(1)}</span>
          <StarDisplay rating={Math.round(averageRating)} />
          <span className="rs__score-count">{reviewCount} đánh giá</span>
        </div>

        {/* Rating distribution */}
        <div className="rs__bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="rs__bar-row">
                <span className="rs__bar-label">{star} ★</span>
                <div className="rs__bar-track">
                  <div className="rs__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="rs__bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="rs__empty">Chưa có đánh giá nào cho sản phẩm này.</p>
      ) : (
        <div className="rs__list">
          {reviews.map((r) => (
            <div key={r.reviewId} className="rs__review">
              <div className="rs__review-header">
                <div className="rs__avatar">
                  {r.userAvatar ? (
                    <img src={r.userAvatar} alt={r.userName} />
                  ) : (
                    <span className="rs__avatar-initials">{getInitials(r.userName)}</span>
                  )}
                </div>
                <div className="rs__review-meta">
                  <p className="rs__reviewer-name">{r.userName}</p>
                  <div className="rs__review-sub">
                    <StarDisplay rating={r.rating} />
                    <span className="rs__review-date">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              {r.comment && <p className="rs__review-comment">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
