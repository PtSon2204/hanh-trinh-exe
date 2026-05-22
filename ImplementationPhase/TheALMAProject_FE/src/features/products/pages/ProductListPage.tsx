import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import authApi from '../../auth/api/authApi';
import { toast } from 'react-hot-toast';
import productApi from '../api/productApi';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import Pagination from '../components/Pagination';
import SearchOverlay from '../components/SearchOverlay';
import type { ProductListItem, ProductQuery } from '../../../shared/types/product.types';
import type { PagedResult } from '../../../shared/types/pagination';
import { cartApi } from '../../cart/api/cartApi';
import '../styles/products.css';

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest', desc: true },
  { label: 'Giá thấp → cao', value: 'price', desc: false },
  { label: 'Giá cao → thấp', value: 'price', desc: true },
  { label: 'Tên A → Z', value: 'name', desc: false },
];

const PAGE_SIZE = 12;

const SEARCH_FIELDS = [
  { label: 'Tên sản phẩm', value: 'name' },
  { label: 'Kiểu dáng', value: 'category' },
  { label: 'Chất liệu', value: 'material' },
  { label: 'Trường học', value: 'university' },
];

export default function ProductListPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchField, setSearchField] = useState('name');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cartCount, setCartCount] = useState<number>(0);

  // Load cart count
  useEffect(() => {
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

  // Build query from URL
  const buildQueryFromURL = useCallback((): ProductQuery => {
    return {
      name: searchParams.get('name') || undefined,
      category: searchParams.get('category') || undefined,
      material: searchParams.get('material') || undefined,
      university: searchParams.get('university') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      sortBy: searchParams.get('sortBy') || 'newest',
      sortDescending: searchParams.get('sortDescending') === 'true',
      pageNumber: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: PAGE_SIZE,
    };
  }, [searchParams]);

  const [query, setQuery] = useState<ProductQuery>(buildQueryFromURL);
  const [data, setData] = useState<PagedResult<ProductListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync URL → query
  useEffect(() => {
    setQuery(buildQueryFromURL());
  }, [buildQueryFromURL]);

  // Sync query parameters to search input states
  useEffect(() => {
    if (query.name) {
      setSearchField('name');
      setSearchKeyword(query.name);
    } else if (query.category) {
      setSearchField('category');
      setSearchKeyword(query.category);
    } else if (query.material) {
      setSearchField('material');
      setSearchKeyword(query.material);
    } else if (query.university) {
      setSearchField('university');
      setSearchKeyword(query.university);
    } else {
      setSearchKeyword('');
    }
  }, [query.name, query.category, query.material, query.university]);

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productApi
      .getProducts(query)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) toast.error('Không thể tải danh sách sản phẩm');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // Sync query → URL
  const updateQuery = (newQuery: ProductQuery) => {
    const params = new URLSearchParams();
    if (newQuery.name) params.set('name', newQuery.name);
    if (newQuery.category) params.set('category', newQuery.category);
    if (newQuery.material) params.set('material', newQuery.material);
    if (newQuery.university) params.set('university', newQuery.university);
    if (newQuery.minPrice != null) params.set('minPrice', String(newQuery.minPrice));
    if (newQuery.maxPrice != null) params.set('maxPrice', String(newQuery.maxPrice));
    if (newQuery.sortBy) params.set('sortBy', newQuery.sortBy);
    if (newQuery.sortDescending) params.set('sortDescending', 'true');
    if (newQuery.pageNumber && newQuery.pageNumber > 1) params.set('page', String(newQuery.pageNumber));
    setSearchParams(params, { replace: true });
  };

  const handleFilterChange = (newQ: ProductQuery) => updateQuery(newQ);
  const handlePageChange = (page: number) => updateQuery({ ...query, pageNumber: page });

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    const opt = SORT_OPTIONS[idx];
    updateQuery({ ...query, sortBy: opt.value, sortDescending: opt.desc, pageNumber: 1 });
  };

  const currentSortIdx = SORT_OPTIONS.findIndex(
    (o) => o.value === (query.sortBy || 'newest') && o.desc === (query.sortDescending ?? false),
  );

  const handleInlineSearch = () => {
    if (!searchKeyword.trim()) return;
    const newQuery: ProductQuery = {
      ...query,
      name: undefined,
      category: undefined,
      material: undefined,
      university: undefined,
      pageNumber: 1,
    };
    (newQuery as any)[searchField] = searchKeyword.trim();
    updateQuery(newQuery);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    updateQuery({
      ...query,
      name: undefined,
      category: undefined,
      material: undefined,
      university: undefined,
      pageNumber: 1,
    });
  };

  const hasInlineSearch = !!query.name || !!query.category || !!query.material || !!query.university;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    toast.success('Đã đăng xuất!');
  };

  return (
    <div className="plp" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
            <Link to="/category" className="alma-nav__link alma-nav__link--active">Sản Phẩm</Link>
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
                  {user.role !== "Admin" && (
                    <>
                      <Link to="/my-designs" className="alma-nav__dropdown-item">
                        🎨 Lịch sử thiết kế
                      </Link>
                      <Link to="/orders" className="alma-nav__dropdown-item">
                        📦 Đơn hàng
                      </Link>
                    </>
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
                    <Link to="/my-designs" onClick={() => setMobileNavOpen(false)}>🎨 Lịch sử thiết kế</Link>
                    <Link to="/orders" onClick={() => setMobileNavOpen(false)}>📦 Đơn hàng</Link>
                  </>
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

      {/* ─── Hero banner ─── */}
      <div className="plp-hero">
        <div className="plp-hero__content">
          <h1 className="plp-hero__title">Bộ sưu tập sản phẩm</h1>
          <p className="plp-hero__sub">
            Khám phá đa dạng kiểu dáng, chất liệu và mẫu thiết kế đồng phục cho trường lớp của bạn.
          </p>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="plp-main">
        {/* Mobile filter toggle */}
        <button className="plp-filter-toggle" onClick={() => setMobileFilterOpen((o) => !o)}>
          🎛️ {mobileFilterOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>

        <div className="plp-layout">
          {/* Sidebar */}
          <div className={`plp-sidebar ${mobileFilterOpen ? 'plp-sidebar--open' : ''}`}>
            <ProductFilters query={query} onChange={handleFilterChange} />
          </div>

          {/* Products grid */}
          <div className="plp-content">
            {/* Toolbar */}
            <div className="plp-toolbar">
              <p className="plp-toolbar__count">
                {loading ? 'Đang tải...' : `${data?.totalRecords ?? 0} sản phẩm`}
              </p>
              <div className="plp-toolbar__sort">
                <label htmlFor="sort-select">Sắp xếp:</label>
                <select id="sort-select" value={currentSortIdx} onChange={handleSortChange}>
                  {SORT_OPTIONS.map((o, i) => (
                    <option key={i} value={i}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inline search bar */}
            <div className="plp-search-bar" style={{ marginBottom: '1rem' }}>
              <select
                className="plp-search-bar__dropdown"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                id="search-field-select"
              >
                {SEARCH_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <div className="plp-search-bar__input-wrap">
                <input
                  type="text"
                  className="plp-search-bar__input"
                  placeholder={`Tìm theo ${SEARCH_FIELDS.find(f => f.value === searchField)?.label?.toLowerCase()}...`}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInlineSearch(); }}
                  id="inline-search-input"
                />
                <button className="plp-search-bar__btn" onClick={handleInlineSearch}>
                  🔍 Tìm kiếm
                </button>
              </div>
              {hasInlineSearch && (
                <button className="plp-search-bar__clear" onClick={handleClearSearch}>
                  ✕ Xoá bộ lọc
                </button>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="plp-grid">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="product-card-skeleton">
                    <div className="product-card-skeleton__img" />
                    <div className="product-card-skeleton__body">
                      <div className="product-card-skeleton__line product-card-skeleton__line--title" />
                      <div className="product-card-skeleton__line product-card-skeleton__line--sub" />
                      <div className="product-card-skeleton__line product-card-skeleton__line--price" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.data.length > 0 ? (
              <>
                <div className="plp-grid">
                  {data.data.map((p) => (
                    <ProductCard key={p.productId} product={p} />
                  ))}
                </div>
                <Pagination
                  pageNumber={data.pageNumber}
                  totalPages={data.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="plp-empty">
                <span className="plp-empty__icon">🔍</span>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
