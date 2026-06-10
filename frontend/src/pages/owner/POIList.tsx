import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Plus, Loader2 } from "lucide-react";
import { useMyPois } from "@/hooks/queries/useOwner";

export default function POIList() {
  const { data: pois, isLoading } = useMyPois();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Địa Điểm (POI)</h1>
          <p className="text-muted-foreground">Danh sách các địa điểm bạn đang quản lý.</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Địa Điểm Mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pois?.map((poi: any) => (
            <Card key={poi.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold line-clamp-1">{poi.name}</CardTitle>
                <Store className="w-5 h-5 text-primary shrink-0 ml-2" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{poi.address}</p>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    poi.status === 'Approved' ? 'bg-success/10 text-success' :
                    poi.status === 'Pending' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {poi.status === 'Approved' ? 'Đã Duyệt' : poi.status === 'Pending' ? 'Chờ Duyệt' : 'Bị Từ Chối'}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">Sửa</Button>
                  <Button variant="outline" size="sm" className="w-full">Ảnh</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!pois || pois.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-surface rounded-lg border border-border">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Bạn chưa có địa điểm nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
