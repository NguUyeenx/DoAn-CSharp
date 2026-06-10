import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Languages() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Ngôn Ngữ</h1>
          <p className="text-muted-foreground">Cấu hình ngôn ngữ hỗ trợ cho ứng dụng.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Ngôn Ngữ
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã NN</TableHead>
              <TableHead>Tên Ngôn Ngữ</TableHead>
              <TableHead>Mặc Định</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">vi-VN</TableCell>
              <TableCell>Tiếng Việt</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Có</span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">Đang Bật</span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline">Sửa</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">en-US</TableCell>
              <TableCell>English</TableCell>
              <TableCell></TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">Đang Bật</span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline">Sửa</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


