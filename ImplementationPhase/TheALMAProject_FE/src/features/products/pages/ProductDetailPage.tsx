import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import authApi from '../../auth/api/authApi';
import { toast } from 'react-hot-toast';
import productApi from '../api/productApi';
import { cartApi } from '../../cart/api/cartApi';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import ImageGallery from '../components/ImageGallery';
import SizeColorPicker from '../components/SizeColorPicker';
import ReviewSection from '../components/ReviewSection';
import ProductCard from '../components/ProductCard';
import SearchOverlay from '../components/SearchOverlay';
import type { ProductDetail } from '../../../shared/types/product.types';
import type { ProductListItem } from '../../../shared/types/product.types';
import '../styles/products.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const navigate = useNavigate();

  const fetchCartCount = useCallback(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    cartApi.getMyCart()
      .then(cart => {
        const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

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

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    toast.success('Đã đăng xuất!');
  };

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
      fetchCartCount();
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

  // Build gallery images from product data
  const galleryImages = product
    ? [product.imageUrl, product.frontImageUrl, product.backImageUrl]
        .map(url => resolveApiAssetUrl(url ?? null))
        .filter(Boolean) as string[]
    : [];

  return (
    <div className="pdp" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ─── Navbar ─── */}
      <header className="alma-nav">
        <div className="alma-nav__inner">
          <button className="alma-nav__mobile-btn" onClick={() => setMobileNavOpen((o) => !o)}>
            <span className="hamburger-icon">{mobileNavOpen ? '✕' : '☰'}</span>
          </button>
          <Link to="/" className="alma-nav__brand">
            <img src="/images/logo.png" alt="ALMA Logo" className="alma-nav__logo" />
            <span className="alma-nav__title">ALMA Custom Threads<span className="dot">.</span></span>
          </Link>
          <nav className="alma-nav__links">
            <Link to="/" className="alma-nav__link">Trang Chủ</Link>
            <Link to="/category" className="alma-nav__link">Sản Phẩm</Link>
            <Link to="/customizer" className="alma-nav__link alma-nav__link--design">✨ Thiết Kế Ngay</Link>
          </nav>
          <div className="alma-nav__actions">
            <button className="alma-nav__icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>🔍</button>
            <Link to="/cart" className="alma-nav__icon-btn alma-nav__cart" aria-label="Cart">
              🛒{cartCount > 0 && <span className="alma-nav__badge">{cartCount}</span>}
            </Link>
            {user ? (
              <div className="alma-nav__user-menu">
                <Link to="/profile" className="alma-nav__login-btn">
                  👤 {user.fullName.split(" ").pop()}
                </Link>
                <div className="alma-nav__dropdown">
                  <Link to="/profile" className="alma-nav__dropdown-item">
                    👤 Trang cá nhân
                  </Link>
                  {user.role !== "Admin" ? (
                    <>
                      <Link to="/designs" className="alma-nav__dropdown-item">
                        🎨 Lịch sử thiết kế
                      </Link>
                      <Link to="/orders" className="alma-nav__dropdown-item">
                        📦 Đơn hàng
                      </Link>
                    </>
                  ) : (
                    <Link to="/admin" className="alma-nav__dropdown-item">
                      ⚙️ Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="alma-nav__dropdown-item alma-nav__dropdown-item--logout"
                    type="button"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="alma-nav__login-btn">
                👤 Đăng nhập
              </Link>
            )}
          </div>
        </div>
        {mobileNavOpen && (
          <div className="alma-nav__mobile-menu">
            <Link to="/" onClick={() => setMobileNavOpen(false)}>Trang Chủ</Link>
            <Link to="/category" onClick={() => setMobileNavOpen(false)}>Sản Phẩm</Link>
            <Link to="/customizer" onClick={() => setMobileNavOpen(false)}>✨ Thiết Kế Ngay</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileNavOpen(false)}>👤 Trang cá nhân</Link>
                {user.role !== "Admin" && (
                  <>
                    <Link to="/designs" onClick={() => setMobileNavOpen(false)}>🎨 Lịch sử thiết kế</Link>
                    <Link to="/orders" onClick={() => setMobileNavOpen(false)}>📦 Đơn hàng</Link>
                  </>
                )}
                {user.role === "Admin" && (
                  <Link to="/admin" onClick={() => setMobileNavOpen(false)}>⚙️ Admin Dashboard</Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileNavOpen(false); }}
                  className="alma-nav__logout-btn-mobile"
                  type="button"
                >
                  🚪 Đăng xuất
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileNavOpen(false)}>👤 Đăng nhập</Link>
            )}
          </div>
        )}
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

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
    </div>
  );
}
