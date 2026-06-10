import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlayCircle, RefreshCw, Loader2 } from "lucide-react";
import { useAdminPois } from "@/hooks/queries/useAdmin";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";
import { toast } from "sonner";

export default function AudioManagement() {
  const { data: pois, isLoading } = useAdminPois();

  // We only show approved POIs to generate Audio for
  const approvedPois = pois?.filter((p: any) => p.status === 'Approved');

  const { mutate: regenerateAudio, isPending } = useMutation({
    mutationFn: (poiId: number) => adminApi.regenerateAudio(poiId),
    onSuccess: () => toast.success("Đã kích hoạt tạo lại Audio thành công."),
    onError: () => toast.error("Có lỗi xảy ra, vui lòng thử lại."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Audio (TTS)</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý các file thuyết minh âm thanh.</p>
        </div>
      </div>

      <div className="border rounded-lg bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Audio</TableHead>
              <TableHead>Liên Kết Với (POI)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : approvedPois?.map((poi: any) => (
              <TableRow key={poi.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-primary" /> {poi.slug}_vi.mp3
                </TableCell>
                <TableCell>{poi.name}</TableCell>
                <TableCell>
                  <span className="text-success text-xs font-semibold bg-success/10 px-2 py-1 rounded">Có sẵn</span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" className="text-secondary" 
                    onClick={() => regenerateAudio(poi.id)} disabled={isPending}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Tạo lại
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {(!approvedPois || approvedPois.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Không có POI nào hợp lệ để tạo Audio.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


