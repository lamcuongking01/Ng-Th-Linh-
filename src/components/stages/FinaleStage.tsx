import { useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import {
  FINALE_TRIBUTE_WISH,
  LEFT_COLUMN_STUDENTS,
  RIGHT_COLUMN_STUDENTS,
} from '../../data/tributeData';
import FinaleFloralCenter from '../finale/FinaleFloralCenter';
import StudentMarqueeColumn from '../finale/StudentMarqueeColumn';

interface FinaleStageProps {
  onRestart: () => void;
}

export default function FinaleStage({ onRestart }: FinaleStageProps) {
  const [scrollPaused, setScrollPaused] = useState(false);

  return (
    <section
      aria-label="Lời chúc kết và danh sách 45 học sinh tri ân cô Ngô Thị Linh"
      data-testid="stage-finale"
      className="relative z-20 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-between px-3 py-5 pb-36 sm:px-4 sm:pb-14"
    >
      {/* Top closing wish */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-300/35 bg-rose-950/75 px-5 py-3.5 text-center text-rose-50 shadow-lg sm:px-6 sm:py-4">
        <p className="text-xs font-semibold tracking-widest text-rose-300 uppercase">
          Tri Ân Ngày Nhà Giáo Việt Nam 20 · 11
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-rose-50/95 sm:text-base">
          {FINALE_TRIBUTE_WISH}
        </p>
      </div>

      {/* Desktop/Tablet: Left Names | Center Ngô Thị Linh + Flowers | Right Names */}
      {/* Mobile: Center Ngô Thị Linh + Flowers on top, 2 side-by-side scrolling columns below */}
      <div className="my-5 grid grid-cols-2 items-center gap-2.5 sm:gap-4 md:grid-cols-12">
        <div className="order-2 col-span-1 md:order-1 md:col-span-3">
          <StudentMarqueeColumn
            students={LEFT_COLUMN_STUDENTS}
            paused={scrollPaused}
            sideLabel="Danh sách học sinh 1 đến 23"
          />
        </div>

        <div className="order-1 col-span-2 md:order-2 md:col-span-6">
          <FinaleFloralCenter />
        </div>

        <div className="order-3 col-span-1 md:order-3 md:col-span-3">
          <StudentMarqueeColumn
            students={RIGHT_COLUMN_STUDENTS}
            paused={scrollPaused}
            sideLabel="Danh sách học sinh 24 đến 45"
          />
        </div>
      </div>

      {/* Bottom Finale Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setScrollPaused((p) => !p)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-300/40 bg-rose-950/80 px-5 py-2.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-900 whitespace-nowrap"
        >
          {scrollPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span>{scrollPaused ? 'Tiếp tục trôi tên' : 'Tạm dừng trôi tên'}</span>
        </button>

        <button
          type="button"
          onClick={onRestart}
          data-testid="btn-finale-restart"
          className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-rose-600 whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Xem lại từ đầu</span>
        </button>
      </div>
    </section>
  );
}
