import { useParams, useNavigate } from "react-router-dom";
import { usePOIBySlug, usePOIMenu } from "@/hooks/queries/usePois";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Star, PlayCircle, Square } from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { useState, useRef, useEffect } from "react";
import { poiApi } from "@/api/poi.api";

export default function POIDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState<"vi" | "en">("vi");
  const { data: poi, isLoading, isError } = usePOIBySlug(slug || "", selectedLang);
  const { data: menuItems } = usePOIMenu(poi?.id || 0, selectedLang);

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => stopTTS(); // Cleanup on unmount
  }, []);

  const playAudioGuide = async (text: string, lang: string, poiId: number) => {
    stopTTS();
    setIsLoadingAudio(true);

    try {
      const { url } = await poiApi.generateAudio(text, lang, poiId);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      
      audio.onplay = () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setIsLoadingAudio(false);
        setIsPlaying(false);
        alert("Lỗi khi phát âm thanh từ Server.");
      };

      await audio.play();
    } catch (err) {
      setIsLoadingAudio(false);
      setIsPlaying(false);
      alert("Không thể khởi tạo âm thanh (Edge TTS).");
      console.error(err);
    }
  };

  const stopTTS = () => {
    setIsPlaying(false);
    setIsLoadingAudio(false);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  };

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;
  if (isError || !poi) return <div className="p-8 text-center text-danger">Không tìm thấy địa điểm.</div>;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Cover Image & Header */}
      <div className="relative h-64 bg-muted">
        {poi.imageUrl && (
          <img src={poi.imageUrl} className="w-full h-full object-cover" alt={poi.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 text-white hover:bg-black/20 rounded-full bg-black/40 backdrop-blur-md"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary px-2 py-0.5 rounded-sm text-xs font-semibold">Quán Ẩm Thực</span>
            <div className="flex items-center gap-1 text-warning text-sm font-semibold">
              <Star className="w-4 h-4 fill-warning" />
              {poi.rating.toFixed(1)} ({poi.reviewCount})
            </div>
          </div>
          <h1 className="text-2xl font-bold font-heading">{poi.localizedName || poi.name}</h1>
          <div className="flex items-center gap-1 mt-1 text-white/80 text-sm">
            <MapPin className="w-4 h-4 shrink-0" />
            <p className="line-clamp-1">{poi.address}</p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 -mt-4 relative z-10 bg-background rounded-t-2xl px-4 pt-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 mb-6">
            <TabsTrigger value="about">Giới thiệu</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-4">
            <div className="prose prose-sm dark:prose-invert">
              <p>{poi.fullDescription || poi.shortDescription || "Chưa có bài giới thiệu chi tiết cho địa điểm này."}</p>
            </div>
            {poi.images && poi.images.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Thư viện ảnh</h3>
                <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scrollbar">
                  {poi.images.map(img => (
                    <img key={img.id} src={img.imageUrl} className="w-48 h-32 object-cover rounded-xl snap-center shrink-0 shadow-sm border border-border" alt="Gallery" />
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-border flex gap-2">
              <Button className="flex-1" onClick={() => navigate(APP_ROUTES.MAP, { state: { routeTo: [poi.latitude, poi.longitude] } })}>
                <MapPin className="w-4 h-4 mr-2" /> Chỉ đường
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="audio">
            <div className="bg-surface rounded-2xl p-6 border border-border text-center shadow-sm">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Thuyết minh tự động</h3>
                <select 
                  className="bg-muted text-xs px-2 py-1 rounded-md border-none outline-none cursor-pointer"
                  value={selectedLang}
                  onChange={(e) => {
                    stopTTS();
                    setSelectedLang(e.target.value as "vi" | "en");
                  }}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground mb-6 text-left">Nghe câu chuyện văn hóa, lịch sử và các món ăn đặc sắc của quán.</p>
              
              {poi.audioText ? (
                <>
                  <div className="bg-muted h-1.5 rounded-full w-full mb-6 overflow-hidden">
                    {isPlaying && (
                      <div className="bg-primary w-full h-full rounded-full origin-left animate-[pulse_1s_ease-in-out_infinite] opacity-50"></div>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    className={`rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg mx-auto ${isLoadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoadingAudio}
                    onClick={() => {
                      if (isPlaying) {
                        stopTTS();
                      } else {
                        playAudioGuide(poi.audioText!, selectedLang, poi.id);
                      }
                    }}
                  >
                    {isPlaying ? (
                      <Square className="w-5 h-5 fill-primary-foreground" />
                    ) : (
                      <PlayCircle className="w-6 h-6 fill-primary-foreground" />
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    {isLoadingAudio ? "Đang tạo âm thanh (1-3s)..." : isPlaying ? "Đang phát nội dung..." : "Bấm để nghe thuyết minh"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-warning mt-4">Đang cập nhật nội dung thuyết minh...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Temporary icon
function UtensilsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  )
}


