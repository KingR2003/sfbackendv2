import { useState, useEffect } from "react";
import { GlassCard } from "../shared/GlassCard";
import { KPICard } from "./KPICard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, UserPlus, UserCheck, Wallet, TrendingUp, Award } from "lucide-react";
import { AnalyticsFilters } from "./AnalyticsSidebar";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/lib/chartConfig";
import { getAnalyticsDemographic } from "@/lib/api";

export function CustomerDemographicReport({ filters }: { filters: AnalyticsFilters | null }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setData(null);
        getAnalyticsDemographic(filters)
            .then(res => { if (mounted) { setData(res); setLoading(false); setCurrentPage(1); } })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [filters]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 animate-pulse">
                <div className="text-muted-foreground text-sm font-medium">Loading demographic data...</div>
            </div>
        );
    }

    const uniqueCustomers: number = data?.uniqueCustomers ?? 0;
    const newCust: number = data?.newCust ?? 0;
    const returning: number = data?.returning ?? 0;
    const returningPct: string | number = data?.returningPct ?? "0";
    const totalRevenue: number = data?.totalRevenue ?? 0;
    const genderPieData: any[] = data?.genderPieData ?? [];
    const genderRevenueData: any[] = data?.genderRevenueData ?? [];
    const ageData: any[] = data?.ageData ?? [];
    const ageRevenueData: any[] = data?.ageRevenueData ?? [];
    const allCustomers: any[] = data?.allCustomers ?? data?.topCustomers ?? [];

    // Pagination logic
    const totalPages = Math.ceil(allCustomers.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = allCustomers.slice(startIdx, startIdx + itemsPerPage);

    return (
        <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Customer Demographics</h2>
            </div>

            {/* Enhanced KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                  index={0}
                  title="Total Customers"
                  value={uniqueCustomers.toLocaleString()}
                  icon={<Users className="w-5 h-5" />}
                  trend={{ value: 18, direction: "up" }}
                  color="blue"
                />
                <KPICard
                  index={1}
                  title="New Customers"
                  value={newCust.toLocaleString()}
                  icon={<UserPlus className="w-5 h-5" />}
                  trend={{ value: 23, direction: "up" }}
                  color="emerald"
                />
                <KPICard
                  index={2}
                  title="Returning Rate"
                  value={`${returningPct}`}
                  unit="%"
                  icon={<UserCheck className="w-5 h-5" />}
                  trend={{ value: 7, direction: "up" }}
                  color="purple"
                />
                <KPICard
                  index={3}
                  title="Total Revenue"
                  value={`₹${(totalRevenue / 1000).toFixed(1)}k`}
                  icon={<Wallet className="w-5 h-5" />}
                  trend={{ value: 14, direction: "up" }}
                  color="amber"
                />
            </div>

            {/* New vs Returning bar */}
            <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">New vs. Returning</h3>
                    <span className="text-xs text-muted-foreground">{uniqueCustomers} total customers</span>
                </div>
                <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-green-500 rounded-l-full transition-all" style={{ width: `${100 - parseFloat(String(returningPct))}%` }} />
                    <div className="bg-indigo-500 rounded-r-full flex-1" />
                </div>
                <div className="flex gap-6 mt-2 text-xs text-muted-foreground">
                    <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />New ({newCust})</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1" />Returning ({returning})</span>
                </div>
            </GlassCard>

            {/* Charts Row 1: Gender Pie + Age Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Gender Distribution</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">{genderPieData.length} genders</span>
                    </div>
                    {genderPieData.length === 0 ? (
                        <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <div className="text-3xl opacity-20">📊</div>
                            <p className="text-sm">No gender data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={genderPieData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {genderPieData.map((g: any, i: number) => <Cell key={i} fill={g.fill ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>

                <GlassCard className="p-5 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Age Distribution</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">{ageData.length} groups</span>
                    </div>
                    {ageData.length === 0 ? (
                        <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <div className="text-3xl opacity-20">📊</div>
                            <p className="text-sm">No age data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={ageData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="age" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} />
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Customers" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>
            </div>

            {/* Charts Row 2: Revenue by Gender + Revenue by Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-5 border border-border/50">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Gender</h3>
                    {genderRevenueData.length === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <div className="text-3xl opacity-20">💰</div>
                            <p className="text-sm">No revenue data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={genderRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {genderRevenueData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>

                <GlassCard className="p-5 border border-border/50">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Age Group</h3>
                    {ageRevenueData.length === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <div className="text-3xl opacity-20">📊</div>
                            <p className="text-sm">No revenue data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={ageRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
                                <XAxis dataKey="age" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                                <Bar dataKey="revenue" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>
            </div>

            {/* Demographic Table */}
            <GlassCard className="overflow-hidden border border-border/50">
                <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">All Customers</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2.5 py-1.5 rounded-lg border border-border">{allCustomers.length} total</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Demographics</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Location</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">Orders</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">Total Spent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="text-3xl opacity-20">👥</div>
                                            <p className="text-sm">No customer data available</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.map((c: any, i: number) => (
                                <tr key={i} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "bg-background" : "bg-muted/5"}`}>
                                    {/* Customer Name */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex flex-col gap-1">
                                            <p className="font-semibold text-foreground">{c.name || "—"}</p>
                                            {c.customerId && <p className="text-xs text-muted-foreground">ID: {c.customerId}</p>}
                                        </div>
                                    </td>
                                    
                                    {/* Demographics */}
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 w-fit ${
                                            c.gender === "Male" ? "bg-blue-100 text-blue-700" :
                                            c.gender === "Female" ? "bg-pink-100 text-pink-700" :
                                            c.gender === "Other" ? "bg-purple-100 text-purple-700" :
                                            "bg-slate-100 text-slate-700"
                                        }`}>
                                            {c.gender === "Male" ? "♂" : c.gender === "Female" ? "♀" : "•"} {c.gender || "Unknown"}
                                        </span>
                                    </td>
                                    
                                    {/* Location */}
                                    <td className="px-4 py-3.5">
                                        <p className="text-sm font-medium text-foreground">{c.location || "—"}</p>
                                    </td>
                                    
                                    {/* Orders Count */}
                                    <td className="px-4 py-3.5 text-center">
                                        <p className="text-lg font-bold text-primary">{c.orders || 0}</p>
                                    </td>
                                    
                                    {/* Total Revenue */}
                                    <td className="px-4 py-3.5 text-right">
                                        <p className="text-lg font-bold text-emerald-600">₹{(c.revenue ?? 0).toLocaleString()}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/10">
                        <div className="text-xs text-muted-foreground font-medium">
                            Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, allCustomers.length)} of {allCustomers.length}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>
                            
                            <div className="flex items-center gap-1">
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
                                className="px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
