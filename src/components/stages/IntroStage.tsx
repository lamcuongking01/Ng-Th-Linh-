import { Heart, MailOpen } from 'lucide-react';
import { TEACHER_HONORIFIC } from '../../data/tributeData';

interface IntroStageProps {
  onOpenLetter: () => void;
}

export default function IntroStage({ onOpenLetter }: IntroStageProps) {
  return (
    <section
      aria-label="Mở đầu lời chúc 20 tháng 11"
      data-testid="stage-intro"
      className="relative z-20 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-between px-4 py-10 text-center"
    >
      <div className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-rose-700/90 uppercase">
          Ngày Nhà Giáo Việt Nam 20 · 11
        </p>
        <h1 className="font-display mt-3 text-balance text-4xl font-semibold tracking-tight text-rose-950 sm:text-5xl">
          Gửi trọn yêu thương đến {TEACHER_HONORIFIC}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-rose-900/85 sm:text-base">
          Những hạt ánh sáng đang kết thành nhịp đập trái tim từ tấm lòng của 45 học trò.
          Mời cô chạm vào nút bên dưới để mở lá thư tri ân.
        </p>
      </div>

      {/* Central breathing room so the 3D particle heart stays 100% unobstructed */}
      <div className="h-44 sm:h-56" aria-hidden="true" />

      <div className="relative mb-20 sm:mb-10">
        <span
          aria-hidden="true"
          className="float-gentle pointer-events-none absolute -inset-1.5 rounded-full bg-rose-400/35 blur-md"
        />
        <button
          type="button"
          onClick={onOpenLetter}
          data-testid="btn-open-letter"
          className="group relative inline-flex items-center gap-3 rounded-full border border-rose-300 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-rose-500/30 transition-colors duration-200 hover:from-rose-700 hover:to-pink-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600 whitespace-nowrap"
        >
          <MailOpen className="h-5 w-5 transition-transform duration-200 group-hover:-rotate-6" />
          <span>Mở lá thư gửi cô</span>
          <Heart className="h-4 w-4 fill-rose-200 text-rose-100" />
        </button>
      </div>
    </section>
  );
}
