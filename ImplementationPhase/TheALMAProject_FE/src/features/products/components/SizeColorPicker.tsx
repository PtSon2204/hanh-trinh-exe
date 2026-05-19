
interface Props {
  sizes: string[];
  colors: string[];
  selectedSize?: string;
  selectedColor?: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
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

function getColorHex(name: string): string {
  return COLOR_MAP[name] || '#94a3b8';
}

export default function SizeColorPicker({
  sizes,
  colors,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
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

      {/* Color picker */}
      {colors.length > 0 && (
        <div className="scp__group">
          <h4 className="scp__label">
            Màu sắc
            {selectedColor && <span className="scp__selected">: {selectedColor}</span>}
          </h4>
          <div className="scp__colors">
            {colors.map((color) => (
              <button
                key={color}
                className={`scp__color-btn ${selectedColor === color ? 'scp__color-btn--active' : ''}`}
                onClick={() => onColorChange(color)}
                title={color}
                aria-label={`Màu ${color}`}
              >
                <span
                  className="scp__color-swatch"
                  style={{
                    backgroundColor: getColorHex(color),
                    border: color === 'Trắng' ? '2px solid #d1d5db' : 'none',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
