import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { audioApi } from '@/api/audio';
import { translationsApi } from '@/api/translations';
import { analyticsApi } from '@/api/analytics';
import { formatDuration } from '@/utils/format';
import { Play, Pause, Volume2, VolumeX, AlertCircle, Headphones, Globe } from 'lucide-react';

interface AudioPlayerProps {
  poiId: number;
  audioText?: string;
  languageCode?: string;
  audioUrl?: string;
}

// Fixed pseudo-random idle bar heights (seeded by index) to look organic, not all flat
const IDLE_BAR_HEIGHTS = [4, 8, 6, 10, 5, 12, 7, 9, 4, 11, 6, 8];

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'km', name: 'ភាសាខ្មែរ', flag: '🇰🇭' },
];

export default function AudioPlayer({
  poiId,
  audioText = '',
  languageCode = 'en',
  audioUrl,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loggedUrlRef = useRef<string | null>(null);

  const [activeLang, setActiveLang] = useState(languageCode);
  const [activeText, setActiveText] = useState(audioText);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Sync props when POI or global app language changes
  useEffect(() => {
    setActiveLang(languageCode);
  }, [languageCode]);

  useEffect(() => {
    setActiveText(audioText);
  }, [audioText]);

  // 1. Resolve Audio URL from backend API if text and language are set
  useEffect(() => {
    if (audioUrl && activeLang === languageCode) {
      setResolvedUrl(audioUrl);
      setError(null);
      return;
    }

    if (!activeText) {
      setResolvedUrl(null);
      return;
    }

    let isSubscribed = true;
    const fetchAudio = async () => {
      setLoading(true);
      setError(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      try {
        const response = await audioApi.getAudioUrl(activeText, activeLang, poiId);
        if (isSubscribed) {
          setResolvedUrl(response.data.url);
        }
      } catch (err) {
        console.error('Error fetching POI audio guide:', err);
        if (isSubscribed) {
          setError(t('audio.fetchFailed', 'Could not load audio guide'));
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchAudio();

    return () => {
      isSubscribed = false;
    };
  }, [poiId, activeText, activeLang, audioUrl, languageCode]);

  // 2. Reset playback state when source URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [resolvedUrl]);

  // 3. Audio Controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Audio play error:', err);
        setError(t('audio.playbackFailed', 'Unable to play audio'));
      });
    }
  };

  const handlePlay = async () => {
    setIsPlaying(true);
    if (resolvedUrl && loggedUrlRef.current !== resolvedUrl) {
      loggedUrlRef.current = resolvedUrl;
      const sessionId = localStorage.getItem('vk_session_id') || undefined;
      try {
        await analyticsApi.logVisit({
          poiId,
          triggerType: 'manual',
          languageCode: activeLang,
          sessionId,
        });
      } catch (err) {
        console.error('Failed to log audio play visit:', err);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const vol = parseFloat(e.target.value);
    audioRef.current.volume = vol;
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 4. Handle Commentary Language Change
  const handleLanguageChange = async (newLang: string) => {
    if (newLang === activeLang) return;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    try {
      const response = await translationsApi.getTranslation(poiId, newLang);
      setActiveText(response.data.audioText || '');
      setActiveLang(newLang);
    } catch (err) {
      console.error('Error changing audio language:', err);
      setError(t('audio.translateFailed', 'Could not translate audio guide to selected language'));
    } finally {
      setLoading(false);
    }
  };

  // Seek progress % for custom slider track fill
  const seekProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeProgress = isMuted ? 0 : volume * 100;

  const waveBarsCount = 12;
  const waveBars = useMemo(() => Array.from({ length: waveBarsCount }), []);

  return (
    <div className="w-full p-4 rounded-[var(--radius-lg)] border border-border bg-card shadow-sm flex flex-col gap-3 relative animate-scale-in">
      {/* Title / Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 text-text-primary min-w-0">
          <Headphones size={16} className="text-primary shrink-0" aria-hidden="true" />
          <span className="font-display font-bold text-sm tracking-tight truncate">
            {t('audio.title', 'Thuyết Minh Âm Thanh')}
          </span>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="audio-waveform h-5 flex items-center gap-0.5 px-1 shrink-0" aria-hidden="true">
          {waveBars.map((_, i) => (
            <div
              key={i}
              className={`audio-waveform-bar w-[2px] rounded-full transition-all duration-300 ${
                isPlaying ? 'wave-bar-anim bg-primary' : 'bg-primary/35'
              }`}
              style={{
                height: isPlaying ? undefined : `${IDLE_BAR_HEIGHTS[i] / 2}px`,
                animationDelay: isPlaying ? `-${(i * 0.12).toFixed(2)}s` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Language Selector Row */}
      <div className="flex items-center gap-1.5 px-1 pb-1 border-b border-border/30">
        <Globe size={13} className="text-primary shrink-0" />
        <span className="text-[11px] text-text-secondary font-semibold">{t('audio.selectLanguage', 'Ngôn ngữ thuyết minh:')}</span>
        <select
          value={activeLang}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={loading}
          className="text-xs border-0 bg-transparent py-0.5 font-bold text-primary focus:outline-none cursor-pointer outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-card text-text-primary">
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status region for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {loading && t('audio.loading', 'Loading audio...')}
        {error && error}
        {isPlaying && t('audio.playing', 'Playing')}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-danger/5 border border-danger-light text-danger text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* HTML Audio element */}
      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          onPlay={handlePlay}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          onError={() => setError(t('audio.loadError', 'Error loading audio file'))}
        />
      )}

      {/* Main player controls container */}
      <div className="flex flex-col gap-2">
        {/* Seek Bar — custom track fill via CSS linear-gradient */}
        <div className="flex items-center gap-2.5 text-xs text-text-secondary">
          <span className="font-mono tabular-nums w-8 text-right">
            {formatDuration(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!resolvedUrl || loading}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none audio-range-seek disabled:opacity-40"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${seekProgress}%, var(--color-surface-alt) ${seekProgress}%)`,
            }}
            aria-label={t('audio.seekLabel', 'Seek audio')}
            aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(duration)}`}
          />

          <span className="font-mono tabular-nums w-8">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between mt-1 gap-2">
          {/* Play / Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={!resolvedUrl || loading}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-primary hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:pointer-events-none outline-none shrink-0"
            aria-label={isPlaying ? t('audio.pause', 'Pause') : t('audio.play', 'Play')}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : isPlaying ? (
              <Pause size={18} className="fill-current" aria-hidden="true" />
            ) : (
              <Play size={18} className="fill-current translate-x-0.5" aria-hidden="true" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              disabled={!resolvedUrl}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none border-0 disabled:opacity-40"
              aria-label={isMuted ? t('audio.unmute', 'Unmute') : t('audio.mute', 'Mute')}
            >
              {isMuted || volume === 0
                ? <VolumeX size={16} aria-hidden="true" />
                : <Volume2 size={16} aria-hidden="true" />
              }
            </button>

            {/* Volume slider — custom track fill */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={!resolvedUrl}
              className="w-16 h-1 rounded-full appearance-none cursor-pointer focus:outline-none audio-range-seek disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, var(--color-primary) ${volumeProgress}%, var(--color-surface-alt) ${volumeProgress}%)`,
              }}
              aria-label={t('audio.volumeLabel', 'Volume')}
            />
          </div>
        </div>

        {/* Transcript Section */}
        {activeText && (
          <div className="border-t border-border/40 pt-2 mt-2">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none border-0 py-1"
              aria-expanded={showTranscript}
            >
              <span>{t('audio.transcriptTitle', 'Văn bản thuyết minh')}</span>
              <span className="text-[10px] text-primary">
                {showTranscript ? t('audio.hideTranscript', 'Ẩn') : t('audio.showTranscript', 'Xem')}
              </span>
            </button>

            {showTranscript && (
              <div className="mt-2 p-2.5 rounded-md bg-surface-alt/70 border border-border/40 text-xs text-text-secondary leading-relaxed whitespace-pre-line max-h-28 overflow-y-auto scrollbar-thin animate-slide-in-top">
                {activeText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
