import { useState } from 'react';

interface Props {
  images: string[];
}

export default function ImageGallery({ images }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const validImages = images.filter(Boolean);

  if (validImages.length === 0) {
    return (
      <div className="ig-gallery">
        <div className="ig-main">
          <img src="/images/placeholder-product.png" alt="No image" className="ig-main__img" />
        </div>
      </div>
    );
  }

  return (
    <div className="ig-gallery" id="product-gallery">
      <div className="ig-main">
        <img
          src={validImages[activeIdx]}
          alt={`Ảnh sản phẩm ${activeIdx + 1}`}
          className="ig-main__img"
        />
        {validImages.length > 1 && (
          <>
            <button
              className="ig-main__nav ig-main__nav--prev"
              onClick={() => setActiveIdx((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))}
              aria-label="Ảnh trước"
            >
              ‹
            </button>
            <button
              className="ig-main__nav ig-main__nav--next"
              onClick={() => setActiveIdx((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))}
              aria-label="Ảnh sau"
            >
              ›
            </button>
          </>
        )}
        <div className="ig-main__counter">
          {activeIdx + 1} / {validImages.length}
        </div>
      </div>

      {validImages.length > 1 && (
        <div className="ig-thumbs">
          {validImages.map((src, i) => (
            <button
              key={i}
              className={`ig-thumb ${i === activeIdx ? 'ig-thumb--active' : ''}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`Ảnh ${i + 1}`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
