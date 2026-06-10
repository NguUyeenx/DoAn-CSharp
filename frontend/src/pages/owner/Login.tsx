import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { APP_ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      // Mock login
      login({ id: 1, email, name: "Owner Mock", role: "Owner" }, "mock-token");
      toast.success("Đăng nhập thành công!");
      navigate(APP_ROUTES.OWNER_DASHBOARD);
    } else {
      toast.error("Vui lòng nhập email và mật khẩu.");
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Đăng Nhập Owner</CardTitle>
          <CardDescription>Quản lý địa điểm và menu của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
              <Input type="email" placeholder="owner@vinhkhanh.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mật khẩu</label>
              <Input type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Đăng Nhập</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Chưa có tài khoản? Liên hệ Ban quản lý.
        </CardFooter>
      </Card>
    </div>
  );
}
