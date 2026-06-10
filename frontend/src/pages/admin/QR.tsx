import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { QrCode, Plus } from "lucide-react";

export default function QRManagement() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mã QR</h1>
          <p className="text-muted-foreground">Quản lý và tạo mã QR cho các địa điểm.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Sinh QR Mới
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã QR Code</TableHead>
              <TableHead>Địa điểm (POI)</TableHead>
              <TableHead>Lượt quét</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">QR_OCVU_01</TableCell>
              <TableCell>Quán Ốc Vũ</TableCell>
              <TableCell>150</TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline">
                  <QrCode className="w-4 h-4 mr-2" /> Tải về
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


