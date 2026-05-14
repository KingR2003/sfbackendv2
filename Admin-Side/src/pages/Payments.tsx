import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Hourglass, RotateCcw, X, Search, Filter, ChevronLeft, ChevronRight, Check, Calendar, ChevronDown, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockOrders } from "@/data/mockData";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DATE_FILTERS = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

function getPresetRange(filter: string): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const from = startOfDay(now);
  if (filter === "Last 7 Days") from.setDate(now.getDate() - 6);
  else if (filter === "Last 30 Days") from.setDate(now.getDate() - 29);
  else if (filter === "Last 90 Days") from.setDate(now.getDate() - 89);
  else if (filter === "This Year") from.setMonth(0, 1);
  else if (filter === "1 Year") from.setFullYear(now.getFullYear() - 1);
  // "Today" → from = startOfDay(now), which is the default
  return { from, to };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isInRange(d: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const t = d.getTime();
  return t > Math.min(from.getTime(), to.getTime()) && t < Math.max(from.getTime(), to.getTime());
}
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function fmt(d: Date | null) {
  if (!d) return "dd/mm/yyyy";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ── Single-Month Date Range Picker ─────────────────────────────────────────
interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onApply: (from: Date | null, to: Date | null) => void;
  onClose: () => void;
  onBack?: () => void;
}

function DateRangePicker({ from, to, onApply, onClose, onBack }: DateRangePickerProps) {
  const today = startOfDay(new Date());
  const [viewYear, setViewYear] = useState(from ? from.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(from ? from.getMonth() : today.getMonth());
  const [selFrom, setSelFrom] = useState<Date | null>(from);
  const [selTo, setSelTo] = useState<Date | null>(to);
  const [hover, setHover] = useState<Date | null>(null);
  const [step, setStep] = useState<"from" | "to">("from");
  // "calendar" | "month" | "year"
  const [view, setView] = useState<"calendar" | "month" | "year">("calendar");

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDay(d: Date) {
    if (step === "from") { setSelFrom(d); setSelTo(null); setStep("to"); }
    else {
      if (selFrom && d < selFrom) { setSelFrom(d); setSelTo(selFrom); }
      else { setSelTo(d); }
      setStep("from");
    }
  }

  const effective = selTo ?? hover;

  // Build calendar cells
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(viewYear, viewMonth, i));
  while (cells.length % 7 !== 0) cells.push(null);

  // Year range for year view (12 years centred on viewYear)
  const yearStart = Math.floor(viewYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 z-50 bg-card border border-border/70 rounded-2xl shadow-2xl"
      style={{ width: 300 }}
    >
      <div className="p-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Clickable Month + Year */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView(v => v === "month" ? "calendar" : "month")}
              className={`px-2 py-1 rounded-lg text-sm font-semibold transition-colors ${view === "month" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}
            >
              {MONTH_NAMES[viewMonth]}
            </button>
            <button
              onClick={() => setView(v => v === "year" ? "calendar" : "year")}
              className={`px-2 py-1 rounded-lg text-sm font-semibold transition-colors ${view === "year" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}
            >
              {viewYear}
            </button>
          </div>

          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Month Selector ── */}
        {view === "month" && (
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {MONTH_SHORT.map((m, i) => (
              <button
                key={m}
                onClick={() => { setViewMonth(i); setView("calendar"); }}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${i === viewMonth ? "bg-primary text-white" : "hover:bg-muted text-foreground"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* ── Year Selector ── */}
        {view === "year" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setViewYear(y => y - 12)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground font-medium">{yearStart} – {yearStart + 11}</span>
              <button onClick={() => setViewYear(y => y + 12)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => { setViewYear(y); setView("calendar"); }}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors ${y === viewYear ? "bg-primary text-white" : "hover:bg-muted text-foreground"
                    }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Calendar Grid ── */}
        {view === "calendar" && (
          <div>
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="h-9" />;
                const isFrom = !!(selFrom && isSameDay(d, selFrom));
                const isTo = !!(effective && isSameDay(d, effective));
                const inRange = isInRange(d, selFrom, effective);
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={i}
                    onMouseEnter={() => step === "to" && setHover(d)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => handleDay(d)}
                    className={`
                      flex items-center justify-center h-9 cursor-pointer select-none
                      ${inRange ? "bg-primary/12" : ""}
                      ${isFrom ? "rounded-l-full bg-primary/12" : ""}
                      ${isTo ? "rounded-r-full bg-primary/12" : ""}
                      ${!isFrom && !isTo && !inRange ? "rounded-full" : ""}
                    `}
                  >
                    <span className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                      ${isFrom || isTo ? "bg-primary text-white shadow-sm" : ""}
                      ${!isFrom && !isTo && isToday ? "border-2 border-primary/50 text-primary font-semibold" : ""}
                      ${!isFrom && !isTo && !isToday ? "text-foreground hover:bg-primary/10" : ""}
                    `}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── From / To display ── */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {/* FROM pill */}
            <button
              onClick={() => setStep("from")}
              className={`flex-1 flex flex-col items-start px-3 py-2 rounded-xl border transition-all ${step === "from"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70"
                }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${step === "from" ? "text-primary" : "text-muted-foreground"
                }`}>From</span>
              <span className={`text-xs font-mono font-medium ${selFrom ? (step === "from" ? "text-primary" : "text-foreground") : "text-muted-foreground"
                }`}>
                {selFrom ? fmt(selFrom) : "dd/mm/yyyy"}
              </span>
            </button>

            <span className="text-muted-foreground text-sm font-medium flex-shrink-0">→</span>

            {/* TO pill */}
            <button
              onClick={() => selFrom && setStep("to")}
              disabled={!selFrom}
              className={`flex-1 flex flex-col items-start px-3 py-2 rounded-xl border transition-all ${step === "to"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${step === "to" ? "text-primary" : "text-muted-foreground"
                }`}>To</span>
              <span className={`text-xs font-mono font-medium ${selTo ? (step === "to" ? "text-primary" : "text-foreground") : "text-muted-foreground"
                }`}>
                {selTo ? fmt(selTo) : "dd/mm/yyyy"}
              </span>
            </button>
          </div>

        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2 mt-3">
          <button onClick={onBack ?? onClose} className="flex-1 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border border-border">
            {onBack ? "← Back" : "Cancel"}
          </button>
          <button
            onClick={() => onApply(selFrom, selTo)}
            disabled={!selFrom || !selTo}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Payments Page ───────────────────────────────────────────────────────────
const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Paid" | "Pending" | "Refunded">("All");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest">("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<typeof mockOrders[0] | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState("Last 30 Days");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const customPickerRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customPickerRef.current && !customPickerRef.current.contains(e.target as Node)) {
        setShowCustomPicker(false);
      }
    }
    if (showCustomPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCustomPicker]);

  function applyPreset(label: string) {
    const { from, to } = getPresetRange(label);
    setDateFrom(from);
    setDateTo(to);
    setActiveDatePreset(label);
    setSelectedDateFilter(label);
    setCurrentPage(1);
  }

  // Resolve active date range: custom picker takes precedence, else use dropdown preset
  const activeDateRange = (activeDatePreset === "Custom" && dateFrom && dateTo)
    ? { from: dateFrom, to: dateTo }
    : getPresetRange(selectedDateFilter || "Last 30 Days");

  const filteredPayments = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = paymentFilter === "All" ? true : order.payment === paymentFilter;
    const orderDate = new Date(order.date);
    const matchesDate = orderDate >= activeDateRange.from && orderDate <= activeDateRange.to;
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const tA = new Date(a.date).getTime();
    const tB = new Date(b.date).getTime();
    return sortBy === "Oldest" ? tA - tB : tB - tA;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleRowClick = (payment: typeof mockOrders[0]) => { setSelectedPayment(payment); setShowPanel(true); };
  const handleRefund = (e: React.MouseEvent) => { e.stopPropagation(); };

  return (
    <DashboardLayout>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4">
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-foreground">₹54.3L</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Hourglass className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="text-xl font-bold text-foreground">₹12.5k</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Refunded</p>
            <p className="text-xl font-bold text-foreground">₹2.4k</p>
          </div>
        </GlassCard>
      </div>

      {/* Table Card */}
      <GlassCard className="p-0 overflow-hidden">
        {/* Toolbar — same layout as Orders/Users/Coupons */}
        <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-muted/40 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 md:justify-end flex-shrink-0">

              {/* Date dropdown */}
              <div className="relative flex-shrink-0" ref={customPickerRef}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/40 text-foreground hover:bg-muted transition-all border border-border">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {activeDatePreset === "Custom" ? "Custom" : selectedDateFilter}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6} className="w-52 rounded-2xl border border-border bg-card shadow-2xl p-0 overflow-hidden">
                    <div className="px-4 pt-3.5 pb-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select Period</p>
                    </div>
                    <div className="px-2 pb-2">
                      {(["Today", "Last 7 Days", "Last 30 Days", "Last 90 Days", "1 Year"] as const).map((label) => (
                        <DropdownMenuItem
                          key={label}
                          onSelect={() => { applyPreset(label); setShowCustomPicker(false); }}
                          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${activeDatePreset === label ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                        >
                          {label}
                          {activeDatePreset === label ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                        </DropdownMenuItem>
                      ))}
                      <div className="my-1.5 border-t border-border/50" />
                      <DropdownMenuItem
                        onSelect={() => setShowCustomPicker(v => !v)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${activeDatePreset === "Custom" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                      >
                        Custom Range
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AnimatePresence>
                  {showCustomPicker && (
                    <DateRangePicker
                      from={dateFrom}
                      to={dateTo}
                      onApply={(f, t) => { setDateFrom(f); setDateTo(t); setActiveDatePreset("Custom"); setCurrentPage(1); setShowCustomPicker(false); }}
                      onClose={() => setShowCustomPicker(false)}
                      onBack={() => setShowCustomPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${paymentFilter !== "All" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/40 text-foreground hover:bg-muted"}`}>
                    <Filter className="w-3.5 h-3.5" />
                    {paymentFilter !== "All" ? paymentFilter : "All"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl bg-card border-border shadow-xl p-1">
                  {[{ label: "All Payments", value: "All" }, { label: "Paid", value: "Paid" }, { label: "Pending", value: "Pending" }, { label: "Refunded", value: "Refunded" }].map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => { setPaymentFilter(opt.value as "All" | "Paid" | "Pending" | "Refunded"); setCurrentPage(1); }}
                      className={`cursor-pointer rounded-lg mx-1 my-0.5 text-sm font-medium flex items-center justify-between ${paymentFilter === opt.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}
                    >
                      {opt.label}
                      {paymentFilter === opt.value && <Check className="w-3.5 h-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/40 border border-border hover:bg-muted transition-all">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortBy === "Newest" ? "Newest First" : "Oldest First"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl bg-card border-border shadow-xl p-1">
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort By</p>
                  </div>
                  {[{ label: "Newest First", value: "Newest" }, { label: "Oldest First", value: "Oldest" }].map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s.value}
                      checked={sortBy === s.value}
                      onCheckedChange={() => { setSortBy(s.value as any); setCurrentPage(1); }}
                      className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                    >
                      {s.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear */}
              {(searchTerm !== "" || paymentFilter !== "All" || (activeDatePreset !== null && activeDatePreset !== "Last 30 Days")) && (
                <button
                  onClick={() => { setSearchTerm(""); setPaymentFilter("All"); applyPreset("Last 30 Days"); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left py-4 px-5 font-medium">Order ID</th>
                <th className="text-left py-4 px-5 font-medium">Amount</th>
                <th className="text-left py-4 px-5 font-medium">Payment Method</th>
                <th className="text-left py-4 px-5 font-medium">Status</th>
                <th className="text-left py-4 px-5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((order) => (
                <motion.tr
                  key={order.id}
                  whileHover={{ backgroundColor: "hsla(130, 85%, 45%, 0.04)" }}
                  className="border-b border-border/50 cursor-pointer"
                  onClick={() => handleRowClick(order)}
                >
                  <td className="py-3.5 px-5 text-sm font-semibold text-foreground hover:text-primary transition-colors">{order.id}</td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-foreground">{order.amount}</td>
                  <td className="py-3.5 px-5 text-sm text-muted-foreground">{order.paymentMethod}</td>
                  <td className="py-3.5 px-5"><StatusBadge status={order.payment} variant={order.payment === "Paid" ? "green" : order.payment === "Pending" ? "yellow" : "red"} /></td>
                  <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                    {order.payment === "Paid" && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRefund}
                        className="px-3.5 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors">Refund</motion.button>
                    )}
                    {order.payment === "Refunded" && <span className="text-xs text-muted-foreground">Refunded</span>}
                    {order.payment === "Pending" && <span className="text-xs text-muted-foreground">Awaiting</span>}
                  </td>
                </motion.tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                        <Search className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No payments found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search, date range, or status filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                Previous
              </button>
              <span className="text-xs font-medium text-foreground">Page {currentPage} of {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                Next
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Payment Details Modal */}
      {showPanel && selectedPayment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPanel(false)} />

          {/* Modal — wider than tall */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-5">
              <h2 className="text-base font-bold text-foreground">Payment Details</h2>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Identity strip */}
            <div className="flex items-center gap-4 px-7 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground leading-tight">{selectedPayment.customer}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{selectedPayment.id}</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <StatusBadge
                  status={selectedPayment.payment}
                  variant={selectedPayment.payment === "Paid" ? "green" : selectedPayment.payment === "Pending" ? "yellow" : "red"}
                />
              </div>
            </div>

            <div className="border-t border-border/60 mx-7" />

            {/* Fields — 2-column grid */}
            <div className="grid grid-cols-2 gap-px bg-border/40 mx-7 mt-5 rounded-2xl overflow-hidden border border-border/40">
              <div className="bg-muted/40 px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Amount</p>
                <p className="text-sm font-bold text-foreground">{selectedPayment.amount}</p>
              </div>
              <div className="bg-muted/40 px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Payment Method</p>
                <p className="text-sm font-semibold text-foreground">{selectedPayment.paymentMethod}</p>
              </div>
              <div className="bg-muted/40 px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Date</p>
                <p className="text-sm font-semibold text-foreground">{selectedPayment.date}</p>
              </div>
              <div className="bg-muted/40 px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Shipping Address</p>
                <p className="text-sm font-semibold text-foreground truncate">{selectedPayment.shippingAddress}</p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center gap-3 px-7 py-5 mt-2">
              <button
                onClick={() => setShowPanel(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
              {selectedPayment.payment === "Paid" ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleRefund}
                  className="flex-1 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
                >
                  Process Refund
                </motion.button>
              ) : (
                <div className="flex-1 py-2.5 rounded-xl bg-muted/50 text-center text-sm font-semibold text-muted-foreground select-none">
                  {selectedPayment.payment === "Refunded" ? "Already Refunded" : "Payment Pending"}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Payments;
