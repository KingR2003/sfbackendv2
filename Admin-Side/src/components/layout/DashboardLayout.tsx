import { ReactNode, useState, createContext, useContext } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayoutContext = createContext<boolean>(false);

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isNested = useContext(DashboardLayoutContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If we are already inside a DashboardLayout (i.e. we made it global),
  // skip rendering the nested layout shell and just render children.
  if (isNested) {
    return <>{children}</>;
  }

  return (
    <DashboardLayoutContext.Provider value={true}>
      <div className="min-h-screen bg-background">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

      {/* Main content area */}
      <div
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col"
        style={{ paddingLeft: sidebarCollapsed ? 80 : 260 }}
      >
        <AppHeader
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 px-6 pb-8 pt-2">
          {children}
        </main>
      </div>
    </div>
    </DashboardLayoutContext.Provider>
  );
}
