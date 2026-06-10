import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { useQRScan } from "@/hooks/queries/useQR";
import { toast } from "sonner";

export default function QRLanding() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: poi, isError, isSuccess } = useQRScan(code || "");

  useEffect(() => {
    if (isSuccess && poi) {
      navigate(APP_ROUTES.POI_DETAIL.replace(":slug", poi.slug), { replace: true });
    }
    if (isError) {
      toast.error("Mã QR không hợp lệ hoặc đã bị vô hiệu hóa.");
      navigate(APP_ROUTES.HOME, { replace: true });
    }
  }, [isSuccess, isError, poi, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Đang xử lý mã QR...</p>
    </div>
  );
}


