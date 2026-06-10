import { useTours } from "@/hooks/queries/useTours";
import { Card, CardContent } from "@/components/ui/card";
import { MapIcon, Loader2, Clock } from "lucide-react";

export default function Tours() {
  const { data: tours, isLoading } = useTours();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-10 bg-surface border-b border-border p-4">
        <h1 className="text-xl font-bold text-primary">Tours Khám Phá</h1>
        <p className="text-sm text-muted-foreground">Các hành trình được thiết kế sẵn cho bạn.</p>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {tours?.map((tour: any) => (
          <Card key={tour.id} className="overflow-hidden hover:shadow-md transition-shadow border-border/50">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{tour.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tour.description}</p>
              
              <div className="flex gap-4 mt-4 text-sm font-medium">
                <div className="flex items-center gap-1 text-primary">
                  <MapIcon className="w-4 h-4" />
                  <span>{tour.totalDistanceKm} km</span>
                </div>
                <div className="flex items-center gap-1 text-secondary">
                  <Clock className="w-4 h-4" />
                  <span>{tour.estimatedDurationMinutes} phút</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && (!tours || tours.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Hiện tại chưa có tour nào được thiết kế.
          </div>
        )}
      </div>
    </div>
  );
}


