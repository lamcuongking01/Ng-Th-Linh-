import { useEffect, useState } from 'react';
import { ArrowRight, Flower2 } from 'lucide-react';
import { BOUQUET_IMAGE_SRC, TEACHER_HONORIFIC } from '../../data/tributeData';

interface BouquetStageProps {
  onNext: () => void;
  instantUnlock?: boolean;
}

const WAIT_SECONDS = 3;

export default function BouquetStage({ onNext, instantUnlock = false }: BouquetStageProps) {
  const [secondsLeft, setSecondsLeft] = useState(instantUnlock ? 0 : WAIT_SECONDS);
  const [imgFailed, setImgFailed] = useState(false);

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

  const canNext = secondsLeft === 0;

  return (
    <section
      aria-label="Bó hoa hồng phấn dâng tặng cô"
      data-testid="stage-bouquet"
      className="relative z-20 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 pb-28 sm:pb-12"
    >
      <div className="grid w-full max-w-4xl items-stretch gap-8 rounded-3xl border border-rose-200 bg-[#fff9fb]/95 p-6 shadow-xl shadow-rose-900/10 md:grid-cols-2 md:p-8">
        <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
          {!imgFailed ? (
            <img
              src={BOUQUET_IMAGE_SRC}
              alt="Bó hoa hồng phấn và mẫu đơn tinh khôi tặng cô Ngô Thị Linh"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full max-h-[460px] w-full object-cover"
            />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-3 bg-gradient-to-br from-rose-100 to-pink-200 p-6 text-rose-800">
              <Flower2 className="h-12 w-12" />
              <p className="font-display text-lg font-semibold">
                Bó hoa hồng phấn tặng cô Ngô Thị Linh
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between py-2">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-600 uppercase">
              Trang 2 · Bó hoa tươi thắm nhất
            </p>
            <h2 className="font-display mt-2 text-balance text-3xl font-semibold text-rose-950">
              Đóa hoa hồng phấn kính dâng {TEACHER_HONORIFIC}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-rose-900/85 sm:text-base">
              Mỗi đóa hồng phấn và cánh mẫu đơn trong bó hoa này tượng trưng cho lòng biết
              ơn dịu dàng và sự kính trọng sâu sắc của 45 học sinh gửi đến cô trong ngày
              vui 20/11.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-rose-900/80">
              Chúc cô luôn tỏa hương sắc, giữ mãi nét dịu hiền và niềm vui trên từng trang
              giáo án.
            </p>
          </div>

          <div className="mt-8 flex min-h-[48px] items-center justify-start border-t border-rose-100 pt-6">
            {canNext ? (
              <button
                type="button"
                onClick={onNext}
                data-testid="btn-bouquet-next"
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition-all hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 whitespace-nowrap"
              >
                <span>Tiếp theo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-rose-600">
                  “Tiếp theo” sẽ xuất hiện sau {secondsLeft} giây...
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
        </div>
      </div>
    </section>
  );
}
