import type { ProductQuery } from '../../../shared/types/product.types';

interface Props {
  query: ProductQuery;
  onChange: (q: ProductQuery) => void;
}

const CATEGORIES = ['Áo thun', 'Áo Polo', 'Áo Hoodie', 'Áo sơ mi', 'Áo khoác'];
const MATERIALS = ['Cotton', 'Polyester', 'Cotton Pha', 'Thun Lạnh', 'Nỉ'];
const UNIVERSITIES = [
  'FPT University',
  'Đại học Quốc gia Hà Nội (VNU)',
  'Học viện Tài chính (AOF)',
  'Đại học Luật Hà Nội (HLU)',
  'Đại học Kinh tế Quốc dân (NEU)',
  'Đại học Ngoại thương (FTU)',
  'Đại học Bách khoa Hà Nội (HUST)',
  'Đại học Thương mại (TMU)',
];
const PRICE_RANGES = [
  { label: 'Tất cả', min: undefined, max: undefined },
  { label: 'Dưới 100K', min: undefined, max: 100000 },
  { label: '100K – 200K', min: 100000, max: 200000 },
  { label: '200K – 500K', min: 200000, max: 500000 },
  { label: 'Trên 500K', min: 500000, max: undefined },
];

export default function ProductFilters({ query, onChange }: Props) {
  const setField = (fields: Partial<ProductQuery>) =>
    onChange({ ...query, ...fields, pageNumber: 1 });

  const activePriceIdx = PRICE_RANGES.findIndex(
    (r) => r.min === query.minPrice && r.max === query.maxPrice,
  );

  const clearAll = () =>
    onChange({
      pageNumber: 1,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDescending: query.sortDescending,
    });

  const hasFilters = query.category || query.material || query.university || query.minPrice != null || query.maxPrice != null;

  return (
    <aside className="pf-sidebar" id="product-filters">
      <div className="pf-sidebar__header">
        <h3 className="pf-sidebar__title">🔍 Bộ lọc</h3>
        {hasFilters && (
          <button className="pf-sidebar__clear" onClick={clearAll}>
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
          {CATEGORIES.map((cat) => (
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
          {MATERIALS.map((mat) => (
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
          value={query.university || ""}
          onChange={(e) => setField({ university: e.target.value ? e.target.value : undefined })}
        >
          <option value="">Tất cả trường học</option>
          {UNIVERSITIES.map((uni) => (
            <option key={uni} value={uni}>
              {uni}
            </option>
          ))}
        </select>
      </div>

      {/* Khoảng giá */}
      <div className="pf-group">
        <h4 className="pf-group__title">Khoảng giá</h4>
        <div className="pf-group__radios">
          {PRICE_RANGES.map((r, i) => (
            <label key={i} className={`pf-radio ${activePriceIdx === i ? 'pf-radio--active' : ''}`}>
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
