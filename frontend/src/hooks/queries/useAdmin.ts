import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";
import { toast } from "sonner";

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboardStats(),
  });
};

export const useAdminOwners = () => {
  return useQuery({
    queryKey: ["admin", "owners"],
    queryFn: () => adminApi.getOwners(),
  });
};

export const useApproveOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: number, isApproved: boolean }) => adminApi.approveOwner(id, isApproved),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái Owner thành công.");
      queryClient.invalidateQueries({ queryKey: ["admin", "owners"] });
    },
    onError: () => toast.error("Cập nhật thất bại."),
  });
};

export const useAdminPois = () => {
  return useQuery({
    queryKey: ["admin", "pois"],
    queryFn: () => adminApi.getPois(),
  });
};

export const useUpdatePoiStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number, status: "Approved" | "Rejected" }) => adminApi.updatePoiStatus(id, status),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái POI thành công.");
      queryClient.invalidateQueries({ queryKey: ["admin", "pois"] });
    },
    onError: () => toast.error("Cập nhật thất bại."),
  });
};

export const useAuditLogs = () => {
  return useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminApi.getAuditLogs(),
  });
};

