import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Search, ShoppingBag, Clock, CheckCircle, Eye, XCircle, Filter, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { startOfToday, startOfWeek, startOfMonth, startOfYear, endOfToday, endOfWeek, endOfMonth, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAdminOrders, getUsers, type AdminOrder, type UserResponse } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";

function formatDateTime(raw: string): { date: string; time: string } {
  if (!raw) return { date: "—", time: "" };
  try {
    const hasTime = raw.includes("T") || /\d{2}:\d{2}/.test(raw);
    const d = new Date(raw);
    if (isNaN(d.getTime())) return { date: raw, time: "" };
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const time = hasTime ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
    return { date, time };
  } catch {
    return { date: raw, time: "" };
  }
}

// ── Minimal inline status chip — no bright colours, just text weight + subtle bg ──
const StatusChip = ({ status, type }: { status: string; type: "order" | "payment" }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    PROCESSING: { label: "Processing", cls: "bg-amber-50 text-amber-700" },
    PACKED: { label: "Packed", cls: "bg-indigo-50 text-indigo-700" },
    ON_THE_WAY: { label: "On The Way", cls: "bg-blue-50 text-blue-700" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", cls: "bg-blue-50 text-blue-700" },
    DELIVERED: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
    // payment statuses
    Paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
    Pending: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
    Refunded: { label: "Refunded", cls: "bg-slate-100 text-slate-600" },
    Failed: { label: "Failed", cls: "bg-red-50 text-red-600" },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

const allStatuses = ["PROCESSING", "PACKED", "ON_THE_WAY", "DELIVERED", "CANCELLED"];

function enrichOrdersWithCustomer(orders: AdminOrder[], users: UserResponse[]): AdminOrder[] {
  return orders.map((order) => {
    if (order.customer && order.customer !== "Unknown Customer") return order;
    const matchedUser = users.find((user) => Number(user.id) === Number(order.userId));
    if (!matchedUser) return order;

    return {
      ...order,
      customer: matchedUser.name || order.customer,
      customerEmail: order.customerEmail || matchedUser.email,
      customerPhone: order.customerPhone || matchedUser.mobile,
    };
  });
}

const Orders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState<string>("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter) setFilterType(urlFilter);
  }, [searchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [data, users] = await Promise.all([
          getAdminOrders(),
          getUsers().catch(() => []),
        ]);
        const enriched = enrichOrdersWithCustomer(data, users);
        const sorted = enriched.sort((a, b) => {
          const tA = new Date(a.date || 0).getTime();
          const tB = new Date(b.date || 0).getTime();
          const timeDiff = (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
          if (timeDiff !== 0) return timeDiff;
          return Number(b.id) - Number(a.id);
        });
        setOrders(sorted);
      } catch (error: any) {
        setErrorMessage(error?.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const itemsPerPage = 10;

  // Apply date preset
  const applyDatePreset = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    switch (preset) {
      case "today":
        setFromDate(startOfToday().toISOString().split("T")[0]);
        setToDate(endOfToday().toISOString().split("T")[0]);
        break;
      case "weekly":
        setFromDate(startOfWeek(today).toISOString().split("T")[0]);
        setToDate(endOfWeek(today).toISOString().split("T")[0]);
        break;
      case "monthly":
        setFromDate(startOfMonth(today).toISOString().split("T")[0]);
        setToDate(endOfMonth(today).toISOString().split("T")[0]);
        break;
      case "yearly":
        setFromDate(startOfYear(today).toISOString().split("T")[0]);
        setToDate(endOfYear(today).toISOString().split("T")[0]);
        break;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterType !== "All") {
      if (filterType === "Pending" && ["DELIVERED", "CANCELLED"].includes(order.status)) return false;
      if (filterType === "Completed" && order.status !== "DELIVERED") return false;
      if (filterType === "Refunded" && order.payment !== "Refunded") return false;
      if (allStatuses.includes(filterType) && order.status !== filterType) return false;
    }
    const term = searchTerm.toLowerCase();
    if (term && !order.id.toString().toLowerCase().includes(term) && !order.customer.toLowerCase().includes(term)) return false;
    if (fromDate && order.date && new Date(order.date) < new Date(fromDate)) return false;
    if (toDate && order.date && new Date(order.date) > new Date(toDate)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === "DELIVERED").length;
  const cancelledCount = orders.filter(o => o.status === "CANCELLED").length;

  const handleStatClick = (type: string) => setFilterType(prev => prev === type ? "All" : type);
  const handlePageChange = (p: number) => { if (p > 0 && p <= totalPages) setCurrentPage(p); };

  const statCards = [
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, filter: "All", activeFilter: filterType },
    { label: "Pending", value: pendingCount, icon: Clock, filter: "Pending", activeFilter: filterType },
    { label: "Delivered", value: completedCount, icon: CheckCircle, filter: "Completed", activeFilter: filterType },
    { label: "Cancelled", value: cancelledCount, icon: XCircle, filter: "CANCELLED", activeFilter: filterType },
  ];

  const statusFilters = [
    { label: "All", value: "All" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Packed", value: "PACKED" },
    { label: "On The Way", value: "ON_THE_WAY" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 pb-6 mt-4">

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => {
            const active = card.activeFilter === card.filter;
            return (
              <GlassCard
                key={card.label}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md",
                  active && "ring-2 ring-primary/40"
                )}
                onClick={() => handleStatClick(card.filter)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  active ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <card.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* ── Table Card ── */}
        <GlassCard className="overflow-hidden p-0">

          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Search Bar */}
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Search by order ID or customer…"
                  className="w-full h-9 pl-9 pr-3 text-sm bg-muted/40 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                />
              </div>

              {/* Filter Section */}
              <div className="flex items-center gap-3 md:justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/40 text-foreground hover:bg-muted transition-all border border-border">
                      <Filter className="w-3.5 h-3.5" />
                      {filterType !== "All" || dateRangePreset ? "Filtered" : "All"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border bg-card shadow-elevated p-1">
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                    </div>
                    <div className="space-y-0.5">
                      {statusFilters.map((f) => (
                        <DropdownMenuCheckboxItem
                          key={f.value}
                          checked={filterType === f.value}
                          onCheckedChange={() => { setFilterType(f.value); setCurrentPage(1); }}
                          className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                        >
                          {f.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                    
                    <DropdownMenuSeparator className="my-1 opacity-50" />
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date Range</p>
                    </div>
                    <div className="space-y-0.5">
                      {[
                        { id: "today", label: "Today" },
                        { id: "weekly", label: "This Week" },
                        { id: "monthly", label: "This Month" },
                        { id: "yearly", label: "This Year" }
                      ].map((preset) => (
                        <DropdownMenuCheckboxItem
                          key={preset.id}
                          checked={dateRangePreset === preset.id}
                          onCheckedChange={() => applyDatePreset(preset.id)}
                          className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                        >
                          {preset.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {(filterType !== "All" || fromDate || toDate) && (
                  <button
                    onClick={() => {
                      setFilterType("All");
                      setFromDate("");
                      setToDate("");
                      setDateRangePreset("");
                      setCurrentPage(1);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="py-3 px-5 text-left text-xs font-semibold text-muted-foreground">Order ID</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="py-3 px-5 text-center text-xs font-semibold text-muted-foreground">Payment</th>
                  <th className="py-3 px-5 text-center text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="py-3 px-5 text-center text-xs font-semibold text-muted-foreground w-14">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading orders...
                      </span>
                    </td>
                  </tr>
                )}
                {!isLoading && errorMessage && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-destructive">{errorMessage}</td>
                  </tr>
                )}
                {paginatedOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer",
                      i % 2 === 1 && "bg-muted/10"
                    )}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="py-3.5 px-5 text-left font-semibold text-foreground">{order.id}</td>
                    <td className="py-3.5 px-5 text-left text-muted-foreground">{order.customer}</td>
                    <td className="py-3.5 px-5 text-left align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-foreground font-medium">{formatDateTime(order.date).date}</span>
                        {formatDateTime(order.date).time && (
                          <span className="text-[11px] text-muted-foreground">{formatDateTime(order.date).time}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-semibold text-foreground">{order.amount}</td>
                    <td className="py-3.5 px-5 text-center"><StatusChip status={order.payment} type="payment" /></td>
                    <td className="py-3.5 px-5 text-center"><StatusChip status={order.status} type="order" /></td>
                    <td className="py-3.5 px-5 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="w-7 h-7 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground flex items-center justify-center transition-colors mx-auto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && !errorMessage && paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                      currentPage === p ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
