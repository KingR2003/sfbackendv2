import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalyticsSidebar, AnalyticsFilters } from "@/components/analytics/AnalyticsSidebar";
import { RevenueReport } from "@/components/analytics/RevenueReport";
import { ProductPerformanceReport } from "@/components/analytics/ProductPerformanceReport";
import { CustomerDemographicReport } from "@/components/analytics/CustomerDemographicReport";
import { SalesFunnelReport } from "@/components/analytics/SalesFunnelReport";
import { OrderStatusReport } from "@/components/analytics/OrderStatusReport";
import { PaymentRefundReport } from "@/components/analytics/PaymentRefundReport";
import { InventoryReport } from "@/components/analytics/InventoryReport";
import { BannerAnalyticsDashboard } from "@/components/banners/BannerAnalyticsDashboard";
import { INITIAL_BANNERS, computeStatus } from "@/components/banners/bannerTypes";

const BANNERS_WITH_STATUS = INITIAL_BANNERS.map(b => ({ ...b, status: computeStatus(b) }));
import { cn } from "@/lib/utils";
import {
    BarChart2, TrendingUp, Users, Filter, ShoppingBag, CreditCard,
    Package, SlidersHorizontal, X, ChevronDown, FileText, Download, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { startOfToday, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfToday, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from "date-fns";

const DATE_FILTERS = [
    { id: "today", label: "Today" },
    { id: "week", label: "Last 7 Days" },
    { id: "month", label: "Last 30 Days" },
    { id: "quarter", label: "Last 90 Days" },
    { id: "year", label: "This Year" },
];

const toISO = (d: Date) => d.toISOString().split("T")[0];

function getDateRangeForFilter(filterId: string): { startDate: string; endDate: string } {
    const now = new Date();
    const today = toISO(now);
    switch (filterId) {
        case "today": return { startDate: today, endDate: today };
        case "week": { const f = new Date(now); f.setDate(now.getDate() - 6); return { startDate: toISO(f), endDate: today }; }
        case "month": { const f = new Date(now); f.setDate(now.getDate() - 29); return { startDate: toISO(f), endDate: today }; }
        case "quarter": { const f = new Date(now); f.setDate(now.getDate() - 89); return { startDate: toISO(f), endDate: today }; }
        case "year": return { startDate: toISO(new Date(now.getFullYear(), 0, 1)), endDate: today };
        default: { const f = new Date(now); f.setDate(now.getDate() - 29); return { startDate: toISO(f), endDate: today }; }
    }
}

const Analytics = () => {
    const { reportType } = useParams();
    const navigate = useNavigate();
    const activeTab = reportType || "revenue";

    const [isGenerating, setIsGenerating] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>("month");
    const exportRef = useRef<HTMLDivElement>(null);

    // Close export dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setExportOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleGenerateReport = (filters: AnalyticsFilters) => {
        setIsGenerating(true);
        setTimeout(() => {
            setAppliedFilters(filters);
            setIsGenerating(false);
            setSidebarOpen(false);
        }, 800);
    };

    const handleResetFilters = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setAppliedFilters(null);
            setIsGenerating(false);
        }, 400);
    };

    const handleExport = (format: "csv" | "pdf") => {
        setExportOpen(false);
        const reportName = "Analytics Report";
        if (format === "csv") {
            exportToCSV([], `${reportName}`);
        } else {
            exportToPDF("report-content", reportName);
        }
    };

    const renderActiveReport = () => {
        if (isGenerating) {
            return (
                <div className="h-[500px] flex items-center justify-center flex-col gap-4">
                    <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Loading report…</p>
                </div>
            );
        }
        // Always pass date range from dropdown, merged with any sidebar filters
        const effectiveFilters: AnalyticsFilters = {
            gender: "all",
            location: "all",
            orderStatus: "all",
            ageRange: "all",
            products: {} as Record<string, boolean>,
            startDate: "",
            endDate: "",
            ...(appliedFilters ?? {}),
            ...getDateRangeForFilter(selectedDateFilter),
        };
        switch (activeTab) {
            case "revenue": return <RevenueReport filters={effectiveFilters} />;
            case "product": return <ProductPerformanceReport filters={effectiveFilters} />;
            case "demographic": return <CustomerDemographicReport filters={effectiveFilters} />;
            case "funnel": return <SalesFunnelReport filters={effectiveFilters} />;
            case "order_status": return <OrderStatusReport filters={effectiveFilters} />;
            case "payment": return <PaymentRefundReport filters={effectiveFilters} />;
            case "inventory": return <InventoryReport filters={effectiveFilters} />;
            case "banners": return <BannerAnalyticsDashboard banners={BANNERS_WITH_STATUS} />;
            default: return <RevenueReport filters={effectiveFilters} />;
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-2 h-full">

                {/* ── Cohesive Floating Sticky Header ── */}
                <div className="sticky top-14 z-40 pt-2 pb-1 bg-gradient-to-b from-background via-background/95 to-transparent -mx-1 px-1">
                    <div className="flex flex-col gap-2">
                        {/* Report Heading - Also Sticky because it's in this container */}
                        <div className="bg-card/90 backdrop-blur-xl border border-border shadow-glass rounded-2xl px-5 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    {activeTab === "revenue" ? "Revenue Report" :
                                        activeTab === "product" ? "Product Performance" :
                                            activeTab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + " Report"}
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-medium">Real-time performance overview</p>
                            </div>
                            <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold border border-primary/20">
                                LIVE
                            </div>
                        </div>

                        {/* Toolbar: Filters + Export */}
                        <div className="glass shadow-glass flex items-center gap-1 border border-border rounded-xl p-1 ring-1 ring-white/10">

                            {/* Date Filter Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {DATE_FILTERS.find(f => f.id === selectedDateFilter)?.label || "Select Date"}
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuLabel>Date Range</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {DATE_FILTERS.map((filter) => (
                                        <DropdownMenuCheckboxItem
                                            key={filter.id}
                                            checked={selectedDateFilter === filter.id}
                                            onCheckedChange={() => setSelectedDateFilter(filter.id)}
                                        >
                                            {filter.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

                            <button
                                onClick={() => setSidebarOpen(true)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
                                    appliedFilters ? "bg-primary/10 text-primary border-primary/20" : ""
                                )}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Filters
                            </button>

                            <div className="relative flex-shrink-0" ref={exportRef}>
                                <button
                                    onClick={() => setExportOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export
                                    <ChevronDown className={cn("w-3 h-3 transition-transform", exportOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {exportOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                            transition={{ duration: 0.12 }}
                                            className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-elevated overflow-hidden z-50 text-left"
                                        >
                                            <div className="px-3 py-2 border-b border-border">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Export Report</p>
                                            </div>
                                            <button onClick={() => handleExport("pdf")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                                                <FileText className="w-4 h-4 text-red-500" /> Export as PDF
                                            </button>
                                            <button onClick={() => handleExport("csv")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                                                <FileText className="w-4 h-4 text-green-600" /> Export as CSV
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Report Content ── */}
                <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${activeTab}-${selectedDateFilter}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                        >
                            {renderActiveReport()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Filter Sidebar Drawer ── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="fixed right-0 top-0 bottom-0 w-[310px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                                    <h2 className="text-sm font-bold text-foreground">Filter Report</h2>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <AnalyticsSidebar
                                    onGenerateReport={handleGenerateReport}
                                    onResetFilters={handleResetFilters}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default Analytics;
