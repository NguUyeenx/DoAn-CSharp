import { useState } from "react";
import { useSearchPOIs } from "@/hooks/queries/usePois";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, MapPin, Loader2, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Search() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  const [query, setQuery] = useState("");
  const { data: pois, isLoading } = useSearchPOIs({ query, categoryId: category || undefined });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-10 bg-surface border-b border-border p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input 
              autoFocus
              className="pl-10 h-11 bg-muted rounded-xl border-none"
              placeholder="Tìm quán ốc, cafe, địa điểm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && pois && pois.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 opacity-50" />
            </div>
            <p>Không tìm thấy địa điểm nào phù hợp.</p>
          </div>
        )}

        <div className="space-y-4">
          {pois?.map((poi: any) => (
            <Link key={poi.id} to={APP_ROUTES.POI_DETAIL.replace(":slug", poi.slug)} className="block">
              <Card className="hover:bg-muted/50 transition-colors border-none shadow-sm flex overflow-hidden">
                <div className="w-24 h-24 shrink-0 bg-muted">
                  {poi.imageUrl && (
                    <img src={poi.imageUrl} className="w-full h-full object-cover" alt={poi.name} />
                  )}
                </div>
                <CardContent className="p-3 flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-sm line-clamp-1">{poi.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-xs line-clamp-1">{poi.address}</p>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-primary">
                    Xem chi tiết
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


