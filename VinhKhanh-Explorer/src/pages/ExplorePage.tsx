import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  X, 
  Compass, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { api } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { useLocationStore } from '../stores/locationStore';
import { useNarrationStore } from '../stores/narrationStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { computeHaversineDistance } from '../lib/utils';
import type { POIListDto, POI, MenuItem, TourDto } from '../types/poi';

interface QuizQuestionDto {
  id: number;
  poiId: number;
  questionText: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
}

interface QuizResultDto {
  isCorrect: boolean;
  correctOption: string;
  explanationText: string;
}

interface PoiQuizCardProps {
  poiId: number;
  language: string;
}

function PoiQuizCard({ poiId, language }: PoiQuizCardProps) {
  const { solveQuiz, solvedQuizIds } = useGamificationStore();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResultDto | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [badgeUnlockedMsg, setBadgeUnlockedMsg] = useState<string | null>(null);

  // Fetch POI Quiz question
  const { data: poiQuiz } = useQuery<QuizQuestionDto>({
    queryKey: ['poiQuiz', poiId, language],
    queryFn: () => api.get<QuizQuestionDto>(`/quizzes/${poiId}?lang=${language}`),
    retry: false,
  });

  const handleQuizSubmit = async (option: string) => {
    if (!poiQuiz || quizSubmitted) return;
    setSelectedAnswer(option);
    try {
      const result = await api.post<QuizResultDto>(`/quizzes/submit?lang=${language}`, {
        quizQuestionId: poiQuiz.id,
        selectedOption: option,
      });
      setQuizResult(result);
      setQuizSubmitted(true);
      const { newBadgeUnlocked } = solveQuiz(poiQuiz.id, result.isCorrect);
      if (newBadgeUnlocked) {
        setBadgeUnlockedMsg(
          language === 'vi'
            ? '🎉 Chúc mừng! Bạn đã mở khóa Huy chương mới trong Hồ sơ!'
            : '🎉 Congratulations! You unlocked a new Badge in your Profile!'
        );
      }
    } catch (err) {
      console.error('Failed to submit quiz answer:', err);
    }
  };

  if (!poiQuiz) return null;

  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="font-bold text-base tracking-wide text-zinc-100">
            {language === 'vi' ? 'Đố Vui Văn Hóa' : 'Cultural Trivia Challenge'}
          </span>
        </div>
        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 uppercase tracking-wider animate-pulse">
          +50 pts
        </span>
      </div>

      <p className="text-zinc-200 text-sm font-medium leading-relaxed">
        {poiQuiz.questionText}
      </p>

      <div className="flex flex-col gap-2.5">
        {[
          { key: 'A', text: poiQuiz.answerA },
          { key: 'B', text: poiQuiz.answerB },
          { key: 'C', text: poiQuiz.answerC },
          { key: 'D', text: poiQuiz.answerD },
        ].map((opt) => {
          const isOptionSelected = selectedAnswer === opt.key;
          const isSolved = solvedQuizIds.includes(poiQuiz.id);
          const isCorrectAnswer = quizResult?.correctOption === opt.key;
          const isWrongChoice = isOptionSelected && !quizResult?.isCorrect;

          let btnStyle = 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300';
          
          if (quizSubmitted) {
            if (isCorrectAnswer) {
              btnStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold';
            } else if (isWrongChoice) {
              btnStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-400 font-semibold';
            } else {
              btnStyle = 'border-zinc-850 bg-zinc-950/40 text-zinc-650 cursor-not-allowed';
            }
          } else if (isSolved) {
            btnStyle = 'border-emerald-500/30 bg-emerald-550/5 text-emerald-500/70 cursor-not-allowed';
          }

          return (
            <button
              key={opt.key}
              disabled={quizSubmitted || isSolved}
              onClick={() => handleQuizSubmit(opt.key)}
              className={`flex items-start gap-3 w-full p-3.5 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
            >
              <span className="font-bold text-zinc-400">{opt.key}.</span>
              <span className="flex-1">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Solved state / results message */}
      {solvedQuizIds.includes(poiQuiz.id) && !quizSubmitted && (
        <div className="p-3 bg-emerald-550/5 border border-emerald-500/20 text-emerald-450 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
          <span>{language === 'vi' ? 'Bạn đã hoàn thành chính xác thử thách đố vui tại đây!' : 'You already mastered the quiz challenge at this spot!'}</span> 🏆
        </div>
      )}

      {quizSubmitted && quizResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            {quizResult.isCorrect ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm">
                <span>{language === 'vi' ? 'Chính xác! Bạn được cộng +50 điểm' : 'Correct! You earned +50 points'}</span> 🎉
              </div>
            ) : (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm">
                <span>{language === 'vi' ? 'Chưa chính xác, hãy tiếp tục khám phá!' : 'Incorrect answer, but keep exploring!'}</span> 🧭
              </div>
            )}

            {badgeUnlockedMsg && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 animate-bounce shadow-sm">
                <span>{badgeUnlockedMsg}</span> 🏆
              </div>
            )}

            <div className="p-4 bg-zinc-900/80 border border-zinc-850 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-amber-400 text-xs font-bold">💡 {language === 'vi' ? 'Lời giải thích' : 'Educational Context'}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                {quizResult.explanationText}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// Default center: Vinh Khanh Street, District 4, HCMC
const VINH_KHANH_CENTER = { lat: 10.7568, lng: 106.7021 };

export default function ExplorePage() {
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const { position, isTracking, isSimulatorActive, setPosition, setTracking, setSimulatorActive } = useLocationStore();
  const { isPlaying, cooldownMap, setPlaying, setCurrentItem, setCooldown } = useNarrationStore();

  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState<boolean>(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  const [searchParams] = useSearchParams();
  const tourParam = searchParams.get('tour');
  const [activeTourId, setActiveTourId] = useState<number | null>(null);

  const { checkInPoi, visitedPoiIds } = useGamificationStore();

  // Fetch active POI list
  const { data: pois = [] } = useQuery<POIListDto[]>({
    queryKey: ['pois', language],
    queryFn: () => api.get<POIListDto[]>(`/pois?lang=${language}`),
  });

  // Fetch selected POI details
  const { data: selectedPoi } = useQuery<POI>({
    queryKey: ['poi', selectedPoiId, language],
    queryFn: () => api.get<POI>(`/pois/${selectedPoiId}?lang=${language}`),
    enabled: selectedPoiId !== null,
  });

  // Fetch selected POI menu if it's a restaurant
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu', selectedPoiId, language],
    queryFn: () => api.get<MenuItem[]>(`/pois/${selectedPoiId}/menu?lang=${language}`),
    enabled: selectedPoiId !== null && selectedPoi?.category === 'restaurant',
  });

  // Fetch active tour details
  const { data: activeTour } = useQuery<TourDto>({
    queryKey: ['activeTour', activeTourId, language],
    queryFn: () => api.get<TourDto>(`/tours/${activeTourId}?lang=${language}`),
    enabled: activeTourId !== null,
  });

  // Set active tour from URL search parameter
  useEffect(() => {
    if (tourParam) {
      const tourId = parseInt(tourParam, 10);
      if (!isNaN(tourId)) {
        const timer = setTimeout(() => {
          setActiveTourId(tourId);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [tourParam]);

  // Leaflet map and overlay elements refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const poiMarkersRef = useRef<Record<number, L.Marker>>({});
  const poiCirclesRef = useRef<Record<number, L.Circle>>({});
  const activePolylineRef = useRef<L.Polyline | null>(null);

  // Draw Active Walking Tour Guided Route (Leaflet Polyline)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing polyline
    if (activePolylineRef.current) {
      activePolylineRef.current.remove();
      activePolylineRef.current = null;
    }

    if (activeTour && activeTour.stops && activeTour.stops.length > 0) {
      const coordinates = [...activeTour.stops]
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .map(stop => [stop.latitude, stop.longitude] as L.LatLngTuple);

      if (coordinates.length > 1) {
        const polyline = L.polyline(coordinates, {
          color: '#14b8a6', // turquoise
          weight: 4,
          dashArray: '10, 10',
          opacity: 0.8,
          lineJoin: 'round'
        }).addTo(map);

        activePolylineRef.current = polyline;

        // Smoothly fit bounds
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [activeTour]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [VINH_KHANH_CENTER.lat, VINH_KHANH_CENTER.lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Draw POI markers and circles on map dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pois.length === 0) return;

    // Clean up existing elements
    Object.values(poiMarkersRef.current).forEach((m) => m.remove());
    Object.values(poiCirclesRef.current).forEach((c) => c.remove());
    poiMarkersRef.current = {};
    poiCirclesRef.current = {};

    pois.forEach((poi) => {
      const colorClass = poi.category === 'restaurant' ? 'bg-rose-500' : 'bg-emerald-500';
      const poiIcon = L.divIcon({
        className: 'custom-poi-marker-container',
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${colorClass} border-2 border-zinc-950 shadow-lg text-white font-bold text-sm transform hover:scale-110 transition-all cursor-pointer">
          ${poi.category === 'restaurant' ? '🍴' : '📍'}
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedPoiId(poi.id);
          setActiveSheet(true);
        });

      poiMarkersRef.current[poi.id] = marker;

      const circle = L.circle([poi.latitude, poi.longitude], {
        radius: 30,
        fillColor: '#10b981',
        fillOpacity: 0.08,
        color: '#10b981',
        opacity: 0.25,
        weight: 1,
      }).addTo(map);

      poiCirclesRef.current[poi.id] = circle;
    });
  }, [pois]);

  // 3. Update User Geolocation pulse marker and precision circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (position) {
      const userLatLng: L.LatLngExpression = [position.latitude, position.longitude];

      if (userCircleRef.current) {
        userCircleRef.current.setLatLng(userLatLng);
        userCircleRef.current.setRadius(position.accuracy);
      } else {
        userCircleRef.current = L.circle(userLatLng, {
          radius: position.accuracy,
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          color: '#3b82f6',
          opacity: 0.25,
          weight: 1,
        }).addTo(map);
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userLatLng);
      } else {
        const userIcon = L.divIcon({
          className: 'custom-user-marker-container',
          html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-35 animate-ping"></div>
            <div class="relative w-4.5 h-4.5 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        userMarkerRef.current = L.marker(userLatLng, { icon: userIcon }).addTo(map);
      }

      // Center map view on user location
      map.setView(userLatLng, 17, { animate: true, duration: 0.5 });
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        userCircleRef.current.remove();
        userCircleRef.current = null;
      }
    }
  }, [position]);

  // 1. Geolocation Tracking Engine
  useEffect(() => {
    if (isTracking && !isSimulatorActive) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setPosition({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          (err) => {
            console.error('GPS tracking failed:', err);
            setTracking(false);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking, isSimulatorActive, setPosition, setTracking]);

  // 2. Browser Text-to-Speech Player
  const playTextToSpeech = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 1.0;
    
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  }, [language, setPlaying]);

  // 3. Geofence Trigger Handler
  const triggerGeofence = useCallback(async (poiId: number) => {
    // 1. Set Cooldown immediately to prevent double triggers
    setCooldown(poiId, new Date().getTime());

    // 2. Perform Gamification Check-in
    const category = pois.find(p => p.id === poiId)?.category || 'restaurant';
    const { pointsEarned, newBadgeUnlocked } = checkInPoi(poiId, category);
    if (pointsEarned > 0) {
      alert(
        language === 'vi'
          ? `🎉 Check-in thành công! Bạn nhận được +${pointsEarned} điểm XP!`
          : `🎉 Successfully checked in! You earned +${pointsEarned} XP!`
      );
    }
    if (newBadgeUnlocked) {
      alert(
        language === 'vi'
          ? '🏆 Chúc mừng! Bạn đã mở khóa một Huy chương mới! Hãy kiểm tra tab Hồ Sơ.'
          : '🏆 Congratulations! You unlocked a new Achievement Badge! Check your Profile tab.'
      );
    }

    // 3. Log Visit to Analytics API
    try {
      await api.post('/analytics/visit', {
        poiId,
        sessionId: 'anonymous-visitor',
        triggerType: 'geofence',
        languageCode: language,
      });
    } catch (err) {
      console.error('Failed to log visit analytics:', err);
    }

    // 4. Open Detail Bottom Sheet
    setSelectedPoiId(poiId);
    setActiveSheet(true);

    // 5. Play Audio Narration if enabled
    try {
      const detail = await api.get<POI>(`/pois/${poiId}?lang=${language}`);
      const audioText = language === 'vi' 
        ? detail.translations.find(t => t.languageCode === 'vi')?.audioText || detail.audioText
        : detail.translations.find(t => t.languageCode === 'en')?.audioText || detail.audioText;

      setCurrentItem({
        poiId: detail.id,
        poiName: detail.name,
        source: 'tts',
        text: audioText || '',
        language: language,
        priority: detail.priority || 1,
      });

      if (audioEnabled && audioText) {
        playTextToSpeech(audioText);
      }
    } catch (err) {
      console.error('Failed to trigger voice narration:', err);
    }
  }, [language, audioEnabled, setCooldown, setCurrentItem, playTextToSpeech, checkInPoi, pois]);

  // 4. Real-time Geofence Trigger Checker
  useEffect(() => {
    if (!position || pois.length === 0) return;

    // Check all POIs proximity
    for (const poi of pois) {
      const distance = computeHaversineDistance(
        position.latitude,
        position.longitude,
        poi.latitude,
        poi.longitude
      );

      // Trigger radius: default to 30 meters
      const radius = 30;

      if (distance <= radius) {
        const lastTriggered = cooldownMap[poi.id];
        const isCooldown = lastTriggered && new Date().getTime() - lastTriggered < 120000; // 2 minutes cooldown

        if (!isCooldown) {
          // Log geofence event and start audio
          setTimeout(() => {
            triggerGeofence(poi.id);
          }, 0);
          break; // Trigger one POI at a time
        }
      }
    }
  }, [position, pois, cooldownMap, triggerGeofence]);

  const togglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlaying(true);
      } else if (selectedPoi) {
        const audioText = language === 'vi'
          ? selectedPoi.translations.find(t => t.languageCode === 'vi')?.audioText || selectedPoi.audioText
          : selectedPoi.translations.find(t => t.languageCode === 'en')?.audioText || selectedPoi.audioText;
        if (audioText) {
          playTextToSpeech(audioText);
        }
      }
    }
  };

  const startSimulator = (poi: POIListDto) => {
    setSimulatorActive(true);
    setPosition({
      latitude: poi.latitude,
      longitude: poi.longitude,
      accuracy: 5,
    });
    // Trigger geofence checks
    triggerGeofence(poi.id);
  };

  const toggleTracking = () => {
    if (isTracking) {
      setTracking(false);
    } else {
      setSimulatorActive(false); // Disable simulator if user wants real GPS
      setTracking(true);
      // Initialize with a mock/current position immediately if navigator allows
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-zinc-950">
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating GPS Controller / Tracking Toggle */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={toggleTracking}
          className={`flex items-center justify-center p-3 rounded-full shadow-lg border backdrop-blur-md transition-all ${
            isTracking && !isSimulatorActive
              ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white'
          }`}
          title={isTracking ? 'Stop GPS Tracking' : 'Start GPS Tracking'}
        >
          <Compass className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Walk Simulator Panel */}
      <div className="absolute top-4 left-4 z-10 max-w-[280px]">
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md text-white">
          <div 
            onClick={() => setIsSimulatorExpanded(!isSimulatorExpanded)}
            className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 cursor-pointer hover:bg-zinc-850 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">🏃‍♂️</span>
              <span className="font-semibold text-sm tracking-wide">GPS Walk Simulator</span>
            </div>
            <span className="text-zinc-500 text-xs">{isSimulatorExpanded ? 'Hide' : 'Show'}</span>
          </div>

          <AnimatePresence>
            {isSimulatorExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Simulator Status:</span>
                    <span className={isSimulatorActive ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                      {isSimulatorActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {pois.map((poi) => (
                      <button
                        key={poi.id}
                        onClick={() => startSimulator(poi)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs bg-zinc-900 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-zinc-300"
                      >
                        <span className="truncate max-w-[170px]">{poi.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    ))}
                  </div>

                  {isSimulatorActive && (
                    <button
                      onClick={() => setSimulatorActive(false)}
                      className="w-full py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                      Disable Simulator
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* POI detail Bottom Sheet */}
      <AnimatePresence>
        {activeSheet && selectedPoi && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-zinc-950 border-t border-zinc-850 rounded-t-3xl shadow-2xl z-20 flex flex-col overflow-hidden text-white"
          >
            {/* Header Drag Handle */}
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/60 border-b border-zinc-900/80">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 capitalize">
                  {selectedPoi.category}
                </span>
                {visitedPoiIds.includes(selectedPoi.id) && (
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-550/15 text-blue-400 rounded-full border border-blue-500/20 flex items-center gap-1">
                    <span>{language === 'vi' ? 'Đã ghé thăm' : 'Visited'}</span> <span className="text-[10px]">✅ (+100 pts)</span>
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setPlaying(false);
                  setActiveSheet(false);
                }}
                className="p-1 bg-zinc-900 border border-zinc-800 rounded-full hover:text-white transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="overflow-y-auto p-6 flex-1 flex flex-col gap-6 custom-scrollbar pb-10">
              {/* POI Header & Image */}
              <div className="flex flex-col md:flex-row gap-6">
                {selectedPoi.imageUrl && (
                  <img
                    src={selectedPoi.imageUrl}
                    alt={selectedPoi.localizedName}
                    className="w-full md:w-44 h-44 object-cover rounded-2xl border border-zinc-900 shadow-md"
                  />
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                    {selectedPoi.localizedName}
                  </h2>
                  {selectedPoi.name !== selectedPoi.localizedName && (
                    <p className="text-sm text-zinc-500 italic mb-3">Original: {selectedPoi.name}</p>
                  )}
                  
                  {/* Web Speech Audio Controller */}
                  <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-850 rounded-xl px-4 py-3 max-w-sm">
                    <button
                      onClick={togglePlayback}
                      className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full shadow transition-all hover:scale-105"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-zinc-400">Audio Guide Narration</span>
                      <span className="text-xs text-zinc-500">
                        {isPlaying ? 'Speaking guide narration...' : 'Ready to speak'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">About this spot</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {selectedPoi.fullDescription || selectedPoi.shortDescription}
                </p>
              </div>

              {/* Cultural Trivia Quiz */}
              <PoiQuizCard key={selectedPoi.id} poiId={selectedPoi.id} language={language} />

              {/* Localized Food Menu List if POI is Restaurant */}
              {selectedPoi.category === 'restaurant' && menuItems.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Bilingual Food Menu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {menuItems.map((item) => (
                      <div 
                        key={item.id}
                        className="flex gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-800 transition-colors"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.localizedName}
                            className="w-16 h-16 object-cover rounded-lg border border-zinc-900"
                          />
                        )}
                        <div className="flex-1 flex flex-col justify-center text-left">
                          <span className="font-semibold text-sm text-zinc-200">{item.localizedName}</span>
                          {item.name !== item.localizedName && (
                            <span className="text-[10px] text-zinc-500 italic">({item.name})</span>
                          )}
                          <span className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{item.localizedDescription}</span>
                          <span className="text-xs font-medium text-emerald-400 mt-1">
                            {item.price.toLocaleString()} {item.currency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation button */}
              {selectedPoi.googleMapsUrl && (
                <a
                  href={selectedPoi.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-sm font-semibold rounded-xl text-zinc-200 hover:text-white transition-all shadow-md mt-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Navigate in Google Maps</span>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
