import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { APP_ROUTES } from "@/constants/routes";
import { LayoutDashboard, Users, Store, QrCode, LogOut, Menu, FileQuestion, Globe, Mic, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout() {
  const { logout } = useAuthStore();

  // Uncomment when testing auth flow
  // if (!isAuthenticated || user?.role !== 'Admin') {
  //   return <Navigate to={APP_ROUTES.ADMIN_LOGIN} replace />;
  // }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-border p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary">VinhKhanh Admin</h2>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        <Link to={APP_ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_OWNERS} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Users className="w-5 h-5" />
          <span>Duyệt Owner</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_POIS} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Store className="w-5 h-5" />
          <span>Duyệt POI</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_QR} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <QrCode className="w-5 h-5" />
          <span>Mã QR</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_QUIZ} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <FileQuestion className="w-5 h-5" />
          <span>Câu hỏi Quiz</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_AUDIO} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Mic className="w-5 h-5" />
          <span>Âm Thanh (TTS)</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_LANGUAGES} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Globe className="w-5 h-5" />
          <span>Ngôn Ngữ</span>
        </Link>
        <Link to={APP_ROUTES.ADMIN_AUDIT_LOGS} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ShieldAlert className="w-5 h-5" />
          <span>Audit Logs</span>
        </Link>
      </nav>
      <div className="pt-4 border-t border-border mt-2">
        <Button variant="ghost" className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10" onClick={logout}>
          <LogOut className="w-5 h-5 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-surface flex items-center px-4 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="ml-4 font-semibold text-primary">Admin CMS</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


