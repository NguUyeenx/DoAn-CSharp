import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed, Loader2 } from "lucide-react";
import { useMyPois, usePoiMenu } from "@/hooks/queries/useOwner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MenuManagement() {
  const { data: pois, isLoading: isPoisLoading } = useMyPois();
  const [selectedPoiId, setSelectedPoiId] = useState<string>("");

  const { data: menuItems, isLoading: isMenuLoading } = usePoiMenu(Number(selectedPoiId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Menu</h1>
          <p className="text-muted-foreground">Cập nhật thực đơn và món ăn của quán.</p>
        </div>
        <Button disabled={!selectedPoiId}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Món Mới
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border">
        <label className="font-medium whitespace-nowrap">Chọn địa điểm:</label>
        <Select value={selectedPoiId} onValueChange={setSelectedPoiId} disabled={isPoisLoading}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="-- Chọn một địa điểm --" />
          </SelectTrigger>
          <SelectContent>
            {pois?.map((poi: any) => (
              <SelectItem key={poi.id} value={poi.id.toString()}>{poi.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPoiId ? (
        <div className="bg-surface rounded-lg border border-border p-12 text-center text-muted-foreground">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-20" />
          Vui lòng chọn một địa điểm để xem và quản lý Menu.
        </div>
      ) : isMenuLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-lg bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Món</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.price.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell>
                    {item.isAvailable ? (
                      <span className="text-success text-xs font-semibold bg-success/10 px-2 py-1 rounded">Còn Bán</span>
                    ) : (
                      <span className="text-danger text-xs font-semibold bg-danger/10 px-2 py-1 rounded">Hết Hàng</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline">Sửa</Button>
                    <Button size="sm" variant="outline" className="text-danger">Xoá</Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!menuItems || menuItems.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Menu hiện tại đang trống.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}


