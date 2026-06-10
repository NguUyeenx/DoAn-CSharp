import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, QrCode, Headphones, Loader2 } from "lucide-react";
import { useOwnerDashboard } from "@/hooks/queries/useOwner";

export default function Dashboard() {
  const { data: stats, isLoading } = useOwnerDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground">Theo dõi hoạt động kinh doanh của bạn.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Lượt Xem</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lượt Quét QR</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalScans || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lượt Nghe Audio</CardTitle>
              <Headphones className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAudioListens || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Địa Điểm Đang Hoạt Động</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activePoisCount || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Placeholder */}
      <Card className="col-span-4 mt-6">
        <CardHeader>
          <CardTitle>Biểu đồ truy cập</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[200px] flex items-center justify-center bg-muted rounded-md text-muted-foreground">
            {isLoading ? "Đang tải dữ liệu..." : "Chưa có đủ dữ liệu để vẽ biểu đồ."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
