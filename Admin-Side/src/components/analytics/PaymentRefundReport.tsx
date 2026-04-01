import { GlassCard } from "../shared/GlassCard";
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { CreditCard, RefreshCcw, AlertCircle, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { mockOrders } from "@/data/mockData";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";

export function PaymentRefundReport({ filters }: { filters: AnalyticsFilters | null }) {
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
    const paidOrders = filteredOrders.filter(o => o.payment === "Paid");
    const refundedOrders = filteredOrders.filter(o => o.payment === "Refunded");
    const pendingOrders = filteredOrders.filter(o => o.payment === "Pending");
    const failedOrders = filteredOrders.filter(o => o.payment === "Failed");

    const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
    const refundedAmount = refundedOrders.reduce((s, o) => s + o.totalAmount, 0);
    const refundRate = total > 0 ? ((refundedOrders.length / total) * 100).toFixed(1) : "0";
    const failedPct = total > 0 ? ((failedOrders.length / total) * 100).toFixed(1) : "0";

    // Payment method breakdown
    const methodMap: Record<string, { count: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
        if (order.payment === "Paid") {
            if (!methodMap[order.paymentMethod]) methodMap[order.paymentMethod] = { count: 0, revenue: 0 };
            methodMap[order.paymentMethod].count += 1;
            methodMap[order.paymentMethod].revenue += order.totalAmount;
        }
    });
    const methodData = Object.entries(methodMap)
        .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }))
        .sort((a, b) => b.revenue - a.revenue);
    const paymentPieData = methodData.map(m => ({ name: m.name, value: m.count }));

    // Payment status summary
    const paymentStatusData = [
        { name: "Paid", count: paidOrders.length, fill: "#16a34a" },
        { name: "Pending", count: pendingOrders.length, fill: "#f59e0b" },
        { name: "Refunded", count: refundedOrders.length, fill: "#8b5cf6" },
        { name: "Failed", count: failedOrders.length, fill: "#ef4444" },
    ];

    // Monthly refund trend
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRefundMap: Record<string, { refunds: number; amount: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
        const m = months[new Date(o.date).getMonth()];
        if (!monthlyRefundMap[m]) monthlyRefundMap[m] = { refunds: 0, amount: 0, revenue: 0 };
        if (o.payment === "Refunded") {
            monthlyRefundMap[m].refunds += 1;
            monthlyRefundMap[m].amount += o.totalAmount;
        }
        if (o.payment === "Paid") monthlyRefundMap[m].revenue += o.totalAmount;
    });
    const refundTrend = months.filter(m => monthlyRefundMap[m]).map(m => ({
        month: m,
        refunds: monthlyRefundMap[m].refunds,
        amount: monthlyRefundMap[m].amount,
        revenue: monthlyRefundMap[m].revenue,
    }));

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Payment & Refund Report</h2>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: `₹${(totalRevenue / 1000).toFixed(1)}k`, icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Total Refund Amount", value: `₹${(refundedAmount / 1000).toFixed(1)}k`, icon: RefreshCcw, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Refund Rate", value: `${refundRate}%`, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
                    { label: "Failed Transactions", value: `${failedPct}%`, icon: XCircle, color: "text-amber-600", bg: "bg-amber-50" },
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

            {/* Secondary KPIs */}
            <div className="grid grid-cols-4 gap-4">
                {paymentStatusData.map(s => (
                    <GlassCard key={s.name} className="p-4 text-center">
                        <p className="text-sm font-bold text-foreground text-2xl mb-0.5" style={{ color: s.fill }}>{s.count}</p>
                        <p className="text-xs text-muted-foreground">{s.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">{total > 0 ? ((s.count / total) * 100).toFixed(1) : 0}%</p>
                    </GlassCard>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Payment Method Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={paymentPieData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                {paymentPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Payment Method</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={methodData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="name" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                {methodData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Refund Trend */}
            {refundTrend.length > 1 && (
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Refund Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={refundTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="month" tick={AXIS_STYLE} />
                            <YAxis yAxisId="left" tick={AXIS_STYLE} />
                            <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                            <Line yAxisId="left" type="monotone" dataKey="refunds" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Refunds (#)" />
                            <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Refund Amount (₹)" strokeDasharray="4 3" />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {/* Payment Details Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Payment Method Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Payment Method</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Transactions</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Share of Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {methodData.map((m, i) => (
                                <tr key={m.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                                    <td className="px-4 py-3 text-right">{m.count}</td>
                                    <td className="px-4 py-3 text-right font-semibold">₹{m.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${totalRevenue > 0 ? (m.revenue / totalRevenue) * 100 : 0}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-10 text-right">
                                                {totalRevenue > 0 ? ((m.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                                            </span>
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
