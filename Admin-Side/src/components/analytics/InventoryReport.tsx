import { useState, useEffect } from "react";
import { GlassCard } from "../shared/GlassCard";
import { KPICard } from "./KPICard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Package, AlertTriangle, Archive, Clock, ShoppingCart, BarChart3, TrendingDown } from "lucide-react";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";
import { getAnalyticsInventory } from "@/lib/api";

const statusColor: Record<string, string> = {
    "In Stock": "#16a34a",
    "Low Stock": "#f59e0b",
    "Critical": "#f97316",
    "Out of Stock": "#ef4444",
};

export function InventoryReport({ filters }: { filters: AnalyticsFilters | null }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setData(null);
        getAnalyticsInventory(filters)
            .then(res => { if (mounted) { setData(res); setLoading(false); } })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [filters]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 animate-pulse">
                <div className="text-muted-foreground text-sm font-medium">Loading inventory data...</div>
            </div>
        );
    }

    const totalStock: number = data?.totalStock ?? 0;
    const outOfStock: number = data?.outOfStock ?? 0;
    const expirySoon: number = data?.expirySoon ?? 0;
    const reorderNeeded: number = data?.reorderNeeded ?? 0;
    const stockStatusData: any[] = data?.stockStatusData ?? [];
    const stockVsSold: any[] = data?.stockVsSold ?? [];
    const movementData: any[] = data?.movementData ?? [];
    const inventoryItems: any[] = data?.inventoryItems ?? [];
    const reorderItems: any[] = data?.reorderItems ?? inventoryItems.filter((p: any) => p.needsReorder);

    // Pagination logic
    const totalPages = Math.ceil(inventoryItems.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = inventoryItems.slice(startIdx, startIdx + itemsPerPage);

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Inventory Report</h2>
            </div>

            {/* Enhanced KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                  index={0}
                  title="Total Stock Units"
                  value={totalStock.toLocaleString()}
                  icon={<Archive className="w-5 h-5" />}
                  trend={{ value: 5, direction: "up" }}
                  color="blue"
                />
                <KPICard
                  index={1}
                  title="Out of Stock"
                  value={outOfStock.toString()}
                  icon={<Package className="w-5 h-5" />}
                  trend={{ value: 2, direction: "down" }}
                  color="red"
                />
                <KPICard
                  index={2}
                  title="Expiry Soon"
                  value={expirySoon.toString()}
                  icon={<Clock className="w-5 h-5" />}
                  trend={{ value: 1, direction: "down" }}
                  color="amber"
                />
                <KPICard
                  index={3}
                  title="Reorder Needed"
                  value={reorderNeeded.toString()}
                  icon={<ShoppingCart className="w-5 h-5" />}
                  trend={{ value: 8, direction: "up" }}
                  color="purple"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Stock Health Overview</h3>
                    {stockStatusData.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={stockStatusData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {stockStatusData.map((d: any, i: number) => <Cell key={i} fill={d.fill ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Stock vs. Sold (Top 8)</h3>
                    {stockVsSold.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stockVsSold} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} />
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="stock" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Stock" />
                                <Bar dataKey="sold" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Sold" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>
            </div>

            {/* Stock Movement Chart */}
            {movementData.length > 1 && (
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Stock Movement</h3>
                    <ResponsiveContainer width="100%" height={190}>
                        <LineChart data={movementData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="month" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v + " units", "Units Moved"]} />
                            <Line type="monotone" dataKey="units" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[2] }} name="Units Moved" />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {/* Reorder Suggestions */}
            {reorderItems.length > 0 && (
                <GlassCard className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-foreground">Reorder Suggestions</h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reorderItems.map((p: any, i: number) => (
                            <div key={p.id ?? i} className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                                <ShoppingCart className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                                    <p className="text-xs text-amber-700">Stock: {p.stock ?? 0} units · {p.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Inventory Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Inventory Details</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, inventoryItems.length)} of {inventoryItems.length} items</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Sold</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Expiry Risk</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Reorder</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                        No inventory data available for the selected period.
                                    </td>
                                </tr>
                            ) : paginatedItems.map((p: any, i: number) => (
                                <tr key={p.id ?? i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"} style={{borderBottom: "1px solid hsl(var(--border))"}}>
                                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{p.stock ?? 0}</td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">{p.sold ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                                            style={{ color: statusColor[p.status] ?? "#888", background: (statusColor[p.status] ?? "#888") + "1a" }}>
                                            {p.status ?? "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {p.expirySoon
                                            ? <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">Expiring Soon</span>
                                            : <span className="text-muted-foreground text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {p.needsReorder
                                            ? <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">Needed</span>
                                            : <span className="text-muted-foreground text-xs">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Previous
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                                if (pageNum > totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                            pageNum === currentPage
                                                ? 'bg-primary text-primary-foreground'
                                                : 'border border-border text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
