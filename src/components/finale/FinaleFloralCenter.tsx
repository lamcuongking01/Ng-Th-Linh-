import { useState } from 'react';
import { Flower2 } from 'lucide-react';
import {
  BOUQUET_IMAGE_SRC,
  SILK_PETALS_IMAGE_SRC,
  TEACHER_NAME,
} from '../../data/tributeData';

export default function FinaleFloralCenter() {
  const [leftFailed, setLeftFailed] = useState(false);
  const [rightFailed, setRightFailed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-4 text-center md:py-16">
      <div className="relative rounded-3xl border border-rose-200/30 bg-rose-950/40 px-6 py-5 shadow-2xl sm:px-8 sm:py-6">
        {/* Decorative floral medallions flanking the teacher name */}
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-rose-200/60 bg-rose-900/60 shadow-md">
            {!leftFailed ? (
              <img
                src={BOUQUET_IMAGE_SRC}
                alt="Hoa hồng phấn tri ân cô"
                referrerPolicy="no-referrer"
                onError={() => setLeftFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-rose-200">
                <Flower2 className="h-5 w-5" />
              </div>
            )}
          </div>

          <Flower2 className="h-6 w-6 text-rose-300" aria-hidden="true" />

          <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-rose-200/60 bg-rose-900/60 shadow-md">
            {!rightFailed ? (
              <img
                src={SILK_PETALS_IMAGE_SRC}
                alt="Cánh hoa mẫu đơn hồng phấn"
                referrerPolicy="no-referrer"
                onError={() => setRightFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-rose-200">
                <Flower2 className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        <p className="text-xs font-semibold tracking-widest text-rose-200 uppercase">
          Trái tim 45 học trò hướng về cô
        </p>
        <h2
          data-testid="finale-teacher-name"
          className="font-display mt-2 text-balance text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl"
        >
          {TEACHER_NAME}
        </h2>
        <p className="mt-2 text-xs text-rose-100/90 sm:text-sm">
          Hạt ánh sáng lan tỏa 6 giây · Kết thành trái tim lớn sau 15 giây
        </p>
      </div>
    </div>
  );
}
