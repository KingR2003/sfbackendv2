import { GlassCard } from "../shared/GlassCard";
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import { ShoppingCart, CreditCard, CheckCircle2, Package, TrendingDown } from "lucide-react";
import { mockOrders } from "@/data/mockData";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";

export function SalesFunnelReport({ filters }: { filters: AnalyticsFilters | null }) {
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

    // Funnel stages — derived from order data
    const visitors = Math.round(total * 7.4);   // simulated from orders
    const addToCart = Math.round(total * 3.8);
    const checkoutStarted = Math.round(total * 2.1);
    const paymentCompleted = filteredOrders.filter(o => o.payment === "Paid").length;
    const delivered = filteredOrders.filter(o => o.status === "DELIVERED").length;

    const funnelStages = [
        { stage: "Visitors", count: visitors, icon: Package, color: CHART_COLORS[1] },
        { stage: "Add to Cart", count: addToCart, icon: ShoppingCart, color: CHART_COLORS[2] },
        { stage: "Checkout Started", count: checkoutStarted, icon: CreditCard, color: CHART_COLORS[3] },
        { stage: "Payment Completed", count: paymentCompleted, icon: CheckCircle2, color: CHART_COLORS[0] },
        { stage: "Delivered", count: delivered, icon: CheckCircle2, color: CHART_COLORS[0] },
    ];

    // Drop-off between stages
    const stagesWithDropoff = funnelStages.map((s, i) => {
        const prev = i === 0 ? s.count : funnelStages[i - 1].count;
        const dropoffPct = prev > 0 ? (((prev - s.count) / prev) * 100).toFixed(1) : "0";
        const conversionRate = visitors > 0 ? ((s.count / visitors) * 100).toFixed(1) : "0";
        return { ...s, dropoffPct: i === 0 ? null : parseFloat(dropoffPct), pct: parseFloat(conversionRate), prev };
    });

    const overallConversion = visitors > 0 ? ((paymentCompleted / visitors) * 100).toFixed(2) : "0";
    const cartAbandonment = addToCart > 0 ? (((addToCart - checkoutStarted) / addToCart) * 100).toFixed(1) : "0";

    const barData = stagesWithDropoff.map(s => ({ stage: s.stage, count: s.count }));

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Sales Funnel</h2>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Visitors", value: visitors.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Add to Cart", value: addToCart.toLocaleString(), icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Payment Completed", value: paymentCompleted.toLocaleString(), icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Overall Conversion", value: `${overallConversion}%`, icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50" },
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
            <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Checkout Started</p>
                    <p className="text-xl font-bold text-foreground">{checkoutStarted.toLocaleString()}</p>
                </GlassCard>
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Cart Abandonment</p>
                    <p className="text-xl font-bold text-red-500">{cartAbandonment}%</p>
                </GlassCard>
                <GlassCard className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Delivered</p>
                    <p className="text-xl font-bold text-green-600">{delivered.toLocaleString()}</p>
                </GlassCard>
            </div>

            {/* Funnel Chart */}
            <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Funnel — Count by Stage</h3>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                        <XAxis dataKey="stage" tick={{ ...AXIS_STYLE, fontSize: 11 }} />
                        <YAxis tick={AXIS_STYLE} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                            {barData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>

            {/* Stage Rates with Drop-off */}
            <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Stage Analysis with Drop-off</h3>
                <div className="space-y-3">
                    {stagesWithDropoff.map((s, i) => (
                        <div key={s.stage} className="flex items-center gap-4">
                            <div className="w-36 flex-shrink-0">
                                <p className="text-sm font-medium text-foreground">{s.stage}</p>
                                <p className="text-xs text-muted-foreground">{s.count.toLocaleString()} users</p>
                            </div>
                            <div className="flex-1 h-6 bg-muted/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${s.pct}%`, background: s.color }}
                                />
                            </div>
                            <div className="w-16 text-right flex-shrink-0">
                                <p className="text-sm font-bold text-foreground">{s.pct}%</p>
                            </div>
                            {s.dropoffPct !== null && (
                                <div className="w-24 text-right flex-shrink-0">
                                    <span className="text-xs text-red-500 font-medium">↓ {s.dropoffPct}% drop</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Funnel Stage Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Stage</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Count</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Conversion Rate</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Drop-off %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stagesWithDropoff.map((s, i) => (
                                <tr key={s.stage} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <td className="px-4 py-3 font-medium text-foreground">{s.stage}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{s.count.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-medium text-foreground">{s.pct}%</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {s.dropoffPct !== null
                                            ? <span className="text-red-500 font-medium">{s.dropoffPct}%</span>
                                            : <span className="text-muted-foreground">—</span>}
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
