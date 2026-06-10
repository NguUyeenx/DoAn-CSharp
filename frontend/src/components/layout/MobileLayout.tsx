import { Outlet, NavLink } from "react-router-dom";
import { Home, Search, Map, MapPin } from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";

export default function MobileLayout() {
  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="h-16 border-t border-border bg-surface flex items-center justify-around px-2 shrink-0 pb-safe">
        <NavLink
          to={APP_ROUTES.HOME}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>
        <NavLink
          to={APP_ROUTES.SEARCH}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </NavLink>
        <NavLink
          to={APP_ROUTES.MAP}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Map className="w-5 h-5" />
          <span>Map</span>
        </NavLink>
        <NavLink
          to={APP_ROUTES.TOURS}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <MapPin className="w-5 h-5" />
          <span>Tours</span>
        </NavLink>
      </nav>
    </div>
  );
}


