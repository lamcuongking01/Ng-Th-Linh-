import { useEffect, useState } from 'react';
import FireworksCanvas from './components/FireworksCanvas';
import FloatingPetals from './components/FloatingPetals';
import Heart3DCanvas from './components/Heart3DCanvas';
import VinylMusicPlayer from './components/VinylMusicPlayer';
import BouquetStage from './components/stages/BouquetStage';
import FinaleStage from './components/stages/FinaleStage';
import GalleryStage from './components/stages/GalleryStage';
import IntroStage from './components/stages/IntroStage';
import LetterStage from './components/stages/LetterStage';
import WishesStage from './components/stages/WishesStage';
import type { TributeStage } from './data/tributeData';
import {
  playFinaleCelebrationSound,
  playOpenLetterSound,
  playTransitionSound,
} from './utils/soundEffects';

const NAV_STAGES: { id: TributeStage; label: string }[] = [
  { id: 'intro', label: 'Mở đầu' },
  { id: 'letter', label: 'Lá thư' },
  { id: 'bouquet', label: 'Bó hoa' },
  { id: 'wishes', label: 'Lời chúc' },
  { id: 'gallery', label: 'Album ảnh' },
];

const VALID_STAGES: TributeStage[] = [
  'intro',
  'letter',
  'bouquet',
  'wishes',
  'gallery',
  'finale',
];

function readInitialQueryParams(): { stage: TributeStage; instantUnlock: boolean } {
  if (typeof window === 'undefined') {
    return { stage: 'intro', instantUnlock: false };
  }
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const requestedStage = params.get('stage') as TributeStage | null;
  const stage: TributeStage =
    requestedStage && VALID_STAGES.includes(requestedStage)
      ? requestedStage
      : 'intro';
  return { stage, instantUnlock: autostart };
}

export default function App() {
  const initial = readInitialQueryParams();
  const [stage, setStage] = useState<TributeStage>(initial.stage);
  const [instantUnlock] = useState<boolean>(initial.instantUnlock);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);

  useEffect(() => {
    document.body.dataset.stage = stage;
  }, [stage]);

  const goToStage = (nextStage: TributeStage) => {
    if (nextStage === 'letter') {
      playOpenLetterSound();
      setAutoPlaySignal((n) => n + 1);
    } else if (nextStage === 'finale') {
      playFinaleCelebrationSound();
    } else {
      playTransitionSound();
    }
    setStage(nextStage);
  };

  const isFinale = stage === 'finale';

  return (
    <div
      data-testid="app-shell"
      data-stage={stage}
      className={`relative min-h-screen w-full transition-colors duration-700 ${
        isFinale
          ? 'bg-gradient-to-b from-[#3b0720] via-[#5c0b2e] to-[#831843] text-rose-50'
          : 'bg-gradient-to-b from-[#fff1f5] via-[#ffe4ec] to-[#fbcfe8] text-rose-950'
      }`}
    >
      {/* Persistent 3D Particle Heart Background */}
      <Heart3DCanvas mode={isFinale ? 'finale' : 'ambient'} />

      {/* Falling rose petals on tribute & finale stages */}
      {(stage === 'bouquet' ||
        stage === 'wishes' ||
        stage === 'gallery' ||
        stage === 'finale') && <FloatingPetals />}

      {/* Fireworks overlay during finale */}
      {isFinale && <FireworksCanvas />}

      {/* 3-Zone Top Bar Contract (no backdrop-blur over WebGL) */}
      <header
        className={`relative z-30 flex items-center justify-between gap-8 border-b px-4 py-3.5 sm:px-8 ${
          isFinale
            ? 'border-rose-300/20 bg-[#3b0720]/90 text-rose-50'
            : 'border-rose-200/80 bg-[#fff5f8]/92 text-rose-950'
        }`}
      >
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => goToStage('intro')}
          className="font-display text-left text-base font-bold tracking-tight whitespace-nowrap shrink-0 sm:text-lg"
        >
          Cô Ngô Thị Linh · 20/11
        </button>

        {/* Zone 2: Concise single-line stage links */}
        <nav
          aria-label="Chuyển trang lời chúc"
          className="hidden items-center gap-5 md:flex"
        >
          {NAV_STAGES.map((item) => {
            const active = stage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToStage(item.id)}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? isFinale
                      ? 'text-rose-200 underline underline-offset-4'
                      : 'text-rose-700 underline underline-offset-4'
                    : isFinale
                      ? 'text-rose-100/80 hover:text-white'
                      : 'text-rose-800/75 hover:text-rose-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => goToStage(isFinale ? 'intro' : 'finale')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isFinale
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {isFinale ? 'Về trang đầu' : 'Trang kết'}
          </button>
        </div>
      </header>

      {/* Main Stage Content */}
      <main className="relative z-20">
        {stage === 'intro' && (
          <IntroStage onOpenLetter={() => goToStage('letter')} />
        )}
        {stage === 'letter' && (
          <LetterStage
            onContinue={() => goToStage('bouquet')}
            instantUnlock={instantUnlock}
          />
        )}
        {stage === 'bouquet' && (
          <BouquetStage
            onNext={() => goToStage('wishes')}
            instantUnlock={instantUnlock}
          />
        )}
        {stage === 'wishes' && (
          <WishesStage onProceedToGallery={() => goToStage('gallery')} />
        )}
        {stage === 'gallery' && (
          <GalleryStage onFinish={() => goToStage('finale')} />
        )}
        {stage === 'finale' && (
          <FinaleStage onRestart={() => goToStage('intro')} />
        )}
      </main>

      {/* Bottom-left Spinning Vinyl Music Player */}
      <VinylMusicPlayer autoPlaySignal={autoPlaySignal} />
    </div>
  );
}
