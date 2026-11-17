import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Sparkles, Square } from 'lucide-react';
import { GALLERY_PHOTOS } from '../../data/tributeData';

interface GalleryStageProps {
  onFinish: () => void;
}

export default function GalleryStage({ onFinish }: GalleryStageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');
  const [fallbackActive, setFallbackActive] = useState<Record<string, boolean>>({});
  const dragStartXRef = useRef<number | null>(null);

  const currentPhoto = GALLERY_PHOTOS[activeIndex];

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? GALLERY_PHOTOS.length - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % GALLERY_PHOTOS.length);
  };

  const handlePointerDown = (clientX: number) => {
    dragStartXRef.current = clientX;
  };

  const handlePointerUp = (clientX: number) => {
    if (dragStartXRef.current === null) return;
    const deltaX = clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  return (
    <section
      aria-label="Trang 4: Trưng ảnh kỷ niệm và lời chúc dưới mỗi bức ảnh"
      data-testid="stage-gallery"
      className="relative z-20 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center px-4 py-8 pb-28 sm:pb-12"
    >
      <div className="rounded-3xl border border-rose-200 bg-[#fff9fb]/95 p-6 shadow-xl shadow-rose-900/10 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-100 pb-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-600 uppercase">
              Trang 4 · Phòng trưng bày kỷ niệm
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-rose-950 sm:text-3xl">
              Mỗi bức ảnh là một lời chúc gửi cô
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-rose-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('swipe')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'swipe'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-800 hover:bg-rose-100'
              }`}
            >
              <Square className="h-3.5 w-3.5" />
              <span>Vuốt từng ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-800 hover:bg-rose-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Xem tất cả</span>
            </button>
          </div>
        </div>

        {viewMode === 'swipe' ? (
          <div className="mt-4">
            <div
              onPointerDown={(e) => handlePointerDown(e.clientX)}
              onPointerUp={(e) => handlePointerUp(e.clientX)}
              className="mx-auto max-w-2xl select-none overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm"
            >
              <div className="relative h-64 w-full overflow-hidden bg-rose-50 sm:h-80">
                <img
                  src={
                    fallbackActive[currentPhoto.id]
                      ? currentPhoto.fallbackSrc
                      : currentPhoto.imageSrc
                  }
                  alt={currentPhoto.imageAlt}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFallbackActive((prev) => ({ ...prev, [currentPhoto.id]: true }))
                  }
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Ảnh trước"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-rose-900 shadow-md transition-colors hover:bg-rose-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Ảnh tiếp theo"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-rose-900 shadow-md transition-colors hover:bg-rose-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Dedicated wish underneath this photo */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-rose-500">
                  {currentPhoto.subtitle} · {activeIndex + 1}/{GALLERY_PHOTOS.length}
                </p>
                <h3 className="font-display mt-1 text-lg font-semibold text-rose-950 sm:text-xl">
                  {currentPhoto.title}
                </h3>
                <p
                  data-testid="gallery-photo-wish"
                  className="mt-1.5 text-sm leading-relaxed text-rose-900/90"
                >
                  {currentPhoto.wishText}
                </p>
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="mt-4 flex items-center justify-center gap-2.5 overflow-x-auto py-1">
              {GALLERY_PHOTOS.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Xem ${photo.title}`}
                  className={`h-14 w-20 overflow-hidden rounded-xl border-2 transition-all shrink-0 ${
                    idx === activeIndex
                      ? 'border-rose-600 ring-2 ring-rose-300'
                      : 'border-rose-100 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={fallbackActive[photo.id] ? photo.fallbackSrc : photo.imageSrc}
                    alt={photo.imageAlt}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFallbackActive((prev) => ({ ...prev, [photo.id]: true }))
                    }
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {GALLERY_PHOTOS.map((photo) => (
              <article
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-rose-50">
                  <img
                    src={fallbackActive[photo.id] ? photo.fallbackSrc : photo.imageSrc}
                    alt={photo.imageAlt}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFallbackActive((prev) => ({ ...prev, [photo.id]: true }))
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-rose-500">{photo.subtitle}</p>
                  <h3 className="font-display mt-1 text-lg font-semibold text-rose-950">
                    {photo.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-rose-900/90">
                    {photo.wishText}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rose-100 pt-5">
          <p className="text-xs text-rose-700/85">
            Vuốt trái hoặc phải để xem hết các bức ảnh kỷ niệm cùng lời chúc bên dưới.
          </p>

          <button
            type="button"
            onClick={onFinish}
            data-testid="btn-gallery-finish"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4" />
            <span>Kết thúc</span>
          </button>
        </div>
      </div>
    </section>
  );
}
