import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LayoutDashboard, Package, FolderTree, Ticket, ShoppingCart, CreditCard, Image, Users, User, BarChart as BarChartIcon, LogOut, ChevronDown, ChevronRight, Shield, LifeBuoy } from "lucide-react";
import { clearAdminSession } from "@/lib/adminSession";
import { adminLogout } from "@/lib/api";
import { redirectTo } from "@/lib/routing";

const menuItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Categories", path: "/categories", icon: FolderTree },
  { title: "Products", path: "/products", icon: Package },
  { title: "Orders", path: "/orders", icon: ShoppingCart },
  { title: "Coupons", path: "/coupons", icon: Ticket },
  { title: "Payments", path: "/payments", icon: CreditCard },
  { title: "Banners", path: "/banners", icon: Image },
  { title: "Members", path: "/members", icon: Users },
  { title: "Users", path: "/users", icon: User },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChartIcon,
    subItems: [
      { title: "Revenue", path: "/analytics/revenue" },
      { title: "Product Performance", path: "/analytics/product" },
      { title: "Demographic", path: "/analytics/demographic" },
      { title: "Sales Funnel", path: "/analytics/funnel" },
      { title: "Order Status", path: "/analytics/order_status" },
      { title: "Payment & Refund", path: "/analytics/payment" },
      { title: "Inventory", path: "/analytics/inventory" },
      { title: "Banners", path: "/analytics/banners" },
    ]
  },
  {
    title: "Support Center",
    path: "/support",
    icon: LifeBuoy,
    subItems: [
      { title: "Overview",             path: "/support/overview" },
      { title: "All Tickets",          path: "/support/all" },
      { title: "In Progress",          path: "/support/inprogress" },
      { title: "Resolved",             path: "/support/resolved" },
      { title: "Closed",               path: "/support/closed" },
    ],
  },
  { title: "Manage", path: "/manage/permissions", icon: Shield },
];
interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

export function AppSidebar({ collapsed, onCollapse }: AppSidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => ({
    "/analytics": location.pathname.startsWith("/analytics"),
    "/support": location.pathname.startsWith("/support"),
  }));

  // Auto-collapse/expand sub-menus based on current route
  useEffect(() => {
    setExpandedMenus(prev => ({
      ...prev,
      "/analytics": location.pathname.startsWith("/analytics"),
      "/support": location.pathname.startsWith("/support"),
    }));
  }, [location.pathname]);

  const toggleMenu = (path: string, e: React.MouseEvent) => {
    if (collapsed) {
      onCollapse();
    }
    setExpandedMenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col glass-dark border-r-0"
    >
      <div className="flex flex-col w-full h-full overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-8 h-[88px] flex-shrink-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg gradient-green flex items-center justify-center shadow-lg green-glow-sm">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold text-sidebar-foreground tracking-tight whitespace-nowrap overflow-hidden"
          >
            Svasthya Fresh
          </motion.span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path + "/"));
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus[item.path];

            return (
              <div key={item.path} className="space-y-1">
                <NavLink
                  to={hasSubItems ? (isExpanded ? item.path : item.path) : item.path}
                  className="block group"
                  onClick={(e) => hasSubItems && toggleMenu(item.path, e)}
                >
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 4 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${isActive && !hasSubItems
                      ? "bg-sidebar-accent text-sidebar-primary green-glow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.title : ""}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"}`} />
                    <motion.span
                      animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                      transition={{ duration: 0.2 }}
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden flex-1 flex items-center justify-between ${isActive ? "text-sidebar-primary" : ""}`}
                    >
                      {item.title}
                      {hasSubItems && (
                        <span className="ml-auto opacity-70">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                      )}
                    </motion.span>
                  </motion.div>
                </NavLink>

                {/* Sub Menu Items */}
                <AnimatePresence>
                  {hasSubItems && isExpanded && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex flex-col gap-1 mt-1 pl-11 pr-2 relative"
                    >
                      <div className="absolute left-[22px] top-0 bottom-4 w-px bg-sidebar-foreground/10" />
                      {item.subItems?.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <NavLink key={subItem.path} to={subItem.path} className="block w-full">
                            <div className={`text-xs py-2 px-3 rounded-lg transition-colors flex items-center relative gap-2 w-full
                              ${isSubActive ? "bg-sidebar-accent/50 text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"}
                            `}>
                              {isSubActive && <div className="absolute left-[-22px] w-3 h-px bg-sidebar-primary" />}
                              {subItem.title}
                            </div>
                          </NavLink>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 mt-auto">
          <button
            onClick={async () => {
              try {
                await adminLogout();
              } catch (error) {
                console.error("Logout API failed:", error);
              } finally {
                clearAdminSession();
                redirectTo("/login");
              }
            }}
            className="w-full group"
          >
            <motion.div
              whileHover={{ x: collapsed ? 0 : 4 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative text-sidebar-foreground hover:bg-white/95 hover:text-red-600 hover:shadow-[0_0_20px_rgba(255,0,0,0.15)] ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Log Out" : ""}
            >
              <LogOut className={`w-5 h-5 flex-shrink-0 transition-colors group-hover:text-red-600`} />
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.2 }}
                className="text-sm font-semibold whitespace-nowrap overflow-hidden group-hover:text-red-600"
              >
                Log Out
              </motion.span>
            </motion.div>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
