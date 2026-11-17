import { useState } from 'react';
import { ArrowRight, Heart, Images } from 'lucide-react';
import { AI_WISH_CARDS } from '../../data/tributeData';

interface WishesStageProps {
  onProceedToGallery: () => void;
}

export default function WishesStage({ onProceedToGallery }: WishesStageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const activeWish = AI_WISH_CARDS[selectedIndex];

  return (
    <section
      aria-label="Trang 3: Những lời chúc tri ân 20 tháng 11"
      data-testid="stage-wishes"
      className="relative z-20 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center px-4 py-8 pb-28 sm:pb-12"
    >
      <div className="rounded-3xl border border-rose-200 bg-[#fff9fb]/95 p-6 shadow-xl shadow-rose-900/10 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rose-100 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-600 uppercase">
              Trang 3 · Tuyển tập lời chúc 20/11
            </p>
            <h2 className="font-display mt-1.5 text-balance text-2xl font-semibold text-rose-950 sm:text-3xl">
              Những lời chúc dịu dàng gửi cô Ngô Thị Linh
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Chọn lời chúc"
            className="flex flex-wrap items-center gap-1.5 rounded-xl bg-rose-50 p-1"
          >
            {AI_WISH_CARDS.map((card, idx) => (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={selectedIndex === idx}
                onClick={() => setSelectedIndex(idx)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedIndex === idx
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-800 hover:bg-rose-100'
                }`}
              >
                Lời chúc {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid items-stretch gap-6 md:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50 md:col-span-5">
            {!imgFailed[activeWish.id] ? (
              <img
                src={activeWish.imageSrc}
                alt={activeWish.imageAlt}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImgFailed((prev) => ({ ...prev, [activeWish.id]: true }))
                }
                className="h-64 w-full object-cover md:h-full md:min-h-[290px]"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 bg-gradient-to-br from-rose-100 to-pink-200 p-6 text-rose-700 md:h-full">
                <Heart className="h-10 w-10 fill-rose-300" />
                <p className="font-display text-center text-base font-semibold">
                  {activeWish.title}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between md:col-span-7">
            <div>
              <p className="text-xs font-semibold text-rose-500">
                {activeWish.chapter}
              </p>
              <h3 className="font-display mt-2 text-2xl font-semibold text-rose-950">
                {activeWish.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-rose-900/90">
                “{activeWish.message}”
              </p>
              <p className="mt-4 text-sm font-semibold italic text-rose-700">
                — {activeWish.signature}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rose-100 pt-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) =>
                      prev === 0 ? AI_WISH_CARDS.length - 1 : prev - 1
                    )
                  }
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-800 transition-colors hover:bg-rose-50 whitespace-nowrap"
                >
                  Lời chúc trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev + 1) % AI_WISH_CARDS.length)
                  }
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-800 transition-colors hover:bg-rose-50 whitespace-nowrap"
                >
                  Xem lời chúc khác
                </button>
              </div>

              <button
                type="button"
                onClick={onProceedToGallery}
                data-testid="btn-wishes-to-gallery"
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition-colors hover:bg-rose-700 whitespace-nowrap"
              >
                <Images className="h-4 w-4" />
                <span>Trưng ảnh kỷ niệm</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
