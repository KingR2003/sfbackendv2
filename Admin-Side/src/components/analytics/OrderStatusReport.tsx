import { GlassCard } from "../shared/GlassCard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Package, Truck, CheckCircle, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { mockOrders } from "@/data/mockData";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";

const STATUS_COLORS: Record<string, string> = {
    CREATED: "#94a3b8",
    PAID: "#3b82f6",
    PROCESSING: "#f59e0b",
    OUT_FOR_DELIVERY: "#8b5cf6",
    DELIVERED: "#16a34a",
    CANCELLED: "#ef4444",
    RETURN_REQUESTED: "#f97316",
    RETURNED: "#ec4899",
};

export function OrderStatusReport({ filters }: { filters: AnalyticsFilters | null }) {
    const filteredOrders = mockOrders.filter(order => {
        if (!filters) return true;
        if (filters.startDate && order.date < filters.startDate) return false;
        if (filters.endDate && order.date > filters.endDate) return false;
        if (filters.gender !== "all" && order.customerDemographics.gender.toLowerCase() !== filters.gender) return false;
        if (filters.location !== "all" && order.customerDemographics.location.toLowerCase() !== filters.location) return false;
        if (filters.orderStatus !== "all" && order.status.toLowerCase() !== filters.orderStatus) return false;
        return true;
    });

    const total = filteredOrders.length;
    const delivered = filteredOrders.filter(o => o.status === "DELIVERED").length;
    const cancelled = filteredOrders.filter(o => o.status === "CANCELLED").length;
    // Simulate returns (not a real status in mock — derive from refunded orders)
    const returnInProgress = filteredOrders.filter(o => o.payment === "Refunded" && o.status !== "CANCELLED").length;
    const returned = Math.round(returnInProgress * 0.6); // simulated subset

    const deliveredPct = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0";
    const cancelledPct = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0";

    const statusMap: Record<string, number> = {};
    filteredOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const statusData = Object.entries(statusMap)
        .map(([status, count]) => ({ status, count, pct: total > 0 ? ((count / total) * 100).toFixed(1) : "0", color: STATUS_COLORS[status] || "#ccc" }))
        .sort((a, b) => b.count - a.count);
    const pieData = statusData.map(s => ({ name: s.status.replace(/_/g, " "), value: s.count, fill: s.color }));

    // Monthly cancellation trend
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyCancel: Record<string, number> = {};
    const monthlyTotal: Record<string, number> = {};
    filteredOrders.forEach(o => {
        const m = months[new Date(o.date).getMonth()];
        monthlyTotal[m] = (monthlyTotal[m] || 0) + 1;
        if (o.status === "CANCELLED") monthlyCancel[m] = (monthlyCancel[m] || 0) + 1;
    });
    const cancellationTrend = months
        .filter(m => monthlyTotal[m])
        .map(m => ({
            month: m,
            cancelled: monthlyCancel[m] || 0,
            rate: monthlyTotal[m] ? (((monthlyCancel[m] || 0) / monthlyTotal[m]) * 100).toFixed(1) : "0",
        }));

    // Monthly status stacked
    const monthlyStatusMap: Record<string, Record<string, number>> = {};
    filteredOrders.forEach(o => {
        const m = months[new Date(o.date).getMonth()];
        if (!monthlyStatusMap[m]) monthlyStatusMap[m] = {};
        monthlyStatusMap[m][o.status] = (monthlyStatusMap[m][o.status] || 0) + 1;
    });
    const stackedData = months
        .filter(m => monthlyStatusMap[m])
        .map(m => ({ month: m, ...monthlyStatusMap[m] }));
    const statusKeys = Object.keys(statusMap);

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Order Status Report</h2>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Orders", value: total.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Delivered", value: delivered.toLocaleString(), icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Cancelled", value: `${cancelledPct}%`, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
                    { label: "Delivered Rate", value: `${deliveredPct}%`, icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50" },
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

            {/* Returns KPIs */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Return in Progress</p>
                    <p className="text-xl font-bold text-orange-500">{returnInProgress}</p>
                </GlassCard>
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Returned</p>
                    <p className="text-xl font-bold text-pink-500">{returned}</p>
                </GlassCard>
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Cancelled Orders</p>
                    <p className="text-xl font-bold text-red-500">{cancelled}</p>
                </GlassCard>
            </div>

            {/* Status Pie + Stacked Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Order Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stackedData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="month" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            {statusKeys.map((key, i) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={STATUS_COLORS[key] || "#ccc"} name={key.replace(/_/g, " ")} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Cancellation Trend */}
            {cancellationTrend.length > 1 && (
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Cancellation Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={cancellationTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="month" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n, p) => [
                                n === "cancelled" ? v + " orders" : v + "%", n === "cancelled" ? "Cancelled" : "Rate"
                            ]} />
                            <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cancelled Orders" />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {/* Distribution Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Status Distribution</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Count</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Percentage</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statusData.map((s, i) => (
                                <tr key={s.status} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                            <span className="font-medium text-foreground">{s.status.replace(/_/g, " ")}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">{s.count}</td>
                                    <td className="px-4 py-3 text-right font-medium">{s.pct}%</td>
                                    <td className="px-4 py-3">
                                        <div className="h-2 bg-muted/40 rounded-full overflow-hidden w-full max-w-[140px]">
                                            <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                                        </div>
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
