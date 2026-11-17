import { useEffect, useState } from 'react';
import { ArrowRight, Feather } from 'lucide-react';
import { TEACHER_LETTER } from '../../data/tributeData';

interface LetterStageProps {
  onContinue: () => void;
  instantUnlock?: boolean;
}

const WAIT_SECONDS = 5;

export default function LetterStage({ onContinue, instantUnlock = false }: LetterStageProps) {
  const [secondsLeft, setSecondsLeft] = useState(instantUnlock ? 0 : WAIT_SECONDS);

  useEffect(() => {
    if (instantUnlock) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(WAIT_SECONDS);
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [instantUnlock]);

  const canContinue = secondsLeft === 0;

  return (
    <section
      aria-label="Lá thư gửi cô Ngô Thị Linh"
      data-testid="stage-letter"
      className="relative z-20 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 pb-28 sm:pb-12"
    >
      <article className="w-full max-w-2xl rounded-3xl border border-rose-200 bg-[#fff9fb]/95 p-6 shadow-xl shadow-rose-900/10 sm:p-10">
        <div className="flex items-center justify-between border-b border-rose-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-rose-600">
            <Feather className="h-4 w-4" />
            <span>{TEACHER_LETTER.dateLine}</span>
          </div>
          <span className="text-xs font-medium text-rose-500">
            Trang 1 · Lá thư tri ân
          </span>
        </div>

        <h2 className="font-display mt-6 text-2xl font-semibold text-rose-950 sm:text-3xl">
          {TEACHER_LETTER.greeting}
        </h2>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-rose-900/90 sm:text-base sm:leading-7">
          {TEACHER_LETTER.paragraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        <p className="font-display mt-6 text-right text-base font-semibold italic text-rose-700">
          — {TEACHER_LETTER.closing} —
        </p>

        <div className="mt-8 flex min-h-[48px] items-center justify-center border-t border-rose-100 pt-6">
          {canContinue ? (
            <button
              type="button"
              onClick={onContinue}
              data-testid="btn-letter-continue"
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition-all hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 whitespace-nowrap"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs font-medium text-rose-600">
                Nút “Tiếp tục” sẽ hiện sau {secondsLeft} giây...
              </p>
              <div className="h-1.5 w-44 overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((WAIT_SECONDS - secondsLeft) / WAIT_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
