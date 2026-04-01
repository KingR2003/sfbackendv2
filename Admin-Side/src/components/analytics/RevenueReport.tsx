import { GlassCard } from "../shared/GlassCard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { mockProducts, mockOrders } from "@/data/mockData";
import { Button } from "../ui/button";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, GRID_PROPS } from "@/lib/chartConfig";

export function RevenueReport({ filters }: { filters: AnalyticsFilters | null }) {
    const filteredOrders = mockOrders.filter(order => {
        if (!filters) return true;
        if (filters.startDate && order.date < filters.startDate) return false;
        if (filters.endDate && order.date > filters.endDate) return false;
        if (filters.gender !== "all" && order.customerDemographics.gender.toLowerCase() !== filters.gender) return false;
        if (filters.location !== "all" && order.customerDemographics.location.toLowerCase() !== filters.location) return false;
        if (filters.orderStatus !== "all" && order.status.toLowerCase() !== filters.orderStatus) return false;
        if (filters.ageRange !== "all") {
            const age = order.customerDemographics.age;
            if (filters.ageRange === "18-24" && (age < 18 || age > 24)) return false;
            if (filters.ageRange === "25-34" && (age < 25 || age > 34)) return false;
            if (filters.ageRange === "35-44" && (age < 35 || age > 44)) return false;
            if (filters.ageRange === "45+" && age < 45) return false;
        }
        return true;
    });

    const activeProductIds = filters
        ? Object.entries(filters.products).filter(([, v]) => v).map(([k]) => Number(k))
        : [];

    const monthlyMap: Record<string, number> = {};
    filteredOrders.forEach(order => {
        const month = new Date(order.date).toLocaleString("default", { month: "short" });
        let rev = 0;
        order.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId))
                rev += item.price * item.quantity;
        });
        monthlyMap[month] = (monthlyMap[month] || 0) + rev;
    });
    const monthlyData = Object.entries(monthlyMap).map(([name, revenue]) => ({ name, revenue }));

    const productMap: Record<number, { name: string; revenue: number; units: number; price: number }> = {};
    mockProducts.forEach(p => {
        if (activeProductIds.length === 0 || activeProductIds.includes(p.id))
            productMap[p.id] = { name: p.name, revenue: 0, units: 0, price: p.variants[0]?.price || 0 };
    });
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (productMap[item.productId]) {
                productMap[item.productId].revenue += item.price * item.quantity;
                productMap[item.productId].units += item.quantity;
            }
        });
    });
    const productData = Object.values(productMap).filter(p => p.revenue > 0);

    const ageMap: Record<string, number> = { "18-24": 0, "25-34": 0, "35-44": 0, "45+": 0 };
    filteredOrders.forEach(order => {
        let rev = 0;
        order.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId))
                rev += item.price * item.quantity;
        });
        const age = order.customerDemographics.age;
        if (age >= 18 && age <= 24) ageMap["18-24"] += rev;
        else if (age >= 25 && age <= 34) ageMap["25-34"] += rev;
        else if (age >= 35 && age <= 44) ageMap["35-44"] += rev;
        else if (age >= 45) ageMap["45+"] += rev;
    });
    const ageData = Object.entries(ageMap).map(([name, value]) => ({ name, value }));

    const genderMap: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    filteredOrders.forEach(order => {
        let rev = 0;
        order.items.forEach(item => {
            if (activeProductIds.length === 0 || activeProductIds.includes(item.productId))
                rev += item.price * item.quantity;
        });
        if (genderMap[order.customerDemographics.gender] !== undefined)
            genderMap[order.customerDemographics.gender] += rev;
    });
    const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value })).filter(g => g.value > 0);

    const totalRevenue = productData.reduce((sum, p) => sum + p.revenue, 0);

    return (
        <div id="revenue-report-container" className="space-y-6 animate-in fade-in duration-300">

            {/* KPI banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <GlassCard className="p-5 border border-border/50 md:col-span-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-foreground">
                                ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full">
                                <ArrowUpRight className="w-4 h-4" />+15.3%
                            </span>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Monthly Revenue */}
                <GlassCard className="p-5 border border-border/50">
                    <h4 className="text-sm font-bold text-foreground mb-4">Monthly Revenue Trend</h4>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, fill: "#10b981" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Revenue by Product */}
                <GlassCard className="p-5 border border-border/50">
                    <h4 className="text-sm font-bold text-foreground mb-4">Revenue by Product</h4>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                                <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Revenue by Age */}
                <GlassCard className="p-5 border border-border/50">
                    <h4 className="text-sm font-bold text-foreground mb-4">Revenue by Age Group</h4>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={ageData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {ageData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Revenue by Gender */}
                <GlassCard className="p-5 border border-border/50">
                    <h4 className="text-sm font-bold text-foreground mb-4">Revenue by Gender</h4>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={genderData} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#ec4899" />
                                    <Cell fill="#10b981" />
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* Table */}
            <GlassCard className="border border-border/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                    <h4 className="text-sm font-bold text-foreground">Revenue Breakdown by Product</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-muted-foreground border-b border-border/50">
                                <th className="text-left px-6 py-3 font-semibold">Product</th>
                                <th className="text-right px-6 py-3 font-semibold">Units Sold</th>
                                <th className="text-right px-6 py-3 font-semibold">Avg. Price</th>
                                <th className="text-right px-6 py-3 font-semibold">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productData.map((p, i) => (
                                <tr key={p.name} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                                    <td className="px-6 py-3.5 font-semibold text-foreground">{p.name}</td>
                                    <td className="px-6 py-3.5 text-right text-muted-foreground">{p.units.toLocaleString()}</td>
                                    <td className="px-6 py-3.5 text-right text-muted-foreground">₹{p.price.toFixed(2)}</td>
                                    <td className="px-6 py-3.5 text-right font-bold text-primary">₹{Math.round(p.revenue).toLocaleString("en-IN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
