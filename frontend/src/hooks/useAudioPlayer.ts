import { useState, useEffect, useRef, useCallback } from 'react';
import { audioApi } from '@/api/audio';
import { analyticsApi } from '@/api/analytics';
import { useLanguage } from '@/contexts/LanguageContext';

// Keep a single audio element instance globally to prevent multiple audio tracks playing simultaneously
let globalAudio: HTMLAudioElement | null = null;
let activeSetPlaying: ((playing: boolean) => void) | null = null;
let activePoiId: number | null = null;

export function useAudioPlayer() {
  const { language } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPoiId, setCurrentPoiId] = useState<number | null>(null);

  // Reference to track callback without stale state
  const playingRef = useRef(playing);
  playingRef.current = playing;

  // Cleanup on unmount (if this specific hook instance is controlling the playing audio)
  useEffect(() => {
    return () => {
      // If we are the active controller and we unmount, we can pause
      if (currentPoiId === activePoiId && globalAudio) {
        // We do not force pause here so audio continues playing across page navigation,
        // but we clean up the setPlaying callback to avoid memory leaks.
        if (activeSetPlaying === setPlaying) {
          activeSetPlaying = null;
        }
      }
    };
  }, [currentPoiId]);

  const handleTimeUpdate = useCallback(() => {
    if (globalAudio) {
      setCurrentTime(globalAudio.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (globalAudio) {
      setDuration(globalAudio.duration);
      setLoading(false);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
    if (activeSetPlaying) {
      activeSetPlaying(false);
    }
  }, []);

  const handleWaiting = useCallback(() => {
    setLoading(true);
  }, []);

  const handlePlayingEvent = useCallback(() => {
    setLoading(false);
    setPlaying(true);
    if (activeSetPlaying) {
      activeSetPlaying(true);
    }
  }, []);

  const handleAudioError = useCallback(() => {
    setError('Failed to load audio');
    setLoading(false);
    setPlaying(false);
    if (activeSetPlaying) {
      activeSetPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (globalAudio && currentPoiId === activePoiId) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      setPlaying(false);
      if (activeSetPlaying) {
        activeSetPlaying(false);
      }
    }
  }, [currentPoiId]);

  const pause = useCallback(() => {
    if (globalAudio && currentPoiId === activePoiId) {
      globalAudio.pause();
      setPlaying(false);
      if (activeSetPlaying) {
        activeSetPlaying(false);
      }
    }
  }, [currentPoiId]);

  const seek = useCallback(
    (time: number) => {
      if (globalAudio && currentPoiId === activePoiId) {
        globalAudio.currentTime = time;
        setCurrentTime(time);
      }
    },
    [currentPoiId]
  );

  const setVolume = useCallback(
    (volume: number) => {
      if (globalAudio && currentPoiId === activePoiId) {
        // volume from 0 to 1
        globalAudio.volume = Math.max(0, Math.min(1, volume));
      }
    },
    [currentPoiId]
  );

  const play = useCallback(
    async (poiId: number, text: string) => {
      setError(null);

      // If playing the same POI and audio is already initialized
      if (activePoiId === poiId && globalAudio) {
        // If we are currently paused, just resume
        if (globalAudio.paused) {
          try {
            setLoading(true);
            await globalAudio.play();
            setPlaying(true);
            if (activeSetPlaying) activeSetPlaying(true);
          } catch (err) {
            setError('Playback failed to start');
            setLoading(false);
          }
        }
        return;
      }

      // If another POI is playing, stop it first
      if (globalAudio) {
        globalAudio.pause();
        globalAudio.src = '';
        if (activeSetPlaying) {
          activeSetPlaying(false);
        }
      }

      setLoading(true);
      setCurrentPoiId(poiId);
      activePoiId = poiId;
      activeSetPlaying = setPlaying;

      try {
        // Fetch TTS URL from API
        const { data } = await audioApi.getAudioUrl(text, language, poiId);
        
        if (!data.url) {
          throw new Error('No audio URL returned');
        }

        // Initialize audio element if not exists
        if (!globalAudio) {
          globalAudio = new Audio();
        }

        // Reset state
        setCurrentTime(0);
        setDuration(0);

        // Bind events
        globalAudio.onerror = handleAudioError;
        globalAudio.ontimeupdate = handleTimeUpdate;
        globalAudio.onloadedmetadata = handleLoadedMetadata;
        globalAudio.onended = handleEnded;
        globalAudio.onwaiting = handleWaiting;
        globalAudio.onplaying = handlePlayingEvent;

        // Set source and play
        globalAudio.src = data.url;
        globalAudio.load();
        await globalAudio.play();

        // Log audio play event as a manual visit
        try {
          await analyticsApi.logVisit({
            poiId,
            triggerType: 'manual',
            languageCode: language,
          });
        } catch (analyticsErr) {
          // Log failure is non-blocking for audio playback
          console.error('Failed to log audio visit analytics:', analyticsErr);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to play audio');
        setLoading(false);
        setPlaying(false);
        activePoiId = null;
        activeSetPlaying = null;
      }
    },
    [language, handleAudioError, handleTimeUpdate, handleLoadedMetadata, handleEnded, handleWaiting, handlePlayingEvent]
  );

  // Sync state if this POI is the active one
  useEffect(() => {
    if (globalAudio && currentPoiId === activePoiId) {
      setPlaying(!globalAudio.paused);
      setDuration(globalAudio.duration || 0);
      setCurrentTime(globalAudio.currentTime || 0);
      // Re-assign the active callback to this instance's state updater
      activeSetPlaying = setPlaying;
    }
  }, [currentPoiId]);

  return {
    playing,
    duration,
    currentTime,
    loading,
    error,
    currentPoiId,
    play,
    pause,
    stop,
    seek,
    setVolume,
  };
}

export default useAudioPlayer;
