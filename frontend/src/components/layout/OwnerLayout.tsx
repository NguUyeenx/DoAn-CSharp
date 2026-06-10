import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { APP_ROUTES } from "@/constants/routes";
import { LayoutDashboard, Store, MenuSquare, Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function OwnerLayout() {
  const { logout } = useAuthStore();

  // Uncomment when testing auth flow
  // if (!isAuthenticated) {
  //   return <Navigate to={APP_ROUTES.LOGIN} replace />;
  // }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-border p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary">Owner Portal</h2>
      </div>
      <nav className="flex-1 space-y-2">
        <Link to={APP_ROUTES.OWNER_DASHBOARD} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link to={APP_ROUTES.OWNER_POIS} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Store className="w-5 h-5" />
          <span>Quản lý POI</span>
        </Link>
        <Link to={APP_ROUTES.OWNER_MENU} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <MenuSquare className="w-5 h-5" />
          <span>Quản lý Menu</span>
        </Link>
        <Link to={APP_ROUTES.OWNER_NOTIFICATIONS} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span>Thông báo</span>
        </Link>
      </nav>
      <div className="pt-4 border-t border-border">
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
          <span className="ml-4 font-semibold text-primary">Owner Portal</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


