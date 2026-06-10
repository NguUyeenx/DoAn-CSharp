import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAdminPois, useUpdatePoiStatus } from "@/hooks/queries/useAdmin";
import { Loader2 } from "lucide-react";

export default function POIs() {
  const { data: pois, isLoading } = useAdminPois();
  const { mutate: updateStatus, isPending } = useUpdatePoiStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Duyệt POI</h1>
        <p className="text-muted-foreground">Phê duyệt hoặc từ chối các địa điểm do Chủ Quán tạo.</p>
      </div>

      <div className="border rounded-lg bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Địa Điểm</TableHead>
              <TableHead>Địa Chỉ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : pois?.map((poi: any) => (
              <TableRow key={poi.id}>
                <TableCell className="font-medium line-clamp-1">{poi.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{poi.address}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    poi.status === 'Approved' ? 'bg-success/10 text-success' :
                    poi.status === 'Pending' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {poi.status === 'Approved' ? 'Đã Duyệt' : poi.status === 'Pending' ? 'Chờ Duyệt' : 'Bị Từ Chối'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {poi.status === "Pending" && (
                    <>
                      <Button size="sm" variant="outline" className="text-success hover:text-success hover:bg-success/10"
                        onClick={() => updateStatus({ id: poi.id, status: "Approved" })} disabled={isPending}
                      >
                        Duyệt
                      </Button>
                      <Button size="sm" variant="outline" className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => updateStatus({ id: poi.id, status: "Rejected" })} disabled={isPending}
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {(!pois || pois.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu POI.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


