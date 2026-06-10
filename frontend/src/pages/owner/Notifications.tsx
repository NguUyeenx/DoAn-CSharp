import { Card, CardContent, } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thông Báo</h1>
        <p className="text-muted-foreground">Theo dõi phản hồi từ hệ thống và BQL.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex gap-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary self-start">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Địa điểm "Quán Ốc Vũ" đã được duyệt</p>
              <p className="text-sm text-muted-foreground">Bây giờ người dùng có thể tìm thấy quán của bạn trên bản đồ.</p>
              <p className="text-xs text-muted-foreground mt-2">1 giờ trước</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


