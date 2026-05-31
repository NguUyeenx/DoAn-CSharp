import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ExternalLink 
} from 'lucide-react';

import { api } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { useNarrationStore } from '../stores/narrationStore';
import type { POI, MenuItem } from '../types/poi';

export default function POIDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const language = useSettingsStore((state) => state.language);
  const { isPlaying, setPlaying, setCurrentItem } = useNarrationStore();

  const poiId = Number(id);

  // Fetch full POI details
  const { data: poi, isLoading } = useQuery<POI>({
    queryKey: ['poi', poiId, language],
    queryFn: () => api.get<POI>(`/pois/${poiId}?lang=${language}`),
    enabled: !isNaN(poiId),
  });

  // Fetch menu items if it's a restaurant
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu', poiId, language],
    queryFn: () => api.get<MenuItem[]>(`/pois/${poiId}/menu?lang={language}`),
    enabled: !isNaN(poiId) && poi?.category === 'restaurant',
  });

  // Log "manual" visit on page load
  useEffect(() => {
    if (isNaN(poiId)) return;

    const logManualVisit = async () => {
      try {
        await api.post('/analytics/visit', {
          poiId,
          sessionId: 'anonymous-visitor',
          triggerType: 'manual',
          languageCode: language,
        });
      } catch (err) {
        console.error('Failed to log manual visit:', err);
      }
    };

    logManualVisit();
  }, [poiId, language]);

  const playTextToSpeech = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 1.0;
    
    utterance.onstart = () => {
      setPlaying(true);
      setCurrentItem({
        poiId,
        poiName: poi?.localizedName || poi?.name || '',
        source: 'tts',
        text: text,
        language: language,
        priority: poi?.priority || 1,
      });
    };
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlaying(true);
      } else {
        const audioText = language === 'vi'
          ? poi?.translations.find(t => t.languageCode === 'vi')?.audioText || poi?.audioText
          : poi?.translations.find(t => t.languageCode === 'en')?.audioText || poi?.audioText;
        if (audioText) {
          playTextToSpeech(audioText);
        }
      }
    }
  };

  // Cancel narration when navigating away
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setPlaying(false);
    };
  }, [setPlaying]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center text-zinc-500 bg-zinc-950">
        <div className="w-8 h-8 border-4 border-t-emerald-500 border-zinc-800 rounded-full animate-spin mb-2"></div>
        <span className="text-xs font-semibold">{language === 'vi' ? 'Đang tải thông tin...' : 'Loading details...'}</span>
      </div>
    );
  }

  if (!poi) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center text-zinc-400 bg-zinc-950">
        <span className="text-3xl mb-2">📍</span>
        <h2 className="text-xl font-bold mb-1">{language === 'vi' ? 'Không tìm thấy địa điểm' : 'POI not found'}</h2>
        <p className="text-xs text-zinc-500 mb-4">{language === 'vi' ? 'Địa điểm này có thể đã bị xóa hoặc không hoạt động.' : 'This location might have been deleted or deactivated.'}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200">
          {language === 'vi' ? 'Quay lại' : 'Go back'}
        </button>
      </div>
    );
  }

  const audioTextStr = language === 'vi'
    ? poi.translations.find(t => t.languageCode === 'vi')?.audioText || poi.audioText
    : poi.translations.find(t => t.languageCode === 'en')?.audioText || poi.audioText;

  return (
    <div className="bg-zinc-950 min-h-[calc(100vh-64px)] pb-24 text-white">
      {/* Hero Banner with Fading Gradient */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-zinc-900">
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.localizedName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-5xl">📍</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
        
        {/* Floating Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-zinc-950/70 border border-zinc-800/50 rounded-full hover:bg-zinc-950 hover:text-white transition-all text-zinc-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Main Details Body */}
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-6 -mt-10 relative z-10">
        <div>
          <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            {poi.category}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-2 mb-1">
            {poi.localizedName}
          </h1>
          {poi.name !== poi.localizedName && (
            <p className="text-xs text-zinc-500 italic">Original: {poi.name}</p>
          )}
        </div>

        {/* Audio Player Controls widget */}
        {audioTextStr && (
          <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-900 p-4 rounded-2xl">
            <button
              onClick={handleTogglePlayback}
              className="p-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full shadow transition-all hover:scale-105"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col gap-0.5 text-left">
              <span className="text-sm font-semibold text-zinc-300">
                {language === 'vi' ? 'Thuyết minh thông tin' : 'Narration Audio Guide'}
              </span>
              <span className="text-xs text-zinc-500">
                {isPlaying ? (language === 'vi' ? 'Đang đọc nội dung thuyết minh...' : 'Playing speech synthesis...') : (language === 'vi' ? 'Sẵn sàng thuyết minh' : 'Ready to narrate')}
              </span>
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide uppercase text-zinc-500">
            {language === 'vi' ? 'Lịch sử & Chi tiết' : 'History & Details'}
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
            {poi.fullDescription || poi.shortDescription}
          </p>
        </div>

        {/* Menu Section */}
        {poi.category === 'restaurant' && menuItems.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-zinc-500">
              {language === 'vi' ? 'Thực đơn song ngữ' : 'Bilingual Food Menu'}
            </h3>
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-900/50 transition-colors"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.localizedName}
                      className="w-16 h-16 object-cover rounded-xl border border-zinc-900"
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-center text-left">
                    <span className="font-semibold text-sm text-zinc-200">{item.localizedName}</span>
                    {item.name !== item.localizedName && (
                      <span className="text-[10px] text-zinc-500 italic">({item.name})</span>
                    )}
                    <span className="text-xs text-zinc-400 mt-0.5 leading-snug line-clamp-2">{item.localizedDescription}</span>
                    <span className="text-xs font-semibold text-emerald-400 mt-1">
                      {item.price.toLocaleString()} {item.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maps external chỉ đường button */}
        {poi.googleMapsUrl && (
          <a
            href={poi.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-sm font-semibold rounded-2xl text-zinc-200 hover:text-white transition-all shadow mt-2"
          >
            <ExternalLink className="w-4 h-4 text-zinc-400" />
            <span>{language === 'vi' ? 'Dẫn đường trên Google Maps' : 'Open in Google Maps'}</span>
          </a>
        )}
      </div>
    </div>
  );
}
