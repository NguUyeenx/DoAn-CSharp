import { usePOIs } from "@/hooks/queries/usePois";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { MapPin, Star, Utensils, Coffee, Map as MapIcon, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { data: pois, isLoading, isError } = usePOIs();

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Hero Banner */}
      <div className="relative w-full h-64 bg-primary flex flex-col justify-center items-center text-primary-foreground px-4 rounded-b-3xl shadow-lg">
        <div className="absolute inset-0 bg-black/20 rounded-b-3xl"></div>
        <div className="relative z-10 w-full max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold font-heading">VinhKhanh Explorer</h1>
          <p className="text-sm opacity-90">Khám phá thiên đường ẩm thực Quận 4</p>
          <div className="relative w-full mt-4">
            <Link to={APP_ROUTES.SEARCH}>
              <Input 
                className="w-full bg-surface text-foreground rounded-full pl-10 h-12 shadow-sm pointer-events-none" 
                placeholder="Bạn muốn ăn gì hôm nay?" 
                readOnly 
              />
            </Link>
            <div className="absolute left-4 top-3 text-muted-foreground">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Danh mục</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <Link to={`${APP_ROUTES.SEARCH}?category=food`} className="flex flex-col items-center gap-2 min-w-[72px]">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Quán ăn</span>
          </Link>
          <Link to={`${APP_ROUTES.SEARCH}?category=cafe`} className="flex flex-col items-center gap-2 min-w-[72px]">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Cafe</span>
          </Link>
          <Link to={`${APP_ROUTES.SEARCH}?category=culture`} className="flex flex-col items-center gap-2 min-w-[72px]">
            <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center">
              <MapIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Văn hóa</span>
          </Link>
        </div>
      </div>

      {/* Featured POIs */}
      <div className="px-4 mt-8 flex-1">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-foreground">Địa điểm nổi bật</h2>
          <Link to={APP_ROUTES.SEARCH} className="text-sm font-medium text-primary">Xem tất cả</Link>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-danger">
            Không thể tải dữ liệu địa điểm lúc này.
          </div>
        )}

        {!isLoading && !isError && pois && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pois.slice(0, 5).map((poi: any) => (
              <Link key={poi.id} to={APP_ROUTES.POI_DETAIL.replace(":slug", poi.slug)}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
                  <div className="h-40 w-full bg-muted relative">
                    {poi.imageUrl ? (
                      <img src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Utensils className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold shadow-sm">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span>{poi.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold text-base line-clamp-1">{poi.name}</h3>
                    <div className="flex items-start gap-1 mt-1 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <p className="text-xs line-clamp-2 leading-relaxed">{poi.address}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


