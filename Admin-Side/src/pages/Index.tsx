import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Bell,
  XCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Calendar,
  TrendingDown,
  ExternalLink,
  Activity,
  Users,
  Truck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dateFilters = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

const stats = [
  {
    title: "Total Revenue",
    value: "₹12,45,200",
    change: "+14.5%",
    up: true,
    icon: IndianRupee,
    bg: "bg-primary/10",
    iconColor: "text-primary",
    link: "/analytics/revenue",
  },
  {
    title: "Total Orders",
    value: "200",
    change: "+12%",
    up: true,
    icon: ShoppingCart,
    bg: "bg-emerald-100 dark:bg-emerald-950/30",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    link: "/analytics/order_status",
  },
  {
    title: "Overall Conversion",
    value: "8.92%",
    change: "+2.1%",
    up: true,
    icon: TrendingUp,
    bg: "bg-teal-100 dark:bg-teal-950/30",
    iconColor: "text-teal-700 dark:text-teal-400",
    link: "/analytics/funnel",
  },
  {
    title: "Avg Order Value",
    value: "₹3,241",
    change: "+8.2%",
    up: true,
    icon: Activity,
    bg: "bg-green-100 dark:bg-green-950/30",
    iconColor: "text-green-700 dark:text-green-400",
    link: "/analytics/revenue",
  },
];

const productPerformance = [
  { product: "Honey", revenue: 345200, units: 1240, color: "hsl(162,60%,40%)" },
  { product: "Ghee", revenue: 428900, units: 980, color: "hsl(142,65%,36%)" },
  { product: "Chikki", revenue: 267100, units: 760, color: "hsl(122,52%,38%)" },
];

const genderData = [
  { name: "Male", value: 45, color: "hsl(162,60%,40%)" },
  { name: "Female", value: 52, color: "hsl(122,52%,38%)" },
  { name: "Other", value: 3, color: "hsl(142,65%,36%)" },
];

const ageDistribution = [
  { age: "18-24", count: 234 },
  { age: "25-34", count: 567 },
  { age: "35-44", count: 423 },
  { age: "45-54", count: 289 },
  { age: "55+", count: 134 },
];

const paymentData = [
  { name: "UPI", value: 42, color: "hsl(142,65%,36%)" },
  { name: "Net Banking", value: 18, color: "hsl(162,58%,42%)" },
  { name: "Credit Card", value: 15, color: "hsl(122,52%,38%)" },
  { name: "Debit Card", value: 13, color: "hsl(142,48%,56%)" },
  { name: "Cash on Delivery", value: 12, color: "hsl(172,55%,34%)" },
];

const alerts = [
  { id: 1, type: "Low Stock", message: "15 products running low on stock", severity: "red", icon: Package, link: "/products?filter=LowStock" },
  { id: 2, type: "Expiry Alert", message: "8 products expiring in 30 days", severity: "yellow", icon: AlertTriangle, link: "/products?filter=Active" },
  { id: 3, type: "High Cancellation", message: "Cancellation rate up by 2.3%", severity: "yellow", icon: XCircle, link: "/analytics/order_status" },
  { id: 4, type: "High Refunds", message: "Refund requests increased this week", severity: "red", icon: TrendingDown, link: "/analytics/payment" },
];

// ₹”€₹”€ Order Status Pipeline ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€
const orderStatusPipeline = [
  { status: "CREATED", count: 40, pct: "20.0%", bg: "bg-green-50  dark:bg-green-950/20", text: "text-green-600  dark:text-green-400", filter: "CREATED" },
  { status: "PROCESSING", count: 39, pct: "19.5%", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700  dark:text-green-300", filter: "PROCESSING" },
  { status: "PAID", count: 30, pct: "15.0%", bg: "bg-teal-100  dark:bg-teal-900/30", text: "text-teal-700   dark:text-teal-300", filter: "PAID" },
  { status: "OUT FOR DELIVERY", count: 28, pct: "14.0%", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", filter: "OUT_FOR_DELIVERY" },
  { status: "DELIVERED", count: 35, pct: "17.5%", bg: "bg-emerald-200 dark:bg-emerald-800/40", text: "text-emerald-800 dark:text-emerald-200", filter: "DELIVERED" },
  { status: "CANCELLED", count: 28, pct: "14.0%", bg: "bg-red-100    dark:bg-red-900/30", text: "text-red-700    dark:text-red-300", filter: "CANCELLED" },
];

// ₹”€₹”€ Sales Funnel Mini ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€
const funnelStages = [
  { stage: "Visitors", count: 1480, dropoff: null },
  { stage: "Add to Cart", count: 760, dropoff: "48.6%" },
  { stage: "Checkout Started", count: 420, dropoff: "44.7%" },
  { stage: "Payment Completed", count: 132, dropoff: "68.6%" },
];

// ₹”€₹”€ Payment Health Metrics ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€
const paymentHealth = [
  { label: "Paid", value: 132, pct: "66%", color: "text-primary", bg: "bg-primary/10" },
  { label: "Refunded", value: 11, pct: "5.5%", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { label: "Failed", value: 17, pct: "8.5%", color: "text-destructive", bg: "bg-destructive/10" },
];

// ₹”€₹”€ Inventory Health ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€
const inventoryProducts = [
  { name: "Organic Honey", stock: 300, max: 850 },
  { name: "Pure Desi Ghee", stock: 500, max: 850 },
  { name: "Chikki", stock: 50, max: 850 },
];

const chartData = [
  { month: "Jan", revenue: 320000, orders: 240 },
  { month: "Feb", revenue: 380000, orders: 280 },
  { month: "Mar", revenue: 350000, orders: 260 },
  { month: "Apr", revenue: 420000, orders: 310 },
  { month: "May", revenue: 480000, orders: 350 },
  { month: "Jun", revenue: 520000, orders: 380 },
  { month: "Jul", revenue: 580000, orders: 420 },
];

const recentOrders = [
  { id: "#ORD-2847", customer: "Rahul Sharma", amount: "₹2,450", status: "Delivered", variant: "green" as const },
  { id: "#ORD-2846", customer: "Priya Patel", amount: "₹1,890", status: "Processing", variant: "yellow" as const },
  { id: "#ORD-2845", customer: "Amit Kumar", amount: "₹3,200", status: "Paid", variant: "green" as const },
  { id: "#ORD-2844", customer: "Sneha Reddy", amount: "₹980", status: "Pending", variant: "yellow" as const },
  { id: "#ORD-2843", customer: "Vikram Singh", amount: "₹4,100", status: "Out for Delivery", variant: "green" as const },
  { id: "#ORD-2842", customer: "Anita Desai", amount: "₹1,560", status: "Cancelled", variant: "red" as const },
  { id: "#ORD-2841", customer: "Karan Johar", amount: "₹5,400", status: "Delivered", variant: "green" as const },
  { id: "#ORD-2840", customer: "Deepika P", amount: "₹1,200", status: "Paid", variant: "green" as const },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl shadow-xl p-3 text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">
            {p.name === "revenue" ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDateFilter, setSelectedDateFilter] = useState("Last 30 Days");
  const itemsPerPage = 5;
  const totalPages = Math.ceil(recentOrders.length / itemsPerPage);
  const paginatedOrders = recentOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-6">

        {/* Date Filter */}
        <div className="sticky top-14 z-30 -mx-6 px-6 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border/50 flex items-center justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl shadow-sm hover:bg-muted/50 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 group">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{selectedDateFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-44 rounded-xl border border-border bg-card shadow-elevated p-1">
              {dateFilters.map((f) => (
                <DropdownMenuItem
                  key={f}
                  onSelect={() => setSelectedDateFilter(f)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${selectedDateFilter === f ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/70"
                    }`}
                >
                  {f}
                  {selectedDateFilter === f && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(stat.link)}
              className="cursor-pointer group"
            >
              <GlassCard className="p-4 h-full border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200 kpi-card-green">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                  <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${stat.up
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"}`}>
                    {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-base font-bold text-foreground leading-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">{stat.title}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* ₹”€₹”€ Main Grid ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€ */}
        <div className="flex flex-col gap-6">

          {/* Revenue Area Chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard
              className="p-6 border border-border/50 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate("/analytics/revenue")}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-foreground">Revenue Overview</h3>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/analytics/revenue"); }}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  Full Report <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142,65%,36%)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="hsl(142,65%,36%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(162,58%,42%)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="hsl(162,58%,42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142,65%,36%)" strokeWidth={2.5} fill="url(#revGradient)" dot={false} activeDot={{ r: 5, fill: "hsl(142,65%,36%)" }} />
                  <Area type="monotone" dataKey="orders" stroke="hsl(162,58%,42%)" strokeWidth={2} fill="url(#ordGradient)" dot={false} activeDot={{ r: 4, fill: "hsl(162,58%,42%)" }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(142,65%,36%)" }} /><span className="text-xs text-muted-foreground">Revenue</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(162,58%,42%)" }} /><span className="text-xs text-muted-foreground">Orders</span></div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Product Performance + Customer Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Product Performance */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <GlassCard
                className="p-6 h-full border border-border/50 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => navigate("/analytics/product")}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Product Performance</h3>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-4">
                  {productPerformance.map((product, i) => (
                    <div key={product.product}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: product.color }} />
                          <span className="text-sm font-semibold text-foreground">{product.product}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-foreground">₹{(product.revenue / 1000).toFixed(1)}k</span>
                          <span className="text-xs text-muted-foreground ml-2">{product.units} units</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(product.revenue / 428900) * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className="h-full rounded-full"
                          style={{ background: product.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Customer Split */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard
                className="p-6 h-full border border-border/50 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => navigate("/analytics/demographic")}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Customer Split</h3>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value">
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {genderData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Age Groups</p>
                  <div className="space-y-1.5">
                    {ageDistribution.map((item) => (
                      <div key={item.age} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{item.age}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* ₹”€₹”€ Order Status Pipeline ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€ */}


          {/* ₹”€₹”€ Alerts + Payment Split ₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€₹”€ */}
          <div className="grid grid-cols-2 gap-6 w-full">

            {/* Alerts */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard className="p-5 h-full border border-border/50">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-destructive" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Alerts</h3>
                </div>
                <div className="space-y-2.5">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => navigate(alert.link)}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] border-l-4 ${alert.severity === "red"
                        ? "bg-destructive/5 border-l-destructive"
                        : "bg-amber-50/70 dark:bg-amber-950/10 border-l-amber-400"
                        }`}
                    >
                      <alert.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === "red" ? "text-destructive" : "text-amber-500"}`} />
                      <div>
                        <p className={`text-xs font-bold ${alert.severity === "red" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>
                          {alert.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Inventory Health */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <GlassCard
                className="p-5 h-full border border-border/50 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => navigate("/analytics/inventory")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Inventory Health</h3>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate("/analytics/inventory"); }}
                    className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                  >
                    View Inventory <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: "Total Stock", value: "850", color: "bg-primary/10 text-primary" },
                    { label: "Out of Stock", value: "0", color: "bg-primary/10 text-primary" },
                    { label: "Expiry Soon", value: "0", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
                    { label: "Reorder Needed", value: "0", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
                  ].map((badge) => (
                    <div key={badge.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.color}`}>
                      <span>{badge.label}:</span><span className="font-bold">{badge.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {inventoryProducts.map((product, i) => {
                    const pct = (product.stock / product.max) * 100;
                    const barColor = pct < 10 ? "hsl(0,70%,50%)" : pct < 30 ? "hsl(38,95%,54%)" : "hsl(142,65%,36%)";
                    return (
                      <div key={product.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-foreground">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{product.stock} / {product.max}</span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Recent Orders */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <GlassCard className="border border-border/50">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground">Recent Orders</h3>
                <button
                  onClick={() => navigate("/orders")}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border/50 bg-muted/20">
                      <th className="text-left py-3 px-6 font-medium">Order ID</th>
                      <th className="text-left py-3 px-6 font-medium">Customer</th>
                      <th className="text-left py-3 px-6 font-medium">Amount</th>
                      <th className="text-left py-3 px-6 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order, idx) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                        onClick={() => navigate(`/orders/${order.id.replace("#", "")}`)}
                      >
                        <td className="py-3.5 px-6 text-sm font-semibold text-foreground">{order.id}</td>
                        <td className="py-3.5 px-6 text-sm text-muted-foreground">{order.customer}</td>
                        <td className="py-3.5 px-6 text-sm font-bold text-foreground">{order.amount}</td>
                        <td className="py-3.5 px-6"><StatusBadge status={order.status} variant={order.variant} /></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-xs text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, recentOrders.length)} of {recentOrders.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${currentPage === i + 1 ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
