import { useState, useMemo, useRef, useEffect } from "react";
import OrderQueryForm from "@/components/OrderQueryForm";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CalendarDays,
  Calendar,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Circle,
  BellRing,
  TrendingUp,
  Inbox,
} from "lucide-react";
import {
  startOfToday, endOfToday,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subMonths, parseISO,
  isWithinInterval, format,
} from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getAdminQueries, type AdminSupportTicket, type SupportTicketPriority as TicketPriority, type SupportTicketStatus as TicketStatus } from "@/lib/api";

// ─── Status config ─────────────────────────────────────────────────────────────
const statusCfg: Record<TicketStatus, { cls: string; icon: React.ReactNode }> = {
  "Open":                 { cls: "bg-blue-50 text-blue-700 border border-blue-200",     icon: <Circle       className="w-3 h-3" /> },
  "In Progress":          { cls: "bg-amber-50 text-amber-700 border border-amber-200",  icon: <Loader2      className="w-3 h-3" /> },
  "Waiting for Customer": { cls: "bg-violet-50 text-violet-700 border border-violet-200", icon: <Clock      className="w-3 h-3" /> },
  "Resolved":             { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  "Closed":               { cls: "bg-slate-100 text-slate-500 border border-slate-200", icon: <XCircle      className="w-3 h-3" /> },
};

const priorityCfg: Record<TicketPriority, string> = {
  Low:    "bg-slate-100 text-slate-500",
  Medium: "bg-sky-50 text-sky-700",
  High:   "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-600",
};

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const { cls, icon } = statusCfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${cls}`}>
      {icon} {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${priorityCfg[priority]}`}>
    {priority}
  </span>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const now = new Date();
const thisMonthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
const lastMonthInterval = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
const thisWeekInterval  = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
const todayInterval     = { start: startOfToday(), end: endOfToday() };

const PRESETS: Record<string, { label: string; start: Date; end: Date }> = {
  today:      { label: "Today",      ...todayInterval },
  thisWeek:   { label: "This Week",  ...thisWeekInterval },
  thisMonth:  { label: "This Month", ...thisMonthInterval },
  lastMonth:  { label: "Last Month", ...lastMonthInterval },
};

const allStatuses: TicketStatus[] = ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
const allPriorities: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW sub-page
// ═══════════════════════════════════════════════════════════════════════════════
const StatCard = ({
  label, value, icon, sub, colorCls,
}: { label: string; value: number; icon: React.ReactNode; colorCls: string; sub?: string }) => (
  <GlassCard className="p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  </GlassCard>
);

const Overview = ({
  onNavigate,
  tickets,
}: {
  onNavigate: (path: string) => void;
  tickets: AdminSupportTicket[];
}) => {
  const total         = tickets.length;
  const open          = tickets.filter(t => t.status === "Open").length;
  const inProgress    = tickets.filter(t => t.status === "In Progress").length;
  const waiting       = tickets.filter(t => t.status === "Waiting for Customer").length;
  const resolved      = tickets.filter(t => t.status === "Resolved").length;
  const closed        = tickets.filter(t => t.status === "Closed").length;

  const today2        = tickets.filter(t => isWithinInterval(parseISO(t.created_at), todayInterval)).length;
  const thisWeek2     = tickets.filter(t => isWithinInterval(parseISO(t.created_at), thisWeekInterval)).length;
  const thisMonth2    = tickets.filter(t => isWithinInterval(parseISO(t.created_at), thisMonthInterval)).length;
  const lastMonth2    = tickets.filter(t => isWithinInterval(parseISO(t.created_at), lastMonthInterval)).length;

  const newCount      = tickets.filter(t => t.status === "Open" && t.replies.length <= 1).length;

  const recent = [...tickets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Notification banner */}
      {newCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm"
        >
          <BellRing className="w-4 h-4 flex-shrink-0" />
          <span>You have <strong>{newCount}</strong> new support ticket{newCount > 1 ? "s" : ""} awaiting response.</span>
          <button onClick={() => onNavigate("/support/open")} className="ml-auto text-blue-700 font-medium hover:underline text-xs">View Open →</button>
        </motion.div>
      )}

      {/* Status summary cards - clickable */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ticket Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div onClick={() => onNavigate("/support/all")} className="cursor-pointer">
            <StatCard label="Total Tickets" value={total} colorCls="bg-slate-100 text-slate-600" icon={<LifeBuoy className="w-5 h-5" />} />
          </div>
          <div onClick={() => onNavigate("/support/open")} className="cursor-pointer">
            <StatCard label="Open" value={open} colorCls="bg-blue-50 text-blue-600" icon={<Circle className="w-5 h-5" />} />
          </div>
          <div onClick={() => onNavigate("/support/inprogress")} className="cursor-pointer">
            <StatCard label="In Progress" value={inProgress} colorCls="bg-amber-50 text-amber-600" icon={<Loader2 className="w-5 h-5" />} />
          </div>
          <div onClick={() => onNavigate("/support/waiting")} className="cursor-pointer">
            <StatCard label="Waiting for Customer" value={waiting} colorCls="bg-violet-50 text-violet-600" icon={<Clock className="w-5 h-5" />} />
          </div>
          <div onClick={() => onNavigate("/support/resolved")} className="cursor-pointer">
            <StatCard label="Resolved / Closed" value={resolved + closed} colorCls="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Request Volume</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today"      value={today2}      colorCls="bg-slate-100 text-slate-600"   icon={<CalendarDays className="w-5 h-5" />} />
          <StatCard label="This Week"  value={thisWeek2}   colorCls="bg-sky-50 text-sky-600"        icon={<TrendingUp   className="w-5 h-5" />} />
          <StatCard label="This Month" value={thisMonth2}  colorCls="bg-teal-50 text-teal-600"      icon={<CalendarDays className="w-5 h-5" />} />
          <StatCard label="Last Month" value={lastMonth2}  colorCls="bg-violet-50 text-violet-600"  icon={<CalendarDays className="w-5 h-5" />} />
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold mb-4">Tickets by Priority</h3>
          <div className="space-y-3">
            {allPriorities.map(p => {
              const count = tickets.filter(t => t.priority === p).length;
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              const barCls: Record<TicketPriority, string> = { Low: "bg-slate-300", Medium: "bg-sky-400", High: "bg-orange-400", Urgent: "bg-red-500" };
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{p}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${barCls[p]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Recent tickets */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-semibold">Recent Tickets</h3>
          </div>
          <div className="divide-y divide-border/50">
            {recent.map(t => (
              <button
                key={t.id}
                onClick={() => onNavigate(`/support/ticket/${t.id}`)}
                className="w-full text-left px-5 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-mono text-muted-foreground">{t.ticket_id}</span>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground">{t.customer_name} · {format(parseISO(t.created_at), "d MMM yyyy")}</p>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ─── Date Range Picker ────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS  = ["S","M","T","W","T","F","S"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isInRange(d: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const t = d.getTime();
  return t > Math.min(from.getTime(), to.getTime()) && t < Math.max(from.getTime(), to.getTime());
}
function startOfDayLocal(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function fmtDate(d: Date | null) {
  if (!d) return "dd/mm/yyyy";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onApply: (from: Date | null, to: Date | null) => void;
  onClose: () => void;
  onBack?: () => void;
}

function DateRangePicker({ from, to, onApply, onClose, onBack }: DateRangePickerProps) {
  const today = startOfDayLocal(new Date());
  const [viewYear,  setViewYear]  = useState(from ? from.getFullYear()  : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(from ? from.getMonth()     : today.getMonth());
  const [selFrom,   setSelFrom]   = useState<Date | null>(from);
  const [selTo,     setSelTo]     = useState<Date | null>(to);
  const [hover,     setHover]     = useState<Date | null>(null);
  const [step,      setStep]      = useState<"from" | "to">("from");
  const [view,      setView]      = useState<"calendar" | "month" | "year">("calendar");

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
      else setSelTo(d);
      setStep("from");
    }
  }

  const effective = selTo ?? hover;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(viewYear, viewMonth, i));
  while (cells.length % 7 !== 0) cells.push(null);

  const yearStart = Math.floor(viewYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-2 z-50 bg-card border border-border/70 rounded-2xl shadow-2xl"
      style={{ width: 300 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
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

        {/* Month picker */}
        {view === "month" && (
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {MONTH_SHORT.map((m, i) => (
              <button key={m} onClick={() => { setViewMonth(i); setView("calendar"); }}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${i === viewMonth ? "bg-primary text-white" : "hover:bg-muted text-foreground"}`}>
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Year picker */}
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
                <button key={y} onClick={() => { setViewYear(y); setView("calendar"); }}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors ${y === viewYear ? "bg-primary text-white" : "hover:bg-muted text-foreground"}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar grid */}
        {view === "calendar" && (
          <div>
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="h-9" />;
                const isFrom  = !!(selFrom && isSameDay(d, selFrom));
                const isTo    = !!(effective && isSameDay(d, effective));
                const inRange = isInRange(d, selFrom, effective);
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={i}
                    onMouseEnter={() => step === "to" && setHover(d)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => handleDay(d)}
                    className={`flex items-center justify-center h-9 cursor-pointer select-none ${inRange ? "bg-primary/12" : ""} ${isFrom ? "rounded-l-full bg-primary/12" : ""} ${isTo ? "rounded-r-full bg-primary/12" : ""} ${!isFrom && !isTo && !inRange ? "rounded-full" : ""}`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${isFrom || isTo ? "bg-primary text-white shadow-sm" : ""} ${!isFrom && !isTo && isToday ? "border-2 border-primary/50 text-primary font-semibold" : ""} ${!isFrom && !isTo && !isToday ? "text-foreground hover:bg-primary/10" : ""}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FROM / TO pills */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("from")}
              className={`flex-1 flex flex-col items-start px-3 py-2 rounded-xl border transition-all ${step === "from" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70"}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${step === "from" ? "text-primary" : "text-muted-foreground"}`}>From</span>
              <span className={`text-xs font-mono font-medium ${selFrom ? (step === "from" ? "text-primary" : "text-foreground") : "text-muted-foreground"}`}>{selFrom ? fmtDate(selFrom) : "dd/mm/yyyy"}</span>
            </button>
            <span className="text-muted-foreground text-sm font-medium flex-shrink-0">→</span>
            <button onClick={() => selFrom && setStep("to")} disabled={!selFrom}
              className={`flex-1 flex flex-col items-start px-3 py-2 rounded-xl border transition-all ${step === "to" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed"}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${step === "to" ? "text-primary" : "text-muted-foreground"}`}>To</span>
              <span className={`text-xs font-mono font-medium ${selTo ? (step === "to" ? "text-primary" : "text-foreground") : "text-muted-foreground"}`}>{selTo ? fmtDate(selTo) : "dd/mm/yyyy"}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button onClick={onBack ?? onClose} className="flex-1 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border border-border">
            {onBack ? "← Back" : "Cancel"}
          </button>
          <button onClick={() => onApply(selFrom, selTo)} disabled={!selFrom || !selTo}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TICKETS LIST sub-page
// ═══════════════════════════════════════════════════════════════════════════════
const TicketsList = ({
  filterStatus,
  tickets,
  onNavigate,
}: {
  filterStatus?: TicketStatus;
  tickets: AdminSupportTicket[];
  onNavigate: (path: string) => void;
}) => {
  const [search, setSearch]                    = useState("");
  const [statusFilters, setStatusFilters]      = useState<TicketStatus[]>(filterStatus ? [filterStatus] : []);
  const [priorityFilters, setPriFilters]       = useState<TicketPriority[]>([]);
  const [dateFrom, setDateFrom]                = useState<Date | null>(null);
  const [dateTo, setDateTo]                    = useState<Date | null>(null);
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const customPickerRef                         = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage]          = useState(1);
  const [ticketStatuses, setTicketStatuses]    = useState<Record<string, TicketStatus>>({});
  const itemsPerPage = 10;

  const getStatus = (t: AdminSupportTicket) => ticketStatuses[t.id] ?? t.status;
  const setStatus = (id: string, s: TicketStatus) => setTicketStatuses(prev => ({ ...prev, [id]: s }));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customPickerRef.current && !customPickerRef.current.contains(e.target as Node)) {
        setShowCustomPicker(false);
      }
    }
    if (showCustomPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCustomPicker]);

  const toggleStatus = (s: TicketStatus) => {
    setStatusFilters(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
    setCurrentPage(1);
  };

  const togglePriority = (p: TicketPriority) => {
    setPriFilters(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const term = search.toLowerCase();
      if (term &&
        !t.ticket_id.toLowerCase().includes(term) &&
        !t.order_id.toLowerCase().includes(term) &&
        !t.customer_name.toLowerCase().includes(term) &&
        !t.customer_email.toLowerCase().includes(term) &&
        !t.subject.toLowerCase().includes(term)
      ) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(t.status)) return false;
      if (priorityFilters.length > 0 && !priorityFilters.includes(t.priority)) return false;
      const date = parseISO(t.created_at);
      if (dateFrom && date < dateFrom) return false;
      if (dateTo   && date > new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59)) return false;
      return true;
    });
  }, [tickets, search, statusFilters, priorityFilters, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasFilters = search || activeDatePreset !== null || statusFilters.length > 0 || priorityFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search ticket ID, order ID, customer…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Date filter */}
          <div className="relative flex-shrink-0" ref={customPickerRef}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9">
                  <Calendar className="w-4 h-4" />
                  {activeDatePreset === null
                    ? "Date Range"
                    : activeDatePreset === "custom"
                    ? "Custom"
                    : PRESETS[activeDatePreset]?.label ?? "Date Range"}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="w-52 rounded-2xl border border-border bg-card shadow-2xl p-0 overflow-hidden">
                <div className="px-4 pt-3.5 pb-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Select</p>
                </div>
                <div className="px-2 pb-2">
                  <DropdownMenuItem
                    onSelect={() => { setDateFrom(null); setDateTo(null); setActiveDatePreset(null); setShowCustomPicker(false); setCurrentPage(1); }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${activeDatePreset === null ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                  >
                    All Time
                    {activeDatePreset === null ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                  </DropdownMenuItem>
                  {(["today", "thisWeek", "thisMonth", "lastMonth"] as const).map(key => (
                    <DropdownMenuItem
                      key={key}
                      onSelect={() => { setDateFrom(PRESETS[key].start); setDateTo(PRESETS[key].end); setActiveDatePreset(key); setShowCustomPicker(false); setCurrentPage(1); }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${activeDatePreset === key ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                    >
                      {PRESETS[key].label}
                      {activeDatePreset === key ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                    </DropdownMenuItem>
                  ))}
                  <div className="my-1.5 border-t border-border/50" />
                  <DropdownMenuItem
                    onSelect={() => setShowCustomPicker(v => !v)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${activeDatePreset === "custom" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
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
                  onApply={(f, t) => { setDateFrom(f); setDateTo(t); setActiveDatePreset("custom"); setCurrentPage(1); setShowCustomPicker(false); }}
                  onClose={() => setShowCustomPicker(false)}
                  onBack={() => setShowCustomPicker(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9 hover:bg-muted transition-colors">
                <Filter className="w-4 h-4" />
                Status {statusFilters.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{statusFilters.length}</span>}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-border bg-card shadow-2xl p-0 overflow-hidden">
              <div className="px-4 pt-3.5 pb-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by Status</p>
              </div>
              <div className="px-2 pb-2">
                <DropdownMenuItem
                  onSelect={() => { setStatusFilters([]); setCurrentPage(1); }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${statusFilters.length === 0 ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                >
                  All
                  {statusFilters.length === 0 ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                </DropdownMenuItem>
                <div className="my-1.5 border-t border-border/50" />
                {allStatuses.map(s => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={e => { e.preventDefault(); toggleStatus(s); }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${statusFilters.includes(s) ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                  >
                    {s}
                    {statusFilters.includes(s) ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9 hover:bg-muted transition-colors">
                <AlertCircle className="w-4 h-4" />
                Priority {priorityFilters.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{priorityFilters.length}</span>}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-border bg-card shadow-2xl p-0 overflow-hidden">
              <div className="px-4 pt-3.5 pb-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by Priority</p>
              </div>
              <div className="px-2 pb-2">
                <DropdownMenuItem
                  onSelect={() => { setPriFilters([]); setCurrentPage(1); }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${priorityFilters.length === 0 ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                >
                  All
                  {priorityFilters.length === 0 ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                </DropdownMenuItem>
                <div className="my-1.5 border-t border-border/50" />
                {allPriorities.map(p => (
                  <DropdownMenuItem
                    key={p}
                    onSelect={e => { e.preventDefault(); togglePriority(p); }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${priorityFilters.includes(p) ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                  >
                    {p}
                    {priorityFilters.includes(p) ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <span className="w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setDateFrom(null); setDateTo(null); setActiveDatePreset(null); setShowCustomPicker(false); setStatusFilters(filterStatus ? [filterStatus] : []); setPriFilters([]); setCurrentPage(1); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors h-9 px-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""} found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ticket ID</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Subject</th>
                <th className="px-4 py-3 font-medium hidden xl:table-cell">Priority</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No tickets found
                  </td>
                </tr>
              ) : (
                paginated.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => onNavigate(`/support/ticket/${ticket.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{ticket.ticket_id}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{ticket.order_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {ticket.customer_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground whitespace-nowrap">{ticket.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">{ticket.customer_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground hidden lg:table-cell max-w-[200px] truncate">{ticket.subject}</td>
                    <td className="px-4 py-3 hidden xl:table-cell"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{format(parseISO(ticket.created_at), "d MMM yyyy")}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap border cursor-pointer hover:opacity-80 transition-opacity ${statusCfg[getStatus(ticket)].cls}`}>
                            {statusCfg[getStatus(ticket)].icon}
                            {getStatus(ticket)}
                            <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52 rounded-2xl border border-border bg-card shadow-2xl p-0 overflow-hidden">
                          <div className="px-4 pt-3.5 pb-1.5">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Change Status</p>
                          </div>
                          <div className="px-2 pb-2">
                            {allStatuses.map(s => (
                              <DropdownMenuItem
                                key={s}
                                onSelect={() => setStatus(ticket.id, s)}
                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${getStatus(ticket) === s ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}
                              >
                                <span className="flex items-center gap-2">{statusCfg[s].icon} {s}</span>
                                {getStatus(ticket) === s && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); onNavigate(`/support/ticket/${ticket.id}`); }}
                        className="inline-flex items-center justify-center text-primary hover:text-primary/70 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 px-3 text-xs">Previous</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(p)} className="h-8 w-8 p-0 text-xs">{p}</Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 px-3 text-xs">Next</Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const subSectionMeta: Record<string, { title: string; filterStatus?: TicketStatus }> = {
  overview:   { title: "Overview" },
  all:        { title: "All Tickets" },
  open:       { title: "Open Tickets",       filterStatus: "Open" },
  inprogress: { title: "In Progress",        filterStatus: "In Progress" },
  waiting:    { title: "Waiting for Customer", filterStatus: "Waiting for Customer" },
  resolved:   { title: "Resolved",           filterStatus: "Resolved" },
   orderquery: { title: "Order Related Query" },
};

const SupportCenter = () => {
  const { section = "overview" } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const meta = subSectionMeta[section] ?? subSectionMeta["overview"];

  const onNavigate = (path: string) => navigate(path);

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getAdminQueries();
        if (!isMounted) return;
        setTickets(data);
      } catch (error: any) {
        if (!isMounted) return;
        setLoadError(error?.message || "Failed to load queries");
        setTickets([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTickets();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
          </div>
        </div>
      </div>

      <motion.div
        key={section}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loadError && (
          <GlassCard className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200">
            Unable to load support queries: {loadError}
          </GlassCard>
        )}

        {loading && section !== "orderquery" && (
          <GlassCard className="p-6 text-sm text-muted-foreground">Loading support queries...</GlassCard>
        )}

        {section === "overview" ? (
          <Overview onNavigate={onNavigate} tickets={tickets} />
        ) : section === "orderquery" ? (
          <OrderQueryForm />
        ) : (
          <TicketsList
            filterStatus={meta.filterStatus}
            tickets={tickets}
            onNavigate={onNavigate}
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default SupportCenter;
