import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useAuditLogs } from "@/hooks/queries/useAdmin";
import { Loader2 } from "lucide-react";

export default function AuditLogs() {
  const { data: logs, isLoading } = useAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lịch Sử Hệ Thống (Audit Logs)</h1>
        <p className="text-muted-foreground">Theo dõi mọi thay đổi và hành động trên hệ thống.</p>
      </div>

      <div className="border rounded-lg bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời Gian</TableHead>
              <TableHead>Người Dùng</TableHead>
              <TableHead>Vai Trò</TableHead>
              <TableHead>Hành Động</TableHead>
              <TableHead>Đối Tượng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : logs?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium whitespace-nowrap">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}</TableCell>
                <TableCell>User #{log.userId}</TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    log.userRole === 'Admin' ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10'
                  }`}>
                    {log.userRole}
                  </span>
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entityName} #{log.entityId}</TableCell>
              </TableRow>
            ))}

            {(!logs || logs.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu lịch sử.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


