import { GlassCard } from "../shared/GlassCard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
    Package, TrendingUp, AlertTriangle, TrendingDown, RotateCcw, Download
} from "lucide-react";
import { mockProducts, mockOrders } from "@/data/mockData";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";

export function ProductPerformanceReport({ filters }: { filters: AnalyticsFilters | null }) {
    const filteredOrders = mockOrders.filter(order => {
        if (!filters) return true;
        if (filters.startDate && order.date < filters.startDate) return false;
        if (filters.endDate && order.date > filters.endDate) return false;
        if (filters.gender !== "all" && order.customerDemographics.gender.toLowerCase() !== filters.gender) return false;
        if (filters.location !== "all" && order.customerDemographics.location.toLowerCase() !== filters.location) return false;
        if (filters.orderStatus !== "all" && order.status.toLowerCase() !== filters.orderStatus) return false;
        return true;
    });

    const activeProductIds = filters
        ? Object.entries(filters.products).filter(([, v]) => v).map(([k]) => Number(k))
        : [];

    const productStats: Record<number, { unitsSold: number; revenue: number; refunds: number }> = {};
    filteredOrders.forEach(order => {
        const isRefund = order.payment === "Refunded";
        order.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId)) {
                if (!productStats[item.productId]) productStats[item.productId] = { unitsSold: 0, revenue: 0, refunds: 0 };
                productStats[item.productId].unitsSold += item.quantity;
                productStats[item.productId].revenue += item.quantity * item.price;
                if (isRefund) productStats[item.productId].refunds += 1;
            }
        });
    });

    const processedProducts = mockProducts
        .filter(p => activeProductIds.length === 0 || activeProductIds.includes(p.id))
        .map(p => {
            const s = productStats[p.id] || { unitsSold: 0, revenue: 0, refunds: 0 };
            const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
            const totalOrders = filteredOrders.filter(o => o.items.some(i => i.productId === p.id)).length;
            const refundRate = totalOrders > 0 ? ((s.refunds / totalOrders) * 100).toFixed(1) : "0";
            return {
                id: p.id, name: p.name, category: p.category,
                unitsSold: s.unitsSold, revenue: s.revenue, stock: totalStock,
                refundRate: parseFloat(refundRate),
                status: totalStock === 0 ? "Out of Stock" : totalStock < 50 ? "Low Stock" : "In Stock",
            };
        })
        .sort((a, b) => b.revenue - a.revenue);

    const topRevenueProduct = processedProducts[0];
    const slowMovingProduct = [...processedProducts].sort((a, b) => a.unitsSold - b.unitsSold)[0];
    const totalUnits = processedProducts.reduce((s, p) => s + p.unitsSold, 0);
    const lowStockCount = processedProducts.filter(p => p.status === "Low Stock" || p.status === "Out of Stock").length;
    const avgRefundRate = processedProducts.length > 0
        ? (processedProducts.reduce((s, p) => s + p.refundRate, 0) / processedProducts.length).toFixed(1)
        : "0";
    const topCategory = (() => {
        const catMap: Record<string, number> = {};
        processedProducts.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.unitsSold; });
        return Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    })();

    const top5 = processedProducts.slice(0, 5);
    const barData = top5.map(p => ({ name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name, revenue: p.revenue, units: p.unitsSold }));

    // Category distribution
    const categoryMap: Record<string, number> = {};
    processedProducts.forEach(p => { categoryMap[p.category] = (categoryMap[p.category] || 0) + p.unitsSold; });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Monthly growth — synthesise from order dates
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevMap: Record<string, number> = {};
    filteredOrders.forEach(order => {
        const m = months[new Date(order.date).getMonth()];
        order.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId)) {
                monthlyRevMap[m] = (monthlyRevMap[m] || 0) + item.quantity * item.price;
            }
        });
    });
    const monthlyData = months.filter(m => monthlyRevMap[m]).map(m => ({ month: m, revenue: monthlyRevMap[m] }));

    const statusColor: Record<string, string> = { "In Stock": "#16a34a", "Low Stock": "#f59e0b", "Out of Stock": "#ef4444" };

    return (
        <div className="space-y-5 py-1">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Product Performance</h2>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Top Revenue Product", value: topRevenueProduct?.name ?? "—", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Slow Moving Product", value: slowMovingProduct?.name ?? "—", icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Total Units Sold", value: totalUnits.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Avg Refund Rate", value: `${avgRefundRate}%`, icon: RotateCcw, color: "text-red-500", bg: "bg-red-50" },
                ].map(kpi => (
                    <GlassCard key={kpi.label} className="p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="text-sm font-bold text-foreground leading-tight">{kpi.value}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Top Category</p>
                    <p className="text-xl font-bold text-foreground">{topCategory}</p>
                </GlassCard>
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Low / Out of Stock</p>
                    <p className="text-xl font-bold text-foreground">{lowStockCount} <span className="text-sm font-normal text-muted-foreground">products</span></p>
                </GlassCard>
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Top Product Revenue</p>
                    <p className="text-xl font-bold text-foreground">₹{topRevenueProduct ? (topRevenueProduct.revenue / 1000).toFixed(1) + "k" : "—"}</p>
                </GlassCard>
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
                                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
                    <h3 className="text-sm font-semibold text-foreground">Product Performance Table</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Units Sold</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Refund Rate</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedProducts.map((p, i) => (
                                <tr key={p.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                                    <td className="px-4 py-3 text-right font-medium">{p.unitsSold.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-semibold">₹{p.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">{p.stock}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-medium ${p.refundRate > 5 ? "text-red-500" : "text-green-600"}`}>{p.refundRate}%</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ color: statusColor[p.status], background: statusColor[p.status] + "18" }}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
