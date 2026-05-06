import { useState, useEffect } from "react";
import { GlassCard } from "../shared/GlassCard";
import { KPICard } from "./KPICard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Package, Truck, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";
import { getAnalyticsOrderStatus } from "@/lib/api";

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
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setData(null);
        getAnalyticsOrderStatus(filters)
            .then(res => { if (mounted) { setData(res); setLoading(false); } })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [filters]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 animate-pulse">
                <div className="text-muted-foreground text-sm font-medium">Loading order status data...</div>
            </div>
        );
    }

    const total: number = data?.total ?? 0;
    const delivered: number = data?.delivered ?? 0;
    const cancelled: number = data?.cancelled ?? 0;
    const returnInProgress: number = data?.returnInProgress ?? 0;
    const returned: number = data?.returned ?? 0;
    const deliveredPct: string | number = data?.deliveredPct ?? "0";
    const cancelledPct: string | number = data?.cancelledPct ?? "0";
    const statusData: any[] = data?.statusData ?? [];
    const pieData: any[] = data?.pieData ?? [];
    const cancellationTrend: any[] = data?.cancellationTrend ?? [];
    const stackedData: any[] = data?.stackedData ?? [];
    const statusKeys: string[] = data?.statusKeys ?? [];

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Order Status Report</h2>
            </div>

            {/* Enhanced KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                  index={0}
                  title="Total Orders"
                  value={total.toLocaleString()}
                  icon={<Package className="w-5 h-5" />}
                  trend={{ value: 12, direction: "up" }}
                  color="blue"
                />
                <KPICard
                  index={1}
                  title="Delivered Orders"
                  value={delivered.toLocaleString()}
                  icon={<CheckCircle className="w-5 h-5" />}
                  trend={{ value: 8, direction: "up" }}
                  color="emerald"
                />
                <KPICard
                  index={2}
                  title="Cancelled Orders"
                  value={cancelled.toLocaleString()}
                  icon={<XCircle className="w-5 h-5" />}
                  trend={{ value: 3, direction: "down" }}
                  color="red"
                />
                <KPICard
                  index={3}
                  title="In Transit"
                  value={returnInProgress.toLocaleString()}
                  icon={<Truck className="w-5 h-5" />}
                  trend={{ value: 5, direction: "up" }}
                  color="amber"
                />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <KPICard
                  index={4}
                  title="Delivery Rate"
                  value={`${deliveredPct}`}
                  unit="%"
                  icon={<Truck className="w-5 h-5" />}
                  trend={{ value: 4, direction: "up" }}
                  color="blue"
                />
                <KPICard
                  index={5}
                  title="Cancellation Rate"
                  value={`${cancelledPct}`}
                  unit="%"
                  icon={<XCircle className="w-5 h-5" />}
                  trend={{ value: 1, direction: "down" }}
                  color="pink"
                />
                <KPICard
                  index={6}
                  title="Return Requests"
                  value={returned.toLocaleString()}
                  icon={<RotateCcw className="w-5 h-5" />}
                  trend={{ value: 2, direction: "up" }}
                  color="purple"
                />
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
                                {pieData.map((d: any, i: number) => <Cell key={i} fill={d.fill ?? STATUS_COLORS[d.name?.replace(/ /g, "_")] ?? "#ccc"} />)}
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
                            {statusKeys.map((key: string) => (
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
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [
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
                            {statusData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                        No order status data available for the selected period.
                                    </td>
                                </tr>
                            ) : statusData.map((s: any, i: number) => (
                                <tr key={s.status ?? i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color ?? STATUS_COLORS[s.status] ?? "#ccc" }} />
                                            <span className="font-medium text-foreground">{(s.status ?? "").replace(/_/g, " ")}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">{s.count ?? 0}</td>
                                    <td className="px-4 py-3 text-right font-medium">{s.pct ?? 0}%</td>
                                    <td className="px-4 py-3">
                                        <div className="h-2 bg-muted/40 rounded-full overflow-hidden w-full max-w-[140px]">
                                            <div className="h-full rounded-full" style={{ width: `${s.pct ?? 0}%`, background: s.color ?? STATUS_COLORS[s.status] ?? "#ccc" }} />
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
