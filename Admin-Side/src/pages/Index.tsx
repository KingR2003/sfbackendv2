import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminOrders, getAnalyticsDashboard, getAnalyticsProducts, getAnalyticsDemographic, getUsers, type AdminOrder, type UserResponse } from "@/lib/api";
import { Check, Calendar, ChevronDown, ExternalLink, DollarSign, ShoppingCart, TrendingUp, BarChart3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const dateFilters = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

function getDateFilterDays(filter: string) {
  if (filter.includes("7")) return 7;
  if (filter.includes("30")) return 30;
  if (filter.includes("90")) return 90;
  return 365;
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatOrderDate(raw: string) {
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function getOrderAmount(order: AdminOrder) {
  return Number(order.finalAmount ?? order.totalAmount ?? 0) || 0;
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PROCESSING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Processing" },
    PACKED: { bg: "bg-blue-100", text: "text-blue-700", label: "Packed" },
    ON_THE_WAY: { bg: "bg-indigo-100", text: "text-indigo-700", label: "On The Way" },
    DELIVERED: { bg: "bg-green-100", text: "text-green-700", label: "Delivered" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
  };

  const config = statusConfig[status] || { bg: "bg-slate-100", text: "text-slate-700", label: status };
  return (
    <span className={cn("px-2 py-1 text-xs rounded-full font-medium", config.bg, config.text)}>
      {config.label}
    </span>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedDateFilter, setSelectedDateFilter] = useState("Last 30 Days");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [productAnalytics, setProductAnalytics] = useState<any>(null);
  const [demographicAnalytics, setDemographicAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const days = getDateFilterDays(selectedDateFilter);
        const filters = { dateFilter: selectedDateFilter, days };

        const [dashData, ordersData, usersData, productsData, demographicData] = await Promise.all([
          getAnalyticsDashboard(filters),
          getAdminOrders(),
          getUsers(),
          getAnalyticsProducts(filters),
          getAnalyticsDemographic(filters),
        ]);

        console.log("Dashboard data:", { dashData, productsData, demographicData });

        setDashboardData(dashData);
        setOrders(Array.isArray(ordersData) ? ordersData : ordersData?.data || []);
        setUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
        setProductAnalytics(productsData);
        setDemographicAnalytics(demographicData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDateFilter]);

  // Calculate filtered orders based on date range
  const days = getDateFilterDays(selectedDateFilter);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const filteredOrders = orders.filter((order) => {
    if (!order.date) return true;
    const date = new Date(order.date);
    if (Number.isNaN(date.getTime())) return true;
    return date >= start && date <= now;
  });

  // Calculate revenue
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);

  // Calculate profit and loss (assuming 30% average margin)
  const estimatedCost = totalRevenue * 0.7;
  const profit = totalRevenue - estimatedCost;
  const loss = profit < 0 ? Math.abs(profit) : 0;

  // Calculate conversion rate (orders / 100 visitors assumption)
  const conversionRate = filteredOrders.length > 0 ? ((filteredOrders.length / 100) * 100).toFixed(1) : "0.0";

  // Revenue line chart data
  const revenueLineData = (() => {
    const map = new Map<string, { date: string; revenue: number }>();
    for (let i = Math.min(days - 1, 29); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      map.set(key, {
        date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        revenue: 0,
      });
    }

    filteredOrders.forEach((order) => {
      if (!order.date) return;
      const date = new Date(order.date);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      const existing = map.get(key);
      if (existing) {
        existing.revenue += getOrderAmount(order);
      }
    });

    return Array.from(map.values());
  })();

  // Prepare product performance data - STRICTLY from API/database
  const chartColors = ["#10b981", "#6366f1", "#a855f7", "#f59e0b", "#0ea5e9", "#ec4899", "#14b8a6", "#f97316"];
  
  const productBarData = (() => {
    let data = productAnalytics?.barData ?? productAnalytics?.processedProducts ?? [];
    
    if (Array.isArray(data) && data.length > 0) {
      return data
        .map((item: any) => ({
          name: String(item.name ?? item.product ?? "Unknown"),
          revenue: Number(item.revenue ?? item.value ?? 0),
        }))
        .filter(item => item.revenue > 0)
        .slice(0, 6);
    }
    return [];
  })();

  const categoryPieData = (() => {
    let data = productAnalytics?.pieData ?? [];
    
    if (Array.isArray(data) && data.length > 0) {
      return data
        .map((item: any) => ({
          name: String(item.name ?? item.category ?? "Unknown"),
          value: Number(item.value ?? item.units ?? item.unitsSold ?? 0),
        }))
        .filter(item => item.value > 0)
        .slice(0, 5);
    }
    return [];
  })();

  const visibleCategoryPieData = categoryPieData.length > 0 && categoryPieData.some((item: any) => item.value > 0)
    ? categoryPieData
    : [{ name: "No category data available", value: 1 }];

  // Demographic data analysis - STRICTLY from API/database
  const demographicData = (() => {
    let ageData: any[] = [];
    let genderData: any[] = [];

    // Use ONLY API demographic data from database
    if (demographicAnalytics && typeof demographicAnalytics === "object") {
      // Age distribution from database
      if (Array.isArray(demographicAnalytics.ageData) && demographicAnalytics.ageData.length > 0) {
        ageData = demographicAnalytics.ageData
          .map((item: any) => ({ 
            name: String(item.age || item.range || item.ageGroup || "Unknown"), 
            value: Number(item.count || item.value || 0) 
          }))
          .filter(item => item.value > 0);
      }
      
      // Gender distribution from database - include ALL genders
      if (Array.isArray(demographicAnalytics.genderPieData) && demographicAnalytics.genderPieData.length > 0) {
        genderData = demographicAnalytics.genderPieData
          .map((item: any) => ({ 
            name: String(item.name || item.gender || "Unknown"), 
            value: Number(item.value || item.count || 0) 
          }))
          .filter(item => item.value > 0);
      }
    }

    return {
      ageDistribution: ageData,
      genderDistribution: genderData,
    };
  })();

  const ageChartData = demographicData.ageDistribution.length > 0
    ? demographicData.ageDistribution
    : [{ name: "No age data available", value: 1 }];

  const genderChartData = demographicData.genderDistribution.length > 0
    ? demographicData.genderDistribution
    : [{ name: "No data", value: 0 }];

  // Recent orders
  const recentOrders = filteredOrders.slice(0, 8);

  // Enrich orders with customer names
  const enrichedRecentOrders = recentOrders.map((order) => {
    let customerName = String(order.customer || "").trim();
    if (!customerName || customerName === "Unknown Customer") {
      const user = users.find((u) => Number(u.id) === Number(order.userId));
      customerName = user?.name || "Unknown";
    }
    return { ...order, customer: customerName };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-6">
        {/* Top: Date Filter */}
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedDateFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1">
              {dateFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter}
                  onSelect={() => setSelectedDateFilter(filter)}
                  className={cn(
                    "flex items-center justify-between rounded px-3 py-2 text-sm cursor-pointer",
                    selectedDateFilter === filter
                      ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  {filter}
                  {selectedDateFilter === filter && <Check className="w-3.5 h-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 🔥 TOP SECTION: 4 KPIs WITH ICONS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue KPI */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Revenue</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{formatCurrency(totalRevenue)}</h2>
            </div>
          </div>

          {/* Orders KPI */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Orders</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{filteredOrders.length}</h2>
            </div>
          </div>

          {/* Profit KPI */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Profit</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{formatCurrency(profit)}</h2>
            </div>
          </div>

          {/* Conversion Rate KPI */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Conversion</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{conversionRate}%</h2>
            </div>
          </div>
        </div>

        {/* 📊 MIDDLE SECTION: REVENUE CHART */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue Trend</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{selectedDateFilter}</span>
          </div>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-slate-400">
              <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueLineData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10b981" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 📊 PRODUCT PERFORMANCE & DEMOGRAPHICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Product Performance Bar Chart */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Products by Revenue</h3>
              <button
                onClick={() => navigate("/analytics/product")}
                className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors"
              >
                View Report <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : productBarData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productBarData} layout="vertical" margin={{ top: 0, right: 15, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      contentStyle={{
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="#006400" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No product data available
              </div>
            )}
          </div>

          {/* Demographics Pie Chart */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Units Sold by Category</h3>
            </div>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : visibleCategoryPieData.length > 0 ? (
              <div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={visibleCategoryPieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                        {visibleCategoryPieData.map((item: any, index: number) => (
                          <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value.toString(), "Units"]}
                        contentStyle={{
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-3">
                  {visibleCategoryPieData.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center gap-1 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* � DEMOGRAPHIC ANALYSIS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Customer Age Distribution */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Customer Age Distribution</h3>
              <button
                onClick={() => navigate("/analytics/demographics")}
                className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors"
              >
                View Report <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : ageChartData.length > 0 && ageChartData[0].value > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [value.toString(), "Customers"]}
                      contentStyle={{
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No demographic data available
              </div>
            )}
          </div>

          {/* Customer Gender Distribution */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Customer Gender Distribution</h3>
            </div>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : genderChartData.length > 0 && genderChartData[0].value > 0 ? (
              <div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderChartData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={2}>
                        {genderChartData.map((item: any, index: number) => (
                          <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value.toString(), "Customers"]}
                        contentStyle={{
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-3">
                  {genderChartData.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center gap-1 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No demographic data available
              </div>
            )}
          </div>
        </div>

        {/* �📋 BOTTOM SECTION: RECENT ORDERS TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Orders</h3>
            <button
              onClick={() => navigate("/orders")}
              className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
            </div>
          ) : enrichedRecentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedRecentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${String(order.id).replace("#", "")}`)}
                    >
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{order.id}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order.customer}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatOrderDate(order.date)}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">{formatCurrency(getOrderAmount(order))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">No orders found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
