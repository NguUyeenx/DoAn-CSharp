import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";
import { menuApi } from "@/api/menu.api";
import { toast } from "sonner";

export const useOwnerDashboard = () => {
  return useQuery({
    queryKey: ["owner", "dashboard"],
    queryFn: () => ownerApi.getDashboardStats(),
  });
};

export const useMyPois = () => {
  return useQuery({
    queryKey: ["owner", "pois"],
    queryFn: () => ownerApi.getMyPois(),
  });
};

export const usePoiMenu = (poiId: number) => {
  return useQuery({
    queryKey: ["owner", "pois", poiId, "menu"],
    queryFn: () => menuApi.getByPoi(poiId),
    enabled: !!poiId,
  });
};

// Mutations
export const useCreatePoi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createPoi(data),
    onSuccess: () => {
      toast.success("Đã tạo địa điểm thành công, đang chờ duyệt.");
      queryClient.invalidateQueries({ queryKey: ["owner", "pois"] });
    },
    onError: () => toast.error("Có lỗi xảy ra khi tạo địa điểm."),
  });
};

