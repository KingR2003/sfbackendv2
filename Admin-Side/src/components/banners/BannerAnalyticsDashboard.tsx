import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { GlassCard } from "@/components/shared/GlassCard";
import { Eye, MousePointerClick, TrendingUp, Trophy, Smartphone, Globe, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Banner, ctr, BannerPlatform } from "./bannerTypes";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, GRID_PROPS } from "@/lib/chartConfig";
import { getAnalyticsBanners } from "@/lib/api";
import type { AnalyticsFilters } from "@/components/analytics/AnalyticsSidebar";

// ── Shared KPI card ───────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: string; up: boolean };
}) {
  return (
    <GlassCard className="p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          {trend && (
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
              trend.up
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-destructive/10 text-destructive"
            )}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </span>
          )}
        </div>
        <p className="text-base font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-primary font-medium mt-0.5">{sub}</p>}
      </div>
    </GlassCard>
  );
}

// ── Section heading ────────────────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
      {children}
    </h2>
  );
}

// ── Tooltip formatter ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="min-w-[120px]">
      {label && <p className="text-xs font-semibold mb-1.5 text-foreground/70">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-xs font-semibold text-foreground">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Generate mock 14-day time-series per banner ────────────────────────────
function generateTimeSeries(banners: Banner[]) {
  const days: { date: string; label: string }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
  }

  return days.map(({ label }, idx) => {
    const entry: Record<string, number | string> = { label };
    let totalViews = 0, totalClicks = 0;
    banners.forEach(b => {
      const seed = (b.id * 31 + idx * 7) % 100;
      const v = Math.round((b.analytics.views / 14) * (0.6 + seed / 160));
      const c = Math.round((b.analytics.clicks / 14) * (0.6 + seed / 200));
      totalViews += v;
      totalClicks += c;
    });
    entry.Views = totalViews;
    entry.Clicks = totalClicks;
    return entry;
  });
}

// ─────────────────────────────────────────────────────────────────────────
interface Props {
  banners?: Banner[];
  filters?: AnalyticsFilters | null;
}

export function BannerAnalyticsDashboard({ filters }: Props) {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAnalyticsBanners(filters).then(res => {
      if (mounted) { setApiData(res); setLoading(false); }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [filters]);

  // ── ALL hooks MUST be before any conditional return ──────────────────────

  const banners: Banner[] = useMemo(() => {
    if (Array.isArray(apiData?.banners) && apiData.banners.length > 0) return apiData.banners;
    if (Array.isArray(apiData)) return apiData;
    return [];
  }, [apiData]);

  const total = useMemo(() => ({
    views:  apiData?.totalViews  ?? banners.reduce((s, b) => s + (b.analytics?.views  ?? 0), 0),
    clicks: apiData?.totalClicks ?? banners.reduce((s, b) => s + (b.analytics?.clicks ?? 0), 0),
  }), [apiData, banners]);

  const topBanner = useMemo(() =>
    [...banners].sort((a, b) => (b.analytics?.views ?? 0) - (a.analytics?.views ?? 0))[0],
  [banners]);

  const timeData = useMemo(() => generateTimeSeries(banners), [banners]);

  const bannerBarData = useMemo(() =>
    [...banners]
      .filter(b => (b.analytics?.views ?? 0) > 0)
      .sort((a, b) => (b.analytics?.views ?? 0) - (a.analytics?.views ?? 0))
      .slice(0, 6)
      .map(b => ({
        name: b.title.length > 16 ? b.title.slice(0, 14) + "…" : b.title,
        Views: b.analytics?.views ?? 0,
        Clicks: b.analytics?.clicks ?? 0,
        ctr: (b.analytics?.views ?? 0) > 0
          ? parseFloat((((b.analytics?.clicks ?? 0) / (b.analytics?.views ?? 1)) * 100).toFixed(1))
          : 0,
      })),
  [banners]);

  const platformData = useMemo(() => {
    const map: Record<string, { views: number; clicks: number }> = {
      App: { views: 0, clicks: 0 },
      Website: { views: 0, clicks: 0 },
      Both: { views: 0, clicks: 0 },
    };
    const normalize = (p: string): string => {
      const l = (p ?? "").toLowerCase();
      if (l === "app") return "App";
      if (l === "website" || l === "web") return "Website";
      return "Both";
    };
    banners.forEach(b => {
      const key = normalize(b.platform);
      if (!map[key]) map[key] = { views: 0, clicks: 0 };
      map[key].views  += b.analytics?.views  ?? 0;
      map[key].clicks += b.analytics?.clicks ?? 0;
    });
    const labels: Record<string, string> = { App: "Mobile App", Website: "Website", Both: "App & Web" };
    return Object.entries(map)
      .filter(([, v]) => v.views > 0)
      .map(([p, v]) => ({ name: labels[p] ?? p, views: v.views, clicks: v.clicks }));
  }, [banners]);

  const campaignData = useMemo(() => {
    const map: Record<string, { views: number; clicks: number }> = {};
    banners.forEach(b => {
      const key = b.campaign || "General";
      if (!map[key]) map[key] = { views: 0, clicks: 0 };
      map[key].views  += b.analytics?.views  ?? 0;
      map[key].clicks += b.analytics?.clicks ?? 0;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [banners]);

  const genderData = useMemo(() => {
    const map: Record<string, number> = {};
    banners.forEach(b => {
      const key = b.gender || "All";
      map[key] = (map[key] || 0) + (b.analytics?.views ?? 0);
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [banners]);

  const leaderboard = useMemo(() =>
    [...banners].sort((a, b) => (b.analytics?.views ?? 0) - (a.analytics?.views ?? 0)),
  [banners]);

  const PIE_COLORS = [CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[2], CHART_COLORS[3], CHART_COLORS[4]];

  const avgCtr = total.views > 0
    ? `${((total.clicks / total.views) * 100).toFixed(1)}%`
    : "0%";

  // ── Now safe to do conditional returns ────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-pulse">
        <div className="text-muted-foreground text-sm font-medium">Loading banner analytics...</div>
      </div>
    );
  }

  if (!banners.length) {
    return (
      <div className="flex justify-center items-center h-64 flex-col gap-2">
        <div className="text-muted-foreground text-sm font-medium">No banner data available.</div>
        <div className="text-xs text-muted-foreground">Create some banners first to see analytics here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Impressions"
          value={total.views.toLocaleString()}
          icon={Eye}
          color="bg-primary"
          trend={{ value: "12.4%", up: true }}
        />
        <KpiCard
          label="Total Clicks"
          value={total.clicks.toLocaleString()}
          icon={MousePointerClick}
          color="bg-blue-500"
          trend={{ value: "8.1%", up: true }}
        />
        <KpiCard
          label="Average CTR"
          value={avgCtr}
          sub="Click-through rate"
          icon={TrendingUp}
          color="bg-violet-500"
          trend={{ value: "2.3%", up: true }}
        />
        <KpiCard
          label="Top Performer"
          value={topBanner ? (topBanner.title.length > 18 ? topBanner.title.slice(0, 16) + "…" : topBanner.title) : "—"}
          sub={topBanner ? `${topBanner.analytics.views.toLocaleString()} views` : undefined}
          icon={Trophy}
          color="bg-amber-500"
        />
      </div>

      {/* ── Trend line ── */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Heading>Views & Clicks — Last 14 Days</Heading>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={timeData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.18} />
                <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.18} />
                <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Views"  stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#gViews)"  dot={false} />
            <Area type="monotone" dataKey="Clicks" stroke={CHART_COLORS[1]} strokeWidth={2} fill="url(#gClicks)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* ── Banner comparison + campaign ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Per-banner bar */}
        <GlassCard className="p-5">
          <Heading>Banner Performance Comparison</Heading>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Views & clicks per banner</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bannerBarData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Views"  fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Clicks" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Campaign type */}
        <GlassCard className="p-5">
          <Heading>Views by Campaign Type</Heading>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Impressions grouped by campaign</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaignData} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} horizontal={false} />
              <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={72} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="views"  name="Views"  fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} maxBarSize={20} />
              <Bar dataKey="clicks" name="Clicks" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ── Platform donut + Gender donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform */}
        <GlassCard className="p-5">
          <Heading>Impressions by Platform</Heading>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Where banners are shown</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={platformData} dataKey="views" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString(), "Views"]}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {platformData.map((d, i) => {
                const pct = total.views > 0 ? ((d.views / total.views) * 100).toFixed(0) : "0";
                const Icon = d.name === "Mobile App" ? Smartphone : d.name === "Website" ? Globe : Layers;
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground flex-1">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Gender */}
        <GlassCard className="p-5">
          <Heading>Impressions by Audience Gender</Heading>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Targeted audience distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString(), "Views"]}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {genderData.map((d, i) => {
                const pct = total.views > 0 ? ((d.value / total.views) * 100).toFixed(0) : "0";
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-foreground flex-1">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Leaderboard table ── */}
      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <Heading>Banner Leaderboard</Heading>
          <p className="text-xs text-muted-foreground mt-0.5">All banners ranked by impressions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-center py-3 px-4 font-medium w-10">#</th>
                <th className="text-left py-3 px-4 font-medium">Banner</th>
                <th className="text-left py-3 px-4 font-medium">Campaign</th>
                <th className="text-left py-3 px-4 font-medium">Platform</th>
                <th className="text-right py-3 px-4 font-medium">Views</th>
                <th className="text-right py-3 px-4 font-medium">Clicks</th>
                <th className="text-right py-3 px-4 font-medium">CTR</th>
                <th className="text-right py-3 px-4 font-medium pr-5">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((banner, idx) => {
                const topViews = leaderboard[0]?.analytics?.views ?? 0;
                const barWidth = topViews > 0
                  ? Math.max(4, Math.round((banner.analytics.views / topViews) * 100))
                  : 0;
                return (
                  <tr key={banner.id} className="hover:bg-accent/20 transition-colors">
                    <td className="py-3 px-4 text-center">
                      {idx === 0 ? (
                        <span className="text-amber-400 font-bold text-base">🥇</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-400 font-bold text-base">🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-orange-400 font-bold text-base">🥉</span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{banner.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{banner.status}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{banner.campaign}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{banner.platform}</td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground text-sm">
                      {banner.analytics.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {banner.analytics.clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-semibold text-primary">{ctr(banner.analytics)}</span>
                    </td>
                    <td className="py-3 px-4 pr-5">
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden ml-auto">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
