import { User, ChevronDown, Settings, LogOut, Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { clearAdminSession, getAdminUserFromStorage } from "@/lib/adminSession";
import { adminLogout } from "@/lib/api";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/products": "Products",
  "/categories": "Categories",
  "/inventory": "Inventory & Pricing",
  "/coupons": "Coupons",
  "/orders": "Orders",
  "/payments": "Payments",
  "/banners": "Banners",
  "/members": "Members",
  "/users": "Users",
  "/profile": "Profile",
  "/settings": "Settings",
  "/manage/permissions": "Manage",
};

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminUser = getAdminUserFromStorage();

  let pageTitle = pageTitles[location.pathname];
  if (!pageTitle) {
    if (location.pathname.startsWith("/category/")) pageTitle = "Category Details";
    else if (location.pathname.startsWith("/orders/")) pageTitle = "Order Details";
    else if (location.pathname.startsWith("/analytics/")) pageTitle = "Analytics";
    else if (location.pathname.startsWith("/support/ticket/")) pageTitle = "Ticket Details";
    else if (location.pathname.startsWith("/support/")) pageTitle = "Support Center";
    else pageTitle = "Dashboard";
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <motion.h2
          key={pageTitle}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-semibold text-foreground tracking-tight"
        >
          {pageTitle}
        </motion.h2>
      </div>

      {/* Right: Profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-foreground leading-tight">{adminUser.name}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{adminUser.email}</p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-elevated overflow-hidden z-50"
            >
              <button
                onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" /> Profile
              </button>
              <button
                onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" /> Settings
              </button>
              <div className="border-t border-border" />
              <button
                onClick={async () => {
                  setProfileOpen(false);
                  try {
                    await adminLogout();
                  } catch (error) {
                    console.error("Logout API failed:", error);
                  } finally {
                    clearAdminSession();
                    window.location.href = "/login";
                  }
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/8 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
