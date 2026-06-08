import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { toast } from 'react-hot-toast';
import productApi from '../api/productApi';
import { cartApi } from '../../cart/api/cartApi';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import ImageGallery from '../components/ImageGallery';
import SizeColorPicker from '../components/SizeColorPicker';
import ReviewSection from '../components/ReviewSection';
import ProductCard from '../components/ProductCard';
import Navbar from '../../../shared/components/Navbar';
import Footer from '../../../shared/components/Footer';
import type { ProductDetail } from '../../../shared/types/product.types';
import type { ProductListItem } from '../../../shared/types/product.types';
import '../styles/products.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [userHeight, setUserHeight] = useState<string>('');
  const [userWeight, setUserWeight] = useState<string>('');
  const navigate = useNavigate();

  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

  useEffect(() => {
    if (!id) return;
    const productId = Number(id);
    if (isNaN(productId)) {
      setError('ID sản phẩm không hợp lệ');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedSize(undefined);

    Promise.all([
      productApi.getProductDetail(productId),
      productApi.getRelatedProducts(productId),
    ])
      .then(([detail, rel]) => {
        if (!cancelled) {
          setProduct(detail);
          setRelated(rel);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải thông tin sản phẩm');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      cancelled = true;
    };
  }, [id]);



  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập trước khi thêm vào giỏ hàng!');
      navigate('/login');
      return;
    }
    if (!selectedSize) {
      toast.error('Vui lòng chọn kích cỡ trước khi thêm vào giỏ');
      return;
    }
    if (!product) return;
    setAddingToCart(true);
    try {
      await cartApi.addToCart({
        productId: product.productId,
        size: selectedSize,
        quantity,
      });
      toast.success(`Đã thêm "${product.name}" (Size ${selectedSize}) x${quantity} vào giỏ hàng!`);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        const msg = err.response?.data?.message ?? 'Lỗi khi thêm vào giỏ hàng.';
        toast.error(msg);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const getRecommendedSize = () => {
    const h = parseFloat(userHeight);
    const w = parseFloat(userWeight);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return '';
    
    let weightSize = 'S';
    if (w >= 78) weightSize = 'XXL';
    else if (w >= 69) weightSize = 'XL';
    else if (w >= 61) weightSize = 'L';
    else if (w >= 53) weightSize = 'M';
    else weightSize = 'S';

    let heightSize = 'S';
    if (h >= 181) heightSize = 'XXL';
    else if (h >= 175) heightSize = 'XL';
    else if (h >= 168) heightSize = 'L';
    else if (h >= 160) heightSize = 'M';
    else heightSize = 'S';

    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    return sizes[Math.max(sizes.indexOf(weightSize), sizes.indexOf(heightSize))];
  };
  const recSize = getRecommendedSize();

  // Build gallery images from product data (multi-image support)
  // If admin uploaded images (pipe-separated imageUrl), show ONLY those.
  // Fall back to frontImageUrl/backImageUrl only if no imageUrl images exist.
  const galleryImages = (() => {
    if (!product) return [];
    
    const isValidUrlString = (url: string | null | undefined): url is string => {
      if (!url) return false;
      const clean = url.trim().toLowerCase();
      return clean.length > 0 && clean !== 'null' && clean !== 'undefined';
    };

    const isResolvedUrlValid = (url: string | null): url is string => {
      if (!url) return false;
      const clean = url.toLowerCase();
      return !clean.endsWith('/null') && !clean.endsWith('/undefined');
    };

    const adminImages = (product.imageUrl?.split('|') || [])
      .filter(isValidUrlString)
      .map(url => resolveApiAssetUrl(url))
      .filter(isResolvedUrlValid);
    
    if (adminImages.length > 0) return adminImages;

    // Fallback: use front/back images from base product
    return [product.frontImageUrl, product.backImageUrl]
      .filter(isValidUrlString)
      .map(url => resolveApiAssetUrl(url))
      .filter(isResolvedUrlValid);
  })();

  return (
    <div className="pdp flex flex-col min-h-screen" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />

      <main className="flex-grow flex-1">
        {/* Loading state */}
        {loading && (
          <div className="pdp-loading">
            <div className="pdp-spinner" />
            <p>Đang tải sản phẩm...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="pdp-error">
            <span className="pdp-error__icon">⚠️</span>
            <h2>{error}</h2>
            <Link to="/category" className="pdp-error__btn">← Quay lại danh sách</Link>
          </div>
        )}

        {/* Product detail */}
        {product && !loading && !error && (
          <>
            {/* Breadcrumb */}
            <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Trang chủ</Link>
              <span className="pdp-breadcrumb__sep">/</span>
              <Link to="/category">Sản phẩm</Link>
              <span className="pdp-breadcrumb__sep">/</span>
              <span className="pdp-breadcrumb__current">{product.name}</span>
            </nav>

            <div className="pdp-main">
              {/* Left: Gallery */}
              <div className="pdp-gallery">
                <ImageGallery images={galleryImages} />
              </div>

              {/* Right: Product info */}
              <div className="pdp-info">
                {/* University badge */}
                {product.universityName && (
                  <div className="pdp-uni-badge">
                    {product.universityLogoUrl && (
                      <img src={resolveApiAssetUrl(product.universityLogoUrl || null) || ''} alt={product.universityName} className="pdp-uni-badge__logo" />
                    )}
                    <span>{product.universityName}</span>
                  </div>
                )}

                <h1 className="pdp-info__name" id="product-name">{product.name}</h1>

                {/* Rating summary */}
                <div className="pdp-info__rating">
                  <span className="pdp-info__stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.round(product.averageRating) ? 'star--filled' : 'star--empty'}>★</span>
                    ))}
                  </span>
                  <span className="pdp-info__rating-text">
                    {product.averageRating.toFixed(1)} ({product.reviewCount} đánh giá)
                  </span>
                </div>

                <p className="pdp-info__price">{formatter.format(product.price)}</p>

                {product.description && (
                  <p className="pdp-info__desc">{product.description}</p>
                )}

                {/* Specs */}
                <div className="pdp-specs">
                  {product.category && (
                    <div className="pdp-spec">
                      <span className="pdp-spec__label">Kiểu dáng</span>
                      <span className="pdp-spec__value">{product.category}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="pdp-spec">
                      <span className="pdp-spec__label">Chất liệu</span>
                      <span className="pdp-spec__value">{product.material}</span>
                    </div>
                  )}
                  {product.isCustomizable && (
                    <div className="pdp-spec">
                      <span className="pdp-spec__label">Tuỳ chỉnh</span>
                      <span className="pdp-spec__value pdp-spec__value--yes">✨ Có thể thiết kế</span>
                    </div>
                  )}
                </div>

                {/* Size & Color */}
                <SizeColorPicker
                  sizes={product.availableSizes}
                  colors={product.availableColors}
                  selectedSize={selectedSize}
                  onSizeChange={setSelectedSize}
                />

                {/* Size Recommender */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-4" style={{ maxWidth: '380px' }}>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="fa-solid fa-calculator text-blue-500"></i> Gợi ý chọn Size
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1">Chiều cao (cm)</label>
                      <input
                        type="number"
                        value={userHeight}
                        onChange={e => setUserHeight(e.target.value)}
                        placeholder="Ví dụ: 170"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1">Cân nặng (kg)</label>
                      <input
                        type="number"
                        value={userWeight}
                        onChange={e => setUserWeight(e.target.value)}
                        placeholder="Ví dụ: 65"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  {recSize && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex items-center justify-between transition-all">
                      <span className="text-xs text-blue-800 font-medium">
                        Size gợi ý: <span className="font-bold text-sm bg-blue-600 text-white px-2 py-0.5 rounded ml-1">{recSize}</span>
                      </span>
                      <button
                        onClick={() => setSelectedSize(recSize)}
                        className="bg-white hover:bg-blue-100 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-1.5 rounded transition shadow-sm"
                      >
                        Chọn size này
                      </button>
                    </div>
                  )}
                </div>

                {/* Quantity selector */}
                <div className="pdp-quantity">
                  <span className="pdp-quantity__label">Số lượng:</span>
                  <div className="pdp-quantity__controls">
                    <button
                      className="pdp-quantity__btn"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >−</button>
                    <span className="pdp-quantity__value">{quantity}</span>
                    <button
                      className="pdp-quantity__btn"
                      onClick={() => setQuantity(q => q + 1)}
                    >+</button>
                  </div>
                </div>

                {/* CTA */}
                <div className="pdp-actions">
                  <button
                    className="pdp-actions__add-cart"
                    onClick={handleAddToCart}
                    disabled={!selectedSize || addingToCart}
                    id="add-to-cart-btn"
                  >
                    {addingToCart ? '⏳ Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
                  </button>
                  {product.isCustomizable && (
                    <Link to="/customizer" className="pdp-actions__customize">
                      ✨ Tuỳ chỉnh thiết kế
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="pdp-section">
              <ReviewSection
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
                reviews={product.reviews}
              />
            </div>

            {/* Related products */}
            {related.length > 0 && (
              <div className="pdp-section">
                <h2 className="pdp-section__title">Sản phẩm liên quan</h2>
                <div className="pdp-related-grid">
                  {related.map((p) => (
                    <ProductCard key={p.productId} product={p} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
