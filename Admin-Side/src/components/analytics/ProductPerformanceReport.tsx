import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "../shared/GlassCard";
import { KPICard } from "./KPICard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Package, TrendingUp, TrendingDown, RotateCcw, Search, Filter, AlertCircle, Zap } from "lucide-react";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";
import { getAnalyticsProducts } from "@/lib/api";

const statusColor: Record<string, string> = {
    "In Stock": "#16a34a",
    "Low Stock": "#f59e0b",
    "Out of Stock": "#ef4444",
};

export function ProductPerformanceReport({ filters }: { filters: AnalyticsFilters | null }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stockFilter, setStockFilter] = useState<"All" | "In Stock" | "Low Stock" | "Out of Stock">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setData(null);
        getAnalyticsProducts(filters)
            .then(res => { if (mounted) { setData(res); setLoading(false); } })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [filters]);

    const processedProducts: any[] = data?.processedProducts ?? [];

    // compute filtered, sorted and paginated items
    const pagination = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const filtered = processedProducts.filter((p: any) => {
            const name = String(p.name ?? "").toLowerCase();
            const category = String(p.category ?? "").toLowerCase();
            const variantMatch = Array.isArray(p.variants) && p.variants.some((v: any) => String(v.variant_name ?? "").toLowerCase().includes(term) || String(v.sku ?? "").toLowerCase().includes(term));
            const matchesSearch = term === "" || name.includes(term) || category.includes(term) || variantMatch;

            const stock = Number(p.stock ?? 0);
            const matchesStock = stockFilter === "All" || (stockFilter === "In Stock" && stock > 10) || (stockFilter === "Low Stock" && stock > 0 && stock <= 10) || (stockFilter === "Out of Stock" && stock <= 0);

            return matchesSearch && matchesStock;
        });

        const sorted = [...filtered].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
        const totalItems = sorted.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        const page = Math.min(Math.max(1, currentPage), totalPages);
        const start = (page - 1) * itemsPerPage;
        const pageItems = sorted.slice(start, start + itemsPerPage);

        return { filtered, sorted, totalItems, totalPages, page, start, pageItems };
    }, [processedProducts, searchTerm, stockFilter, currentPage, itemsPerPage]);

    // ensure currentPage stays within bounds when data changes
    useEffect(() => {
        if (currentPage > pagination.totalPages) setCurrentPage(pagination.totalPages);
    }, [pagination.totalPages]);
    
    const topRevenueProduct = data?.topRevenueProduct ?? 
        (processedProducts.length > 0 ? [...processedProducts].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))[0] : null);
    const slowMovingProduct = data?.slowMovingProduct ?? 
        (processedProducts.length > 0 ? [...processedProducts].sort((a, b) => (a.unitsSold ?? 0) - (b.unitsSold ?? 0))[0] : null);
    const mostAddedToCartProduct = data?.mostAddedToCartProduct ?? 
        (processedProducts.length > 0 ? [...processedProducts].sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))[0] : null);
    
    const totalUnits: number = data?.totalUnits ?? processedProducts.reduce((sum, p) => sum + (p.unitsSold ?? 0), 0);
    const avgRefundRate: string | number = data?.avgRefundRate ?? "0";
    const topCategory: string = data?.topCategory ?? "—";
    const lowStockCount: number = data?.lowStockCount ?? 0;
    const barData: any[] = data?.barData ?? [];
    const pieData: any[] = data?.pieData ?? [];
    const monthlyData: any[] = data?.monthlyData ?? [];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 animate-pulse">
                <div className="text-muted-foreground text-sm font-medium">Loading product data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Product Performance</h2>
            </div>

            {/* Enhanced KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                  index={0}
                  title="Total Units Sold"
                  value={totalUnits.toLocaleString()}
                  icon={<Package className="w-5 h-5" />}
                  trend={{ value: 8, direction: "up" }}
                  color="blue"
                />
                <KPICard
                  index={1}
                  title="Top Revenue Product"
                  value={topRevenueProduct?.name?.slice(0, 15) ?? "—"}
                  subtitle={topRevenueProduct ? `₹${((topRevenueProduct.revenue ?? 0) / 1000).toFixed(1)}k` : undefined}
                  icon={<TrendingUp className="w-5 h-5" />}
                  trend={{ value: 15, direction: "up" }}
                  color="emerald"
                />
                <KPICard
                  index={2}
                  title="Low Stock Products"
                  value={lowStockCount.toString()}
                  icon={<AlertCircle className="w-5 h-5" />}
                  trend={{ value: 3, direction: "down" }}
                  color="amber"
                />
                <KPICard
                  index={3}
                  title="Avg Refund Rate"
                  value={`${avgRefundRate}`}
                  unit="%"
                  icon={<RotateCcw className="w-5 h-5" />}
                  trend={{ value: 2, direction: "down" }}
                  color="red"
                />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <KPICard
                  index={4}
                  title="Top Category"
                  value={topCategory}
                  icon={<Zap className="w-5 h-5" />}
                  color="purple"
                />
                <KPICard
                  index={5}
                  title="Slow Moving Product"
                  value={slowMovingProduct?.name?.slice(0, 18) ?? "—"}
                  subtitle={slowMovingProduct ? `${slowMovingProduct.unitsSold ?? 0} units` : undefined}
                  icon={<TrendingDown className="w-5 h-5" />}
                  color="pink"
                />
                <KPICard
                  index={6}
                  title="Most Trending Item"
                  value={mostAddedToCartProduct?.name?.slice(0, 18) ?? "—"}
                  subtitle={mostAddedToCartProduct ? `${mostAddedToCartProduct.unitsSold ?? 0} units` : undefined}
                  icon={<TrendingUp className="w-5 h-5" />}
                  trend={{ value: 22, direction: "up" }}
                  color="cyan"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Top 5 Products by Revenue</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" horizontal={false} />
                            <XAxis type="number" tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" tick={AXIS_STYLE} width={100} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Units Sold by Category</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                                {pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Monthly Growth Chart */}
            {monthlyData.length > 1 && (
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Product Revenue Growth</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="month" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[0] }} />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {/* Product Performance Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <SearchFilter
                        searchTerm={searchTerm}
                        setSearchTerm={(v) => { setSearchTerm(v); setCurrentPage(1); }}
                        filterValue={stockFilter}
                        setFilterValue={(v) => { setStockFilter(v as any); setCurrentPage(1); }}
                        filterOptions={[
                            { label: 'All Filters', value: 'All' },
                            { label: 'In Stock', value: 'In Stock' },
                            { label: 'Low Stock', value: 'Low Stock' },
                            { label: 'Out of Stock', value: 'Out of Stock' },
                        ]}
                        placeholder="Search products, SKUs, variants..."
                        className="w-full"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm font-medium text-muted-foreground border-b border-border/50">
                                <th className="pb-3 px-5">Product</th>
                                <th className="pb-3 px-5">Category</th>
                                <th className="pb-3 px-5">Units Sold</th>
                                <th className="pb-3 px-5">Revenue</th>
                                <th className="pb-3 px-5">Stock</th>
                                <th className="pb-3 px-5">Refund Rate</th>
                                <th className="pb-3 px-5">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground text-sm">
                                        No product data available for the selected period.
                                    </td>
                                </tr>
                            ) : (
                                pagination.pageItems.map((p: any, i: number) => (
                                    <tr key={p.id ?? pagination.start + i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-5 font-medium text-foreground">{p.name}</td>
                                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{p.category}</td>
                                        <td className="py-3.5 px-5 text-sm font-medium">{(p.unitsSold ?? 0).toLocaleString()}</td>
                                        <td className="py-3.5 px-5 text-sm font-semibold">₹{(p.revenue ?? 0).toLocaleString()}</td>
                                        <td className="py-3.5 px-5 text-sm">{p.stock ?? "—"}</td>
                                        <td className="py-3.5 px-5 text-sm text-right">
                                            <span className={`font-medium ${(p.refundRate ?? 0) > 5 ? "text-red-500" : "text-green-600"}`}>{p.refundRate ?? 0}%</span>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5"
                                                style={{ color: statusColor[p.status] ?? "#888", background: (statusColor[p.status] ?? "#888") + "18" }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor[p.status] ?? "#888" }}></span>
                                                {p.status ?? "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer pagination bar matching Products design */}
                <div className="px-5 py-4 border-t border-border/50 bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Showing {pagination.start + 1} to {Math.min(pagination.start + itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground"
                            >Previous</button>
                            <span className="text-xs font-medium text-foreground">Page {pagination.page} of {pagination.totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground"
                            >Next</button>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
