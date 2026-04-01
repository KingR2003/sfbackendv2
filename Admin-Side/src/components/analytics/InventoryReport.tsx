import { GlassCard } from "../shared/GlassCard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Package, AlertTriangle, Archive, TrendingDown, Clock, ShoppingCart } from "lucide-react";
import { mockProducts, mockOrders } from "@/data/mockData";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";

export function InventoryReport({ filters }: { filters: AnalyticsFilters | null }) {
    const filteredOrders = mockOrders.filter(order => {
        if (!filters) return true;
        if (filters.startDate && order.date < filters.startDate) return false;
        if (filters.endDate && order.date > filters.endDate) return false;
        if (filters.gender !== "all" && order.customerDemographics.gender.toLowerCase() !== filters.gender) return false;
        if (filters.location !== "all" && order.customerDemographics.location.toLowerCase() !== filters.location) return false;
        return true;
    });

    const activeProductIds = filters
        ? Object.entries(filters.products).filter(([, v]) => v).map(([k]) => Number(k))
        : [];

    // Compute sold units per product
    const soldMap: Record<number, number> = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId)) {
                soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
            }
        });
    });

    const inventoryItems = mockProducts
        .filter(p => activeProductIds.length === 0 || activeProductIds.includes(p.id))
        .map(p => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock_quantity, 0);
            const sold = soldMap[p.id] || 0;
            const reorderLevel = 50;
            const needsReorder = totalStock < reorderLevel && totalStock > 0;
            const outOfStock = totalStock === 0;
            // Simulate expiry — products with low stock considered expiry risk
            const expirySoon = totalStock > 0 && totalStock < 30;
            return {
                id: p.id, name: p.name, category: p.category,
                stock: totalStock, sold,
                status: outOfStock ? "Out of Stock" : totalStock < 30 ? "Critical" : totalStock < reorderLevel ? "Low Stock" : "In Stock",
                needsReorder: outOfStock || needsReorder,
                expirySoon,
            };
        })
        .sort((a, b) => a.stock - b.stock);

    const totalStock = inventoryItems.reduce((s, p) => s + p.stock, 0);
    const outOfStock = inventoryItems.filter(p => p.status === "Out of Stock").length;
    const expirySoon = inventoryItems.filter(p => p.expirySoon).length;
    const reorderNeeded = inventoryItems.filter(p => p.needsReorder).length;
    const inStock = inventoryItems.filter(p => p.status === "In Stock").length;

    // Status pie
    const stockStatusData = [
        { name: "In Stock", value: inStock, fill: "#16a34a" },
        { name: "Low Stock", value: inventoryItems.filter(p => p.status === "Low Stock").length, fill: "#f59e0b" },
        { name: "Critical", value: inventoryItems.filter(p => p.status === "Critical").length, fill: "#f97316" },
        { name: "Out of Stock", value: outOfStock, fill: "#ef4444" },
    ].filter(s => s.value > 0);

    // Stock vs sold bar (top 8 products)
    const stockVsSold = inventoryItems.slice(0, 8).map(p => ({
        name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        stock: p.stock, sold: p.sold,
    }));

    // Monthly stock movement (simulated from orders)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMovement: Record<string, number> = {};
    filteredOrders.forEach(o => {
        const m = months[new Date(o.date).getMonth()];
        o.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId)) {
                monthlyMovement[m] = (monthlyMovement[m] || 0) + item.quantity;
            }
        });
    });
    const movementData = months.filter(m => monthlyMovement[m]).map(m => ({ month: m, units: monthlyMovement[m] }));

    const statusColor: Record<string, string> = {
        "In Stock": "#16a34a", "Low Stock": "#f59e0b", "Critical": "#f97316", "Out of Stock": "#ef4444",
    };

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Inventory Report</h2>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Stock Units", value: totalStock.toLocaleString(), icon: Archive, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Out of Stock", value: outOfStock.toString(), icon: Package, color: "text-red-500", bg: "bg-red-50" },
                    { label: "Expiry Soon", value: expirySoon.toString(), icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
                    { label: "Reorder Needed", value: reorderNeeded.toString(), icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50" },
                ].map(kpi => (
                    <GlassCard key={kpi.label} className="p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="text-base font-bold text-foreground">{kpi.value}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Stock Health Overview</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={stockStatusData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                {stockStatusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Stock vs. Sold (Top 8)</h3>
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
            {reorderNeeded > 0 && (
                <GlassCard className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-foreground">Reorder Suggestions</h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {inventoryItems.filter(p => p.needsReorder).map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                                <ShoppingCart className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                                    <p className="text-xs text-amber-700">Stock: {p.stock} units · {p.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Inventory Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Inventory Details</h3>
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
                            {inventoryItems.map((p, i) => (
                                <tr key={p.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{p.stock}</td>
                                    <td className="px-4 py-3 text-right">{p.sold}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: statusColor[p.status], background: statusColor[p.status] + "18" }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {p.expirySoon
                                            ? <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">Yes</span>
                                            : <span className="text-muted-foreground text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {p.needsReorder
                                            ? <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">Reorder</span>
                                            : <span className="text-muted-foreground text-xs">—</span>}
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
