import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAdminOwners, useApproveOwner } from "@/hooks/queries/useAdmin";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Owners() {
  const { data: owners, isLoading } = useAdminOwners();
  const { mutate: updateStatus, isPending } = useApproveOwner();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Duyệt Owner</h1>
        <p className="text-muted-foreground">Quản lý các tài khoản Chủ Quán trên hệ thống.</p>
      </div>

      <div className="border rounded-lg bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ngày Đăng Ký</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : owners?.map((owner: any) => (
              <TableRow key={owner.id}>
                <TableCell className="font-medium">{owner.name}</TableCell>
                <TableCell>{owner.email}</TableCell>
                <TableCell>{format(new Date(owner.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    owner.approvalStatus === 'Approved' ? 'bg-success/10 text-success' :
                    owner.approvalStatus === 'Pending' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {owner.approvalStatus === 'Approved' ? 'Đã Duyệt' : owner.approvalStatus === 'Pending' ? 'Chờ Duyệt' : 'Bị Từ Chối'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {owner.approvalStatus === "Pending" && (
                    <>
                      <Button size="sm" variant="outline" className="text-success hover:text-success hover:bg-success/10"
                        onClick={() => updateStatus({ id: owner.id, isApproved: true })} disabled={isPending}
                      >
                        Duyệt
                      </Button>
                      <Button size="sm" variant="outline" className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => updateStatus({ id: owner.id, isApproved: false })} disabled={isPending}
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {(!owners || owners.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu Owner.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


