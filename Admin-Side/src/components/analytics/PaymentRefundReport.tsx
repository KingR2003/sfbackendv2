import { useState, useEffect } from "react";
import { GlassCard } from "../shared/GlassCard";
import { KPICard } from "./KPICard";
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { CreditCard, RefreshCcw, AlertCircle, XCircle, Wallet, TrendingDown } from "lucide-react";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";
import { getAnalyticsPaymentRefund } from "@/lib/api";

export function PaymentRefundReport({ filters }: { filters: AnalyticsFilters | null }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setData(null);
        getAnalyticsPaymentRefund(filters)
            .then(res => { if (mounted) { setData(res); setLoading(false); } })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [filters]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 animate-pulse">
                <div className="text-muted-foreground text-sm font-medium">Loading payment data...</div>
            </div>
        );
    }

    const totalRevenue: number = data?.totalRevenue ?? 0;
    const refundedAmount: number = data?.refundedAmount ?? 0;
    const refundRate: string | number = data?.refundRate ?? "0";
    const failedPct: string | number = data?.failedPct ?? "0";
    const paymentStatusData: any[] = data?.paymentStatusData ?? [];
    const methodData: any[] = data?.methodData ?? [];
    const paymentPieData: any[] = data?.paymentPieData ?? methodData.map((m: any) => ({ name: m.name, value: m.count ?? 0 }));
    const refundTrend: any[] = data?.refundTrend ?? [];
    const total: number = data?.total ?? paymentStatusData.reduce((s: number, d: any) => s + (d.count ?? 0), 0);

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Payment & Refund Report</h2>
            </div>

            {/* Enhanced KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                  index={0}
                  title="Total Revenue"
                  value={`₹${(totalRevenue / 1000).toFixed(1)}k`}
                  icon={<Wallet className="w-5 h-5" />}
                  trend={{ value: 10, direction: "up" }}
                  color="emerald"
                />
                <KPICard
                  index={1}
                  title="Refund Amount"
                  value={`₹${(refundedAmount / 1000).toFixed(1)}k`}
                  icon={<RefreshCcw className="w-5 h-5" />}
                  trend={{ value: 3, direction: "down" }}
                  color="blue"
                />
                <KPICard
                  index={2}
                  title="Refund Rate"
                  value={`${refundRate}`}
                  unit="%"
                  icon={<AlertCircle className="w-5 h-5" />}
                  trend={{ value: 2, direction: "up" }}
                  color="amber"
                />
                <KPICard
                  index={3}
                  title="Failed Transactions"
                  value={`${failedPct}`}
                  unit="%"
                  icon={<XCircle className="w-5 h-5" />}
                  trend={{ value: 1, direction: "down" }}
                  color="red"
                />
            </div>

            {/* Payment Status Summary */}
            {paymentStatusData.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {paymentStatusData.map((s: any) => (
                        <GlassCard key={s.name} className="p-4 text-center">
                            <p className="text-2xl font-bold mb-0.5" style={{ color: s.fill }}>{s.count ?? 0}</p>
                            <p className="text-xs text-muted-foreground">{s.name}</p>
                            <p className="text-xs font-medium text-muted-foreground">
                                {total > 0 ? (((s.count ?? 0) / total) * 100).toFixed(1) : 0}%
                            </p>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Payment Method Distribution</h3>
                    {paymentPieData.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={paymentPieData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {paymentPieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Payment Method</h3>
                    {methodData.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={methodData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {methodData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
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
                            {methodData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                        No payment data available for the selected period.
                                    </td>
                                </tr>
                            ) : methodData.map((m: any, i: number) => (
                                <tr key={m.name ?? i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                                    <td className="px-4 py-3 text-right">{m.count ?? 0}</td>
                                    <td className="px-4 py-3 text-right font-semibold">₹{(m.revenue ?? 0).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full"
                                                    style={{ width: `${totalRevenue > 0 ? ((m.revenue ?? 0) / totalRevenue) * 100 : 0}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-10 text-right">
                                                {totalRevenue > 0 ? (((m.revenue ?? 0) / totalRevenue) * 100).toFixed(1) : 0}%
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
