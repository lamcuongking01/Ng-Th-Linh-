import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Disc3, Music2, Pause, Play, Upload } from 'lucide-react';
import { MUSIC_TRACKS, type MusicTrack } from '../data/tributeData';
import { getActiveLyricLine } from '../utils/heartTimeline';

// Gentle procedural piano progression fallback when external /bai1.mp3 or /bai2.mp3 is not yet placed in public/
const TRACK_MELODIES: Record<string, number[]> = {
  'track-1': [261.63, 329.63, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66],
  'track-2': [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63],
};

interface VinylMusicPlayerProps {
  autoPlaySignal?: number;
}

export default function VinylMusicPlayer({ autoPlaySignal = 0 }: VinylMusicPlayerProps) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});
  const [usingSynthFallback, setUsingSynthFallback] = useState(false);
  const hasInteractedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTrack: MusicTrack = MUSIC_TRACKS[trackIndex];
  const resolvedSrc = customUrls[activeTrack.id] ?? activeTrack.src;
  const activeLyric = getActiveLyricLine(
    activeTrack.lyrics,
    currentTime,
    activeTrack.durationSeconds
  );

  // Stop Web Audio synth helper
  const stopSynth = () => {
    if (synthTimerRef.current !== null) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
  };

  // Start gentle Web Audio API piano fallback
  const startSynth = (trackId: string) => {
    stopSynth();
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const notes = TRACK_MELODIES[trackId] ?? TRACK_MELODIES['track-1'];
    let step = 0;

    const playNote = () => {
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[step % notes.length], now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);
      step += 1;
    };

    playNote();
    synthTimerRef.current = window.setInterval(playNote, 900);
  };

  // Advance lyric clock smoothly while playing (works for both real MP3 and synth fallback)
  useEffect(() => {
    if (!isPlaying) {
      stopSynth();
      return;
    }

    const interval = window.setInterval(() => {
      const audio = audioRef.current;
      if (audio && !usingSynthFallback && !Number.isNaN(audio.currentTime) && !audio.paused) {
        setCurrentTime(audio.currentTime);
      } else {
        setCurrentTime((prev) => (prev + 0.25) % activeTrack.durationSeconds);
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [isPlaying, usingSynthFallback, activeTrack.durationSeconds]);

  useEffect(() => {
    return () => {
      stopSynth();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close();
      }
      Object.values(customUrls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attemptPlay = async (track: MusicTrack) => {
    const audio = audioRef.current;
    setIsPlaying(true);
    if (!audio) {
      setUsingSynthFallback(true);
      startSynth(track.id);
      return;
    }

    try {
      setUsingSynthFallback(false);
      stopSynth();
      await audio.play();
    } catch {
      // External /bai1.mp3 or /bai2.mp3 not yet uploaded or blocked -> engage gentle piano fallback
      setUsingSynthFallback(true);
      startSynth(track.id);
    }
  };

  useEffect(() => {
    if (autoPlaySignal > 0 && !isPlaying && !hasInteractedRef.current) {
      void attemptPlay(activeTrack);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlaySignal]);

  const togglePlay = () => {
    hasInteractedRef.current = true;
    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
      stopSynth();
    } else {
      void attemptPlay(activeTrack);
    }
  };

  const handleSelectTrack = (index: number) => {
    if (index === trackIndex) return;
    setTrackIndex(index);
    setCurrentTime(0);
    stopSynth();
    if (isPlaying) {
      window.setTimeout(() => {
        void attemptPlay(MUSIC_TRACKS[index]);
      }, 40);
    }
  };

  const handleUploadCustomMp3 = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCustomUrls((prev) => {
      const previous = prev[activeTrack.id];
      if (previous) URL.revokeObjectURL(previous);
      return { ...prev, [activeTrack.id]: objectUrl };
    });
    setUsingSynthFallback(false);
    setCurrentTime(0);
    window.setTimeout(() => {
      void attemptPlay(activeTrack);
    }, 50);
  };

  return (
    <aside
      aria-label="Trình phát nhạc tri ân"
      data-testid="vinyl-music-player"
      data-playing={isPlaying ? 'true' : 'false'}
      data-track={activeTrack.label}
      className="fixed bottom-3 left-3 z-40 w-[296px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-rose-200/90 bg-[#fff8fa]/95 p-2.5 shadow-lg shadow-rose-900/10"
    >
      <audio
        ref={audioRef}
        src={resolvedSrc}
        loop
        onError={() => {
          if (isPlaying) {
            setUsingSynthFallback(true);
            startSynth(activeTrack.id);
          }
        }}
      />

      <div className="flex items-center gap-2.5">
        {/* Spinning Vinyl Disc with lyrics badge right above */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative h-12 w-12">
            <div
              data-testid="vinyl-disc"
              className="vinyl-disc-spin relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-rose-300 bg-gradient-to-br from-rose-950 via-[#3b0720] to-rose-900 shadow-md"
              style={{
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            >
              <span className="absolute inset-1.5 rounded-full border border-rose-200/20" />
              <span className="absolute inset-3 rounded-full border border-rose-200/20" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-inner">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-0.5 h-5 w-1 origin-top rounded-full bg-rose-400 transition-transform duration-300"
              style={{
                transform: isPlaying ? 'rotate(24deg)' : 'rotate(4deg)',
              }}
            />
          </div>
        </div>

        {/* Lyrics right on/above the controls + Track Info */}
        <div className="min-w-0 flex-1">
          <div
            data-testid="vinyl-lyrics-box"
            className="mb-1.5 rounded-lg bg-rose-50 px-2 py-1"
          >
            <p className="truncate text-[11px] font-medium text-rose-950">
              {activeLyric?.text ?? 'Chạm Nghe nhạc để phát giai điệu 20/11'}
            </p>
          </div>

          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-[11px] font-semibold text-rose-800">
              {activeTrack.title}
            </p>
          </div>

          <div className="mt-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 whitespace-nowrap shrink-0"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isPlaying ? 'Dừng' : 'Nghe nhạc'}</span>
            </button>

            {MUSIC_TRACKS.map((track, idx) => (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelectTrack(idx)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  trackIndex === idx
                    ? 'bg-rose-200 text-rose-950'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {track.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Chọn file .mp3 từ máy"
              aria-label="Chọn file MP3 từ máy"
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 shrink-0"
            >
              <Upload className="h-3 w-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/*"
              onChange={handleUploadCustomMp3}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <span className="sr-only">
        {isPlaying ? (
          <>
            <Disc3 /> <Music2 /> Đang phát {activeTrack.title}
          </>
        ) : (
          'Đã tạm dừng'
        )}
      </span>
    </aside>
  );
}
