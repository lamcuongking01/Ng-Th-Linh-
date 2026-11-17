import type { StudentEntry } from '../../data/tributeData';

interface StudentMarqueeColumnProps {
  students: readonly StudentEntry[];
  paused: boolean;
  sideLabel: string;
}

export default function StudentMarqueeColumn({
  students,
  paused,
  sideLabel,
}: StudentMarqueeColumnProps) {
  const doubled = [...students, ...students];

  return (
    <div
      aria-label={sideLabel}
      data-testid="student-marquee-column"
      className="relative h-[260px] overflow-hidden rounded-2xl border border-rose-300/35 bg-rose-950/65 px-2 py-2 sm:px-3 md:h-[430px]"
    >
      {/* Top & bottom gradient fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-9 bg-gradient-to-b from-rose-950/90 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-9 bg-gradient-to-t from-rose-950/90 to-transparent"
      />

      <ul
        className="credits-scroll-up space-y-1.5 py-2 sm:space-y-2"
        style={{
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {doubled.map((student, idx) => (
          <li
            key={`${student.index}-${idx}`}
            className="flex items-center gap-2 rounded-lg bg-rose-900/45 px-2.5 py-1.5 text-[11px] font-medium text-rose-50 sm:gap-2.5 sm:px-3 sm:text-sm"
          >
            <span className="tabular-nums text-[10px] font-semibold text-rose-300 sm:text-[11px]">
              {String(student.index).padStart(2, '0')}
            </span>
            <span className="truncate">{student.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
