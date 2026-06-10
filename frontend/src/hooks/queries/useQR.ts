import { useQuery } from "@tanstack/react-query";
import { qrApi } from "@/api/qr.api";

export const useQRScan = (code: string) => {
  return useQuery({
    queryKey: ["qr", "scan", code],
    queryFn: () => qrApi.scanQR(code),
    enabled: !!code,
    retry: false,
  });
};

