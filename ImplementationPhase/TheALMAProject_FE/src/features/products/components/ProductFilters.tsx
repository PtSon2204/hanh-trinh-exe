import type { ProductFilterOptions, ProductQuery } from '../../../shared/types/product.types';

interface Props {
  filterOptions: ProductFilterOptions | null;
  loading: boolean;
  query: ProductQuery;
  onChange: (q: ProductQuery) => void;
}

const PRICE_RANGES = [
  { key: 'all', label: 'Tất cả', min: undefined, max: undefined },
  { key: 'under-150', label: 'Dưới 150K', min: undefined, max: 150000 },
  { key: '150-250', label: '150K – 250K', min: 150000, max: 250000 },
  { key: '250-400', label: '250K – 400K', min: 250000, max: 400000 },
  { key: 'over-400', label: 'Trên 400K', min: 400000, max: undefined },
];

export default function ProductFilters({ filterOptions, loading, query, onChange }: Props) {
  const setField = (fields: Partial<ProductQuery>) =>
    onChange({ ...query, ...fields, pageNumber: 1 });

  const activePriceIdx = PRICE_RANGES.findIndex(
    (r) => r.min === query.minPrice && r.max === query.maxPrice,
  );

  const clearAll = () =>
    onChange({
      pageNumber: 1,
      pageSize: query.pageSize,
      keyword: query.keyword,
      sortBy: query.sortBy,
      sortDescending: query.sortDescending,
    });

  const hasFilters = query.category || query.material || query.universityId || query.isCustomizable != null || query.minPrice != null || query.maxPrice != null;
  const categories = filterOptions?.categories ?? [];
  const materials = filterOptions?.materials ?? [];
  const universities = filterOptions?.universities ?? [];

  return (
    <aside className="pf-sidebar" id="product-filters">
      <div className="pf-sidebar__header">
        <h3 className="pf-sidebar__title">Bộ lọc</h3>
        {hasFilters && (
          <button className="pf-sidebar__clear" type="button" onClick={clearAll}>
            Xoá tất cả
          </button>
        )}
      </div>

      {/* Kiểu dáng */}
      <div className="pf-group">
        <h4 className="pf-group__title">Kiểu dáng</h4>
        <select
          className="pf-select"
          value={query.category || ""}
          onChange={(e) => setField({ category: e.target.value ? e.target.value : undefined })}
        >
          <option value="">Tất cả kiểu dáng</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Chất liệu */}
      <div className="pf-group">
        <h4 className="pf-group__title">Chất liệu</h4>
        <select
          className="pf-select"
          value={query.material || ""}
          onChange={(e) => setField({ material: e.target.value ? e.target.value : undefined })}
        >
          <option value="">Tất cả chất liệu</option>
          {materials.map((mat) => (
            <option key={mat} value={mat}>
              {mat}
            </option>
          ))}
        </select>
      </div>

      {/* Trường học */}
      <div className="pf-group">
        <h4 className="pf-group__title">Trường học</h4>
        <select
          className="pf-select"
          value={query.universityId || ""}
          onChange={(e) => setField({ universityId: e.target.value ? Number(e.target.value) : undefined, university: undefined })}
        >
          <option value="">Tất cả trường học</option>
          {universities.map((uni) => (
            <option key={uni.universityId} value={uni.universityId}>
              {uni.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tùy chỉnh */}
      <div className="pf-group">
        <h4 className="pf-group__title">Tùy chỉnh</h4>
        <select
          className="pf-select"
          value={query.isCustomizable == null ? "" : String(query.isCustomizable)}
          onChange={(e) => setField({ isCustomizable: e.target.value ? e.target.value === 'true' : undefined })}
        >
          <option value="">Tất cả sản phẩm</option>
          <option value="true">Có thể tùy chỉnh</option>
          <option value="false">Sản phẩm bán sẵn</option>
        </select>
      </div>

      {/* Khoảng giá */}
      <div className="pf-group">
        <h4 className="pf-group__title">Khoảng giá</h4>
        {loading && !filterOptions ? <p className="pf-group__hint">Đang tải bộ lọc...</p> : null}
        <div className="pf-group__radios">
          {PRICE_RANGES.map((r, i) => (
            <label key={r.key} className={`pf-radio ${activePriceIdx === i ? 'pf-radio--active' : ''}`}>
              <input
                type="radio"
                name="priceRange"
                checked={activePriceIdx === i}
                onChange={() => setField({ minPrice: r.min, maxPrice: r.max })}
              />
              <span className="pf-radio__dot" />
              {r.label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
