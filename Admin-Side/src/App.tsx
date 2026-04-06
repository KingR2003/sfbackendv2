import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import Members from "./pages/Members";
import Coupons from "./pages/Coupons";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Payments from "./pages/Payments";
import Banners from "./pages/Banners";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CategoryDetails from "./pages/CategoryDetails";
import Users from "./pages/UsersPage";
import ManagePermissions from "./pages/ManagePermissions";
import SupportCenter from "./pages/SupportCenter";
import TicketDetails from "./pages/TicketDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const queryClient = new QueryClient();

const MainRoutes = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Routes>
          <Route path="/dashboard" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/category/:category" element={<CategoryDetails />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/members" element={<Members />} />
          <Route path="/users" element={<Users />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics/:reportType" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/manage" element={<Navigate to="/manage/permissions" replace />} />
          <Route path="/manage/permissions" element={<ManagePermissions />} />
          <Route path="/support" element={<Navigate to="/support/overview" replace />} />
          <Route path="/support/:section" element={<SupportCenter />} />
          <Route path="/support/ticket/:ticketId" element={<TicketDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/svasthya/admin-side/">
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<MainRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
