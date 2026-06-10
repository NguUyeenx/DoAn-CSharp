import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-center p-6">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-2">Không Tìm Thấy Trang</h2>
      <p className="text-muted-foreground mb-8">
        Có vẻ như trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Button asChild>
        <Link to={APP_ROUTES.HOME}>Quay Lại Trang Chủ</Link>
      </Button>
    </div>
  );
}


