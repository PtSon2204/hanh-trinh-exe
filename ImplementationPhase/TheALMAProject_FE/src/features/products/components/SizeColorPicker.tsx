
interface Props {
  sizes: string[];
  colors: string[];
  selectedSize?: string;
  onSizeChange: (size: string) => void;
}

/** Map tên màu tiếng Việt → CSS color */
const COLOR_MAP: Record<string, string> = {
  'Trắng': '#ffffff',
  'Đen': '#1a1a1a',
  'Đỏ': '#ef4444',
  'Xanh dương': '#3b82f6',
  'Xanh lá': '#22c55e',
  'Vàng': '#eab308',
  'Hồng': '#ec4899',
  'Tím': '#a855f7',
  'Cam': '#f97316',
  'Xám': '#6b7280',
  'Nâu': '#92400e',
  'Be': '#d4b896',
  'Navy': '#1e3a5f',
};

/** Map hex color → Tên tiếng Việt tương ứng */
const HEX_TO_NAME: Record<string, string> = {
  '#ffffff': 'Trắng',
  '#fff': 'Trắng',
  '#000000': 'Đen',
  '#000': 'Đen',
  '#1a1a1a': 'Đen',
  '#ef4444': 'Đỏ',
  '#ff0000': 'Đỏ',
  '#3b82f6': 'Xanh dương',
  '#0000ff': 'Xanh dương',
  '#22c55e': 'Xanh lá',
  '#00ff00': 'Xanh lá',
  '#eab308': 'Vàng',
  '#ffff00': 'Vàng',
  '#ec4899': 'Hồng',
  '#ffc0cb': 'Hồng',
  '#a855f7': 'Tím',
  '#800080': 'Tím',
  '#f97316': 'Cam',
  '#ffa500': 'Cam',
  '#6b7280': 'Xám',
  '#808080': 'Xám',
  '#92400e': 'Nâu',
  '#a52a2a': 'Nâu',
  '#d4b896': 'Be',
  '#f5f5dc': 'Be',
  '#1e3a5f': 'Navy',
  '#000080': 'Navy',
  '#faebeb': 'Hồng nhạt',
  '#f5f5f5': 'Trắng xám',
  '#ebebeb': 'Xám nhạt',
  '#4b5563': 'Xám đậm',
  '#374151': 'Xám đen',
  '#1f2937': 'Đen xám',
  '#111827': 'Đen đậm',
  '#0f172a': 'Xanh đen',
  '#0284c7': 'Xanh da trời',
  '#06b6d4': 'Xanh ngọc',
  '#14b8a6': 'Xanh lục bảo',
  '#10b981': 'Xanh lá đậm',
  '#84cc16': 'Xanh đọt chuối',
  '#f59e0b': 'Vàng cam',
  '#d97706': 'Nâu vàng',
  '#b45309': 'Nâu đỏ',
  '#78350f': 'Nâu đậm',
  '#dc2626': 'Đỏ đậm',
  '#991b1b': 'Đỏ đô',
  '#7f1d1d': 'Đỏ thẫm',
  '#db2777': 'Hồng cánh sen',
  '#c084fc': 'Tím nhạt',
  '#7c3aed': 'Tím đậm',
  '#4f46e5': 'Xanh chàm',
  '#2563eb': 'Xanh dương đậm',
  '#1d4ed8': 'Xanh hoàng gia',
  '#ff5722': 'Cam đất',
  '#795548': 'Nâu đất',
  '#607d8b': 'Xám xanh',
  '#9e9e9e': 'Xám tro',
  '#e91e63': 'Hồng neon',
  '#9c27b0': 'Tím hoa cà',
  '#673ab7': 'Tím biếc',
  '#3f51b5': 'Xanh coban',
  '#00bcd4': 'Xanh hồ thủy',
  '#009688': 'Xanh mòng két',
  '#4caf50': 'Xanh cỏ',
  '#8bc34a': 'Xanh chuối',
  '#cddc39': 'Vàng chanh',
  '#ffeb3b': 'Vàng sáng',
  '#ffc107': 'Vàng nghệ',
  '#ff9800': 'Cam tươi',
};

function getColorHex(color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  return COLOR_MAP[color] || '#94a3b8';
}

function getColorName(color: string): string {
  if (color.startsWith('#')) {
    return HEX_TO_NAME[color.toLowerCase()] || color;
  }
  return color;
}

export default function SizeColorPicker({
  sizes,
  colors,
  selectedSize,
  onSizeChange,
}: Props) {
  return (
    <div className="scp" id="size-color-picker">
      {/* Size picker */}
      {sizes.length > 0 && (
        <div className="scp__group">
          <h4 className="scp__label">
            Kích cỡ
            {selectedSize && <span className="scp__selected">: {selectedSize}</span>}
          </h4>
          <div className="scp__sizes">
            {sizes.map((size) => (
              <button
                key={size}
                className={`scp__size-btn ${selectedSize === size ? 'scp__size-btn--active' : ''}`}
                onClick={() => onSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color picker - Read-only display */}
      {colors.length > 0 && (
        <div className="scp__group">
          <h4 className="scp__label">
            Màu sắc mẫu thiết kế
          </h4>
          <div className="scp__colors scp__colors--readonly">
            {colors.map((color) => (
              <div
                key={color}
                className="scp__color-badge"
                title={`Màu ${getColorName(color)}`}
              >
                <span
                  className="scp__color-swatch-sm"
                  style={{
                    backgroundColor: getColorHex(color),
                    border: (color === 'Trắng' || color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff') ? '1px solid #d1d5db' : 'none',
                  }}
                />
                <span className="scp__color-badge-text">{getColorName(color)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
