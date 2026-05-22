import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import productApi from '../api/productApi';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import type { SearchProduct } from '../../../shared/types/product.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setKeyword('');
      setResults([]);
      setHasSearched(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Debounced search
  const doSearch = useCallback(async (kw: string) => {
    if (kw.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await productApi.searchProducts(kw.trim());
      setResults(data);
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleResultClick = (id: number) => {
    onClose();
    navigate(`/products/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" id="search-overlay" onClick={onClose}>
      <div className="search-overlay__container" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="search-overlay__input-wrap">
          <span className="search-overlay__icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-overlay__input"
            placeholder="Tìm kiếm sản phẩm..."
            value={keyword}
            onChange={handleInputChange}
            id="search-input"
          />
          <button className="search-overlay__close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Results */}
        <div className="search-overlay__results">
          {loading && (
            <div className="search-overlay__loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="search-skeleton">
                  <div className="search-skeleton__img" />
                  <div className="search-skeleton__text">
                    <div className="search-skeleton__line search-skeleton__line--title" />
                    <div className="search-skeleton__line search-skeleton__line--sub" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className="search-overlay__empty">
              <span className="search-overlay__empty-icon">🔎</span>
              <p>Không tìm thấy sản phẩm nào cho "{keyword}"</p>
            </div>
          )}

          {!loading &&
            results.map((item, i) => (
              <button
                key={item.productId}
                className="search-result"
                onClick={() => handleResultClick(item.productId)}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <img
                  src={resolveApiAssetUrl(item.imageUrl ?? null) || '/images/placeholder-product.png'}
                  alt={item.name}
                  className="search-result__img"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                />
                <div className="search-result__info">
                  <p className="search-result__name">{item.name}</p>
                  <div className="search-result__meta">
                    {item.category && <span className="search-result__cat">{item.category}</span>}
                    {item.universityName && (
                      <span className="search-result__uni">🏫 {item.universityName}</span>
                    )}
                  </div>
                </div>
                <span className="search-result__price">{formatter.format(item.price)}</span>
              </button>
            ))}

          {!loading && !hasSearched && keyword.length === 0 && (
            <div className="search-overlay__hint">
              <span className="search-overlay__hint-icon">💡</span>
              <p>Nhập từ khoá để tìm kiếm sản phẩm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
