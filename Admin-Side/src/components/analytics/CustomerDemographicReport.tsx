import { GlassCard } from "../shared/GlassCard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, UserPlus, UserCheck, Wallet } from "lucide-react";
import { mockOrders } from "@/data/mockData";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";

export function CustomerDemographicReport({ filters }: { filters: AnalyticsFilters | null }) {
    const filteredOrders = mockOrders.filter(order => {
        if (!filters) return true;
        if (filters.startDate && order.date < filters.startDate) return false;
        if (filters.endDate && order.date > filters.endDate) return false;
        if (filters.gender !== "all" && order.customerDemographics.gender.toLowerCase() !== filters.gender) return false;
        if (filters.location !== "all" && order.customerDemographics.location.toLowerCase() !== filters.location) return false;
        return true;
    });

    const total = filteredOrders.length;

    // Unique customers
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customerId ?? o.customerName ?? o.customer ?? o.id)).size;
    // New vs returning: mock — treat customers appearing >1 time as returning
    const customerFreq: Record<string, number> = {};
    filteredOrders.forEach(o => {
        const id = o.customerId ?? o.customerName ?? o.customer ?? o.id;
        customerFreq[id] = (customerFreq[id] || 0) + 1;
    });
    const returning = Object.values(customerFreq).filter(v => v > 1).length;
    const newCust = uniqueCustomers - returning;
    const returningPct = uniqueCustomers > 0 ? ((returning / uniqueCustomers) * 100).toFixed(1) : "0";

    // Gender distribution
    const genderMap: Record<string, { count: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
        const g = o.customerDemographics.gender || "Unknown";
        if (!genderMap[g]) genderMap[g] = { count: 0, revenue: 0 };
        genderMap[g].count += 1;
        genderMap[g].revenue += o.totalAmount;
    });
    const genderColors: Record<string, string> = { Male: CHART_COLORS[1], Female: "#ec4899", Other: CHART_COLORS[3] };
    const genderPieData = Object.entries(genderMap).map(([name, d]) => ({
        name, value: d.count, revenue: d.revenue, fill: genderColors[name] || CHART_COLORS[5],
    }));
    const genderRevenueData = genderPieData.map(g => ({ name: g.name, revenue: g.revenue }));

    // Age distribution — brackets: <18, 18-24, 25-34, 35-44, 45-54, 55+
    const ageBrackets = [
        { label: "< 18", min: 0, max: 17 },
        { label: "18–24", min: 18, max: 24 },
        { label: "25–34", min: 25, max: 34 },
        { label: "35–44", min: 35, max: 44 },
        { label: "45–54", min: 45, max: 54 },
        { label: "55+", min: 55, max: 999 },
    ];
    const ageData = ageBrackets.map(b => {
        const orders = filteredOrders.filter(o => o.customerDemographics.age >= b.min && o.customerDemographics.age <= b.max);
        return { age: b.label, count: orders.length, revenue: orders.reduce((s, o) => s + o.totalAmount, 0) };
    });
    const ageRevenueData = ageData.map(a => ({ age: a.age, revenue: a.revenue }));

    // Demographic customer table
    const customerMap: Record<string, { name: string; gender: string; age: number; location: string; orders: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
        const id = o.customerId ?? o.customerName ?? o.customer ?? o.id;
        if (!customerMap[id]) {
            customerMap[id] = {
                name: o.customerName ?? o.customer ?? "Unknown", gender: o.customerDemographics.gender,
                age: o.customerDemographics.age, location: o.customerDemographics.location,
                orders: 0, revenue: 0,
            };
        }
        customerMap[id].orders += 1;
        customerMap[id].revenue += o.totalAmount;
    });
    const topCustomers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const totalRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Customer Demographics</h2>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Customers", value: uniqueCustomers.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "New Customers", value: newCust.toLocaleString(), icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Returning Customers", value: `${returningPct}%`, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Total Revenue", value: `₹${(totalRevenue / 1000).toFixed(1)}k`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
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

            {/* New vs Returning bar */}
            <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">New vs. Returning</h3>
                    <span className="text-xs text-muted-foreground">{uniqueCustomers} total customers</span>
                </div>
                <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-green-500 rounded-l-full transition-all" style={{ width: `${100 - parseFloat(returningPct)}%` }} />
                    <div className="bg-indigo-500 rounded-r-full flex-1" />
                </div>
                <div className="flex gap-6 mt-2 text-xs text-muted-foreground">
                    <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />New ({newCust})</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1" />Returning ({returning})</span>
                </div>
            </GlassCard>

            {/* Charts Row 1: Gender Pie + Age Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Gender Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={genderPieData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                {genderPieData.map((g, i) => <Cell key={i} fill={g.fill} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Age Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ageData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="age" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Customers" />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Charts Row 2: Revenue by Gender + Revenue by Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Gender</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={genderRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="name" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                {genderRevenueData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Age Group</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={ageRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                            <XAxis dataKey="age" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            <Bar dataKey="revenue" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Demographic Table */}
            <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Top Customers</h3>
                </div>
                <div className="overflow-x-auto">
                        <table className="w-full text-sm table-auto">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                    {[
                                        { label: "Customer", align: "text-left" },
                                        { label: "Gender", align: "text-left" },
                                        { label: "Age", align: "text-left" },
                                        { label: "Location", align: "text-left" },
                                        { label: "Orders", align: "text-right" },
                                        { label: "Revenue", align: "text-right" },
                                    ].map(h => (
                                        <th
                                            key={h.label}
                                            className={`px-4 py-3 text-xs font-semibold text-muted-foreground ${h.align}`}
                                        >
                                            {h.label}
                                        </th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {topCustomers.map((c, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{c.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.gender === "Male" ? "bg-blue-50 text-blue-600" : c.gender === "Female" ? "bg-pink-50 text-pink-600" : "bg-muted text-muted-foreground"}`}>
                                            {c.gender}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.age}</td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.location}</td>
                                        <td className="px-4 py-3 text-right font-medium tabular-nums">{c.orders}</td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{c.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
