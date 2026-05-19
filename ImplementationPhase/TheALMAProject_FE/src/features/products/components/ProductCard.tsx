import { Link } from 'react-router-dom';
import type { ProductListItem } from '../../../shared/types/product.types';

interface Props {
  product: ProductListItem;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25;
  return (
    <div className="pc-rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`pc-star ${i < full ? 'pc-star--full' : i === full && hasHalf ? 'pc-star--half' : ''}`}
        >
          ★
        </span>
      ))}
      <span className="pc-rating-count">({count})</span>
    </div>
  );
}

export default function ProductCard({ product }: Props) {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

  return (
    <Link to={`/products/${product.productId}`} className="product-card" id={`product-card-${product.productId}`}>
      <div className="product-card__img-wrap">
        <img
          src={product.imageUrl || '/images/placeholder-product.png'}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
        />
        {product.isCustomizable && (
          <span className="product-card__badge product-card__badge--custom">✨ Tuỳ chỉnh</span>
        )}
        {product.category && (
          <span className="product-card__badge product-card__badge--category">{product.category}</span>
        )}
        <div className="product-card__overlay">
          <span className="product-card__quick-view">Xem chi tiết →</span>
        </div>
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        {product.universityName && (
          <p className="product-card__university">🏫 {product.universityName}</p>
        )}
        <StarRating rating={product.averageRating} count={product.reviewCount} />
        <p className="product-card__price">{formatter.format(product.price)}</p>
      </div>
    </Link>
  );
}
