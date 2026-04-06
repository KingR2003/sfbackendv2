import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, ChevronDown, Pencil, GripVertical,
  BarChart2, ImageIcon, Image, AlertTriangle, TrendingUp, Clock, Ban,
  Eye, Smartphone, Monitor, ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Banner, BannerStatus, BannerPlatform,
  computeStatus, daysUntilExpiry,
} from "@/components/banners/bannerTypes";
import { AddBannerModal } from "@/components/banners/AddBannerModal";
import { getBanners, createBanner, updateBanner, uploadBannerImage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


// ── Status badge ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<BannerStatus, { dot: string; bg: string; text: string }> = {
  Active: { dot: "bg-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-500" },
  Scheduled: { dot: "bg-amber-400", bg: "bg-amber-400/10 border-amber-400/20", text: "text-amber-400" },
  Expired: { dot: "bg-destructive", bg: "bg-destructive/10 border-destructive/20", text: "text-destructive" },
  Inactive: { dot: "bg-muted-foreground", bg: "bg-muted/50 border-border", text: "text-muted-foreground" },
};

function StatusBadge({ status }: { status: BannerStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {status}
    </span>
  );
}

const CAMPAIGN_COLORS: Record<string, string> = {
  Festival: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Seasonal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Discount: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "New Product": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Announcement: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

function CampaignBadge({ tag }: { tag: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium",
      CAMPAIGN_COLORS[tag] ?? "bg-muted text-muted-foreground border-border")}>
      {tag}
    </span>
  );
}

function getBannerIdFromResponse(response: any): number | string | null {
  return response?.data?.id ?? response?.banner?.id ?? response?.id ?? null;
}

function PlatformBadge({ platform }: { platform: BannerPlatform }) {
  const map: Record<BannerPlatform, string> = {
    App: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Website: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    Both: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium", map[platform])}>
      {platform === "Both" ? "App & Web" : platform}
    </span>
  );
}

function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function StatCard({ label, value, icon: Icon, color, active }: {
  label: string; value: number; icon: React.ElementType; color: string; active?: boolean;
}) {
  return (
    <GlassCard className={cn("flex items-center gap-4 px-5 py-4 transition-all hover:ring-2 hover:ring-primary/50", active && "ring-2 ring-primary/60")}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </GlassCard>
  );
}

function FilterDropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("h-9 gap-2 text-sm", value !== "All" && "border-primary text-primary")}>
          {value === "All" ? label : value}
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {options.map(o => (
          <DropdownMenuItem key={o} onClick={() => onChange(o)}
            className={cn(value === o && "text-primary font-medium")}>
            {o}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ═════════════════════════════════════════════════════════════════════════
export default function Banners() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Banner | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Banner | null>(null);
  const [viewTarget, setViewTarget] = useState<Banner | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAudience, setFilterAudience] = useState("All");
  const [filterCampaign, setFilterCampaign] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const dragRef = useRef<number | string | null>(null);
  const dragOverRef = useRef<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const data = await getBanners();
      setBanners(data.map((b: any) => ({ ...b, status: computeStatus(b) })));
    } catch (err: any) {
      console.error("Failed to fetch banners:", err);
      toast({
        title: "Error Loading Banners",
        description: err.message || "Failed to contact the backend.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const active = banners.filter(b => b.status === "Active").length;
  const scheduled = banners.filter(b => b.status === "Scheduled").length;
  const expired = banners.filter(b => b.status === "Expired").length;

  const filtered = banners.filter(b => {
    const q = search.toLowerCase();
    if (q && !b.title.toLowerCase().includes(q) && !b.campaign.toLowerCase().includes(q)) return false;
    if (filterPlatform !== "All") {
      if (filterPlatform === "App" && b.platform !== "App" && b.platform !== "Both") return false;
      if (filterPlatform === "Website" && b.platform !== "Website" && b.platform !== "Both") return false;
    }
    if (filterStatus !== "All" && b.status !== filterStatus) return false;
    if (filterAudience !== "All" && b.gender !== filterAudience) return false;
    if (filterCampaign !== "All" && b.campaign !== filterCampaign) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "A→Z") return a.title.localeCompare(b.title);
    if (sortBy === "Z→A") return b.title.localeCompare(a.title);
    if (sortBy === "Oldest") return Number(a.id) - Number(b.id);
    return Number(b.id) - Number(a.id); // Newest
  });

  const nextPriority = Math.max(...banners.map(b => b.priority), 0) + 1;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedBanners = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = async (data: any, file: File | null) => {
    setIsLoading(true);
    try {
      const payload: any = {
        title: data.title,
        description: data.description,
        platform: data.platform,
        gender: data.gender,
        ageGroup: data.ageGroup,
        campaignType: data.campaign,        // frontend: campaign → backend: campaignType
        buttonText: data.buttonText,
        redirectTo: data.redirectPage,       // frontend: redirectPage → backend: redirectTo
        priority: data.priority,
        displayOrder: data.priority,
        orderNo: data.priority,
        startDateTime: data.startDate,       // frontend: startDate → backend: startDateTime
        endDateTime: data.endDate,           // frontend: endDate → backend: endDateTime
        isActive: data.active,               // frontend: active → backend: isActive
        // Backend requires bannerImage; send existing URL when editing, placeholder for new banners.
        // The real image URL is set by the upload-image endpoint after the row is created.
        bannerImage: editTarget?.imageUrl ?? "pending",
      };

      let bannerId: number | string | null = editTarget?.id ?? null;

      if (editTarget) {
        await updateBanner(editTarget.id, payload);
      } else {
        const createdBanner = await createBanner(payload);
        bannerId = getBannerIdFromResponse(createdBanner);

        if (!bannerId) {
          throw new Error("Banner was created, but no banner ID was returned for image upload.");
        }
      }

      if (file) {
        if (!bannerId) {
          throw new Error("Banner ID is required before uploading an image.");
        }

        await uploadBannerImage(bannerId, file);
      }

      toast({ title: "Success", description: editTarget ? "Banner updated successfully." : "Banner created successfully." });
      setModalOpen(false);
      setEditTarget(null);
      await fetchBanners();
    } catch (err: any) {
      console.error("Failed to save banner:", err);
      toast({
        title: "Error Saving Banner",
        description: err.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = (banner: Banner) => {
    setBanners(prev => [...prev, {
      ...banner,
      id: Date.now(),
      title: `${banner.title} (Copy)`,
      priority: nextPriority,
      status: "Inactive",
      active: false,
      analytics: { views: 0, clicks: 0 },
      createdAt: new Date().toISOString(),
    }]);
  };

  const handleToggleActive = async (banner: Banner) => {
    setIsLoading(true);
    try {
      const newActive = !banner.active;
      // When deactivating, assign the lowest priority (below all active banners)
      const newPriority = newActive
        ? banner.priority
        : Math.max(...banners.map(b => b.priority), 0) + 1;
      const payload = {
        title: banner.title,
        description: banner.description,
        platform: banner.platform,
        gender: banner.gender,
        ageGroup: banner.ageGroup,
        campaignType: banner.campaign,
        buttonText: banner.buttonText,
        redirectTo: banner.redirectPage,
        priority: newPriority,
        displayOrder: newPriority,
        orderNo: newPriority,
        startDateTime: banner.startDate,
        endDateTime: banner.endDate,
        bannerImage: banner.imageUrl ?? null,
        isActive: newActive,
      };
      await updateBanner(banner.id, payload);
      toast({ title: "Success", description: `Banner ${newActive ? "activated" : "deactivated"} successfully.` });
      await fetchBanners();
    } catch (err: any) {
      console.error("Failed to toggle banner status:", err);
      toast({
        title: "Error",
        description: err.message || "Could not update status.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buildBannerUpdatePayload = (banner: Banner, overrides: Partial<Record<string, any>> = {}) => ({
    title: banner.title,
    description: banner.description,
    platform: banner.platform,
    gender: banner.gender,
    ageGroup: banner.ageGroup,
    campaignType: banner.campaign,
    buttonText: banner.buttonText,
    redirectTo: banner.redirectPage,
    priority: banner.priority,
    displayOrder: banner.priority,
    orderNo: banner.priority,
    startDateTime: banner.startDate,
    endDateTime: banner.endDate,
    bannerImage: banner.imageUrl ?? null,
    isActive: banner.active,
    ...overrides,
  });

  const onDragEnd = () => {
    const fromId = dragRef.current, toId = dragOverRef.current;
    if (fromId === null || toId === null || fromId === toId) return;

    let reordered: Banner[] = [];
    setBanners(prev => {
      const arr = [...prev];
      const from = arr.findIndex(b => b.id === fromId);
      const to = arr.findIndex(b => b.id === toId);
      if (from === -1 || to === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      reordered = arr.map((b, i) => ({ ...b, priority: i + 1 }));
      return reordered;
    });

    // Give setState a tick to commit, then compute changed banners
    setTimeout(() => {
      const changed = reordered.filter(b => {
        const old = banners.find(prev => prev.id === b.id);
        return !old || old.priority !== b.priority;
      });

      if (changed.length > 0) {
        setIsLoading(true);
        Promise.all(
          changed.map(b => updateBanner(b.id, buildBannerUpdatePayload(b)))
        )
          .catch((err: any) => {
            console.error("Failed to persist banner order:", err);
            toast({
              title: "Error",
              description: err.message || "Failed to save banner order.",
              variant: "destructive"
            });
            fetchBanners();
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }, 0);

    dragRef.current = null;
    dragOverRef.current = null;
  };

  const hasActiveFilters = search || filterPlatform !== "All" || filterStatus !== "All"
    || filterAudience !== "All" || filterCampaign !== "All";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GlassCard className="flex items-center justify-between gap-4 px-5 py-4 cursor-default transition-all hover:ring-2 hover:ring-primary/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{banners.length}</p>
                  <p className="text-xs text-muted-foreground">Total Banners</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="w-10 h-10 rounded-full gradient-green flex items-center justify-center text-primary-foreground shadow-lg green-glow"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </GlassCard>
            <div onClick={() => setFilterStatus(filterStatus === "Active" ? "All" : "Active")} className="cursor-pointer">
              <StatCard label="Active" value={active} icon={TrendingUp} color="bg-emerald-500" active={filterStatus === "Active"} />
            </div>
            <div onClick={() => setFilterStatus(filterStatus === "Scheduled" ? "All" : "Scheduled")} className="cursor-pointer">
              <StatCard label="Scheduled" value={scheduled} icon={Clock} color="bg-amber-500" active={filterStatus === "Scheduled"} />
            </div>
            <div onClick={() => setFilterStatus(filterStatus === "Expired" ? "All" : "Expired")} className="cursor-pointer">
              <StatCard label="Expired" value={expired} icon={Ban} color="bg-destructive" active={filterStatus === "Expired"} />
            </div>
          </div>

          {/* Filters */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input className="pl-9 h-9" placeholder="Search banner title or campaign..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <FilterDropdown label="Platform" value={filterPlatform}
                options={["All", "App", "Website"]} onChange={setFilterPlatform} />
              <FilterDropdown label="Status" value={filterStatus}
                options={["All", "Active", "Scheduled", "Expired", "Inactive"]} onChange={setFilterStatus} />
              <FilterDropdown label="Audience" value={filterAudience}
                options={["All", "Men", "Women"]} onChange={setFilterAudience} />
              <FilterDropdown label="Campaign" value={filterCampaign}
                options={["All", "Festival", "Seasonal", "Discount", "New Product", "Announcement"]}
                onChange={setFilterCampaign} />
              <FilterDropdown label="Sort" value={sortBy}
                options={["Newest First", "Oldest First", "A→Z", "Z→A"]}
                onChange={(v) => { setSortBy(v as any); setCurrentPage(1); }} />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="text-xs h-9 text-muted-foreground"
                  onClick={() => { setSearch(""); setFilterPlatform("All"); setFilterStatus("All"); setFilterAudience("All"); setFilterCampaign("All"); setSortBy("Newest First"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Table / Empty */}
          {isLoading && banners.length === 0 ? (
            <GlassCard className="py-20 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading banners...</p>
            </GlassCard>
          ) : filtered.length === 0 ? (
            <GlassCard className="py-20 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {hasActiveFilters ? "No banners match your filters" : "No banners created yet"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? "Try adjusting your search or filter criteria." : "Start promoting your products with banners."}
                </p>
              </div>
              {!hasActiveFilters && (
                <Button onClick={() => { setEditTarget(null); setModalOpen(true); }}
                  className="gap-2 gradient-green text-white mt-2">
                  <Plus className="w-4 h-4" /> Create Banner
                </Button>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/50">Drag to reorder</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="w-8 py-3 px-3" />
                    <th className="text-left py-3 px-3 font-medium">Image</th>
                    <th className="text-left py-3 px-3 font-medium">Title</th>
                    <th className="text-left py-3 px-3 font-medium">Platform</th>
                    <th className="text-center py-3 px-3 font-medium">Priority</th>
                    <th className="text-left py-3 px-3 font-medium">Status</th>
                    <th className="text-center py-3 px-3 font-medium">Active</th>
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                   {paginatedBanners.map((banner, idx) => {
                      const days = daysUntilExpiry(banner.endDate);
                      const showExpiry = banner.status === "Active" && days >= 0 && days <= 2;

                      return (
                        <motion.tr
                          key={banner.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.18 }}
                          draggable
                          onDragStart={() => { dragRef.current = banner.id; }}
                          onDragEnter={() => { dragOverRef.current = banner.id; }}
                          onDragEnd={onDragEnd}
                          onDragOver={e => e.preventDefault()}
                          className={cn(
                            "group hover:bg-accent/30 transition-colors cursor-grab active:cursor-grabbing",
                            banner.status === "Inactive" && "opacity-60"
                          )}
                        >
                          <td className="py-3 px-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="w-16 h-11 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center flex-shrink-0">
                              {banner.imageUrl
                                ? <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                : <ImageIcon className="w-5 h-5 text-muted-foreground/40" />}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-foreground">{banner.title}</p>
                            {showExpiry && (
                              <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-[10px] font-medium">
                                  Expires {days === 0 ? "today" : `in ${days}d`}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3"><PlatformBadge platform={banner.platform} /></td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {banner.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3"><StatusBadge status={banner.status} /></td>
                          <td className="py-3 px-3 text-center">
                            <Switch
                              checked={banner.active}
                              onCheckedChange={() => {
                                if (banner.active) {
                                  setDeactivateTarget(banner);
                                } else {
                                  handleToggleActive(banner);
                                }
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewTarget(banner)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditTarget(banner); setModalOpen(true); }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} banners</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    Total impressions: {banners.reduce((s, b) => s + b.analytics.views, 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                      Previous
                    </button>
                    <span className="font-medium">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </>
      </div>

      {/* Visual Banner Preview Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={v => { if (!v) setViewTarget(null); }}>
        <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between pl-6 pr-14 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-background to-background">
            <div>
              <DialogTitle className="text-base font-semibold">{viewTarget?.title ?? "Banner Preview"}</DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Live preview · {viewTarget?.platform}</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border p-1 bg-muted/40 shadow-sm">
              <button onClick={() => setPreviewDevice("mobile")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                  previewDevice === "mobile" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
              <button onClick={() => setPreviewDevice("desktop")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                  previewDevice === "desktop" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
            </div>
          </div>

          {viewTarget && (<>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-muted/20 to-background">
              {/* Device frame */}
              {previewDevice === "mobile" ? (
                <div className="mx-auto w-[220px] drop-shadow-2xl">
                  {/* Phone shell — portrait */}
                  <div className="rounded-[2.2rem] border-[6px] border-foreground/20 bg-background overflow-hidden shadow-2xl ring-1 ring-foreground/8">
                    {/* Status bar */}
                    <div className="bg-background flex items-center justify-between px-4 pt-2 pb-1">
                      <span className="text-[7px] font-semibold text-foreground/50">9:41</span>
                      {/* Dynamic island */}
                      <div className="w-10 h-2.5 rounded-full bg-foreground/80" />
                      <div className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 text-foreground/50" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.5C5.5 4.5 10.5 2 12 2s6.5 2.5 10.5 6.5l-2 2C17 7 14.7 5.5 12 5.5S7 7 4.5 10.5l-3-2z" /><path d="M5.5 12.5C7.5 10.5 9.5 9 12 9s4.5 1.5 6.5 3.5l-2 2c-1.2-1.2-2.7-2-4.5-2s-3.3.8-4.5 2l-2-2z" /><circle cx="12" cy="18" r="2" /></svg>
                        <svg className="w-2.5 h-2 text-foreground/50" viewBox="0 0 24 20" fill="currentColor"><rect x="1" y="1" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="19" y="5" width="4" height="6" rx="1" fill="currentColor" opacity="0.5" /><rect x="2" y="2" width="12" height="12" rx="1" fill="currentColor" opacity="0.4" /></svg>
                      </div>
                    </div>

                    {/* App header */}
                    <div className="bg-background px-3 pb-2 flex items-center justify-between border-b border-border/40">
                      <div>
                        <p className="text-[9px] font-bold text-foreground leading-none">Svasthya Fresh</p>
                        <p className="text-[7px] text-muted-foreground">Pure &amp; Natural</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <div className="relative">
                          <svg className="w-3.5 h-3.5 text-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                      </div>
                    </div>

                    {/* App content */}
                    <div className="bg-muted/30 px-2.5 py-2.5 space-y-2.5">
                      {/* Banner card */}
                      <div className="relative rounded-xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/7" }}>
                        {viewTarget.imageUrl
                          ? <img src={viewTarget.imageUrl} alt={viewTarget.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-primary/5 flex items-center justify-center">
                            <ImageIcon className="w-7 h-7 text-primary/30" />
                          </div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-center px-3">
                          <p className="text-white text-[10px] font-bold leading-tight max-w-[60%]">{viewTarget.title}</p>
                          {viewTarget.description && (
                            <p className="text-white/70 text-[8px] mt-0.5 line-clamp-1 max-w-[60%]">{viewTarget.description}</p>
                          )}
                          <button className="mt-1.5 w-fit bg-white text-black text-[8px] font-bold px-2.5 py-0.5 rounded-full">
                            {viewTarget.buttonText}
                          </button>
                        </div>
                        {/* Dots indicator */}
                        <div className="absolute bottom-1.5 right-2 flex gap-0.5">
                          {[true, false, false].map((a, i) => <div key={i} className={`h-1 rounded-full ${a ? "w-3 bg-white" : "w-1 bg-white/40"}`} />)}
                        </div>
                      </div>

                      {/* Category pills */}
                      <div className="flex gap-1.5 overflow-hidden">
                        {["Honey", "Ghee", "Chikki", "Dates"].map((c, i) => (
                          <div key={c} className={`flex-shrink-0 text-[7px] font-medium px-2 py-0.5 rounded-full border ${i === 0 ? "bg-primary text-white border-primary" : "bg-background border-border text-foreground/60"}`}>{c}</div>
                        ))}
                      </div>

                      {/* Product grid skeleton */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="bg-background rounded-lg p-1.5 border border-border/40">
                            <div className="bg-muted rounded-md h-10 mb-1.5" />
                            <div className="h-1.5 bg-muted rounded w-3/4 mb-1" />
                            <div className="h-1.5 bg-muted rounded w-1/2" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom tab bar */}
                    <div className="bg-background border-t border-border/40 px-3 py-1.5 flex justify-around items-center">
                      {[
                        { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", active: true },
                        { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", active: false },
                        { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18", active: false },
                        { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", active: false },
                      ].map(({ d, active }, i) => (
                        <svg key={i} className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground/40"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d} /></svg>
                      ))}
                    </div>
                  </div>
                  {/* Home indicator */}
                  <div className="mx-auto mt-1.5 w-16 h-1 rounded-full bg-foreground/15" />
                </div>
              ) : (
                <div className="rounded-2xl border border-foreground/15 overflow-hidden shadow-2xl ring-1 ring-foreground/5">
                  {/* Browser chrome */}
                  <div className="bg-muted/80 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 border-b border-border">
                    <div className="flex gap-1.5">
                      {["bg-red-400", "bg-yellow-400", "bg-green-400"].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c} shadow-sm`} />)}
                    </div>
                    <div className="flex gap-1 border-b-0">
                      {[true, false, false].map((active, i) =>
                        <div key={i} className={cn("text-[10px] px-3 py-1 rounded-t-md", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
                          {active ? "svasthyafresh.com" : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-background/80 border border-border rounded-md text-[10px] text-muted-foreground px-2.5 py-1 flex items-center gap-1.5 max-w-xs">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      svasthyafresh.com
                    </div>
                  </div>
                  {/* Banner */}
                  <div className="relative">
                    {viewTarget.imageUrl
                      ? <img src={viewTarget.imageUrl} alt={viewTarget.title} className="w-full h-52 object-cover" />
                      : <div className="w-full h-52 bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-primary/30" />
                      </div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center px-8">
                      <div className="max-w-[55%]">
                        <p className="text-white text-lg font-bold leading-snug">{viewTarget.title}</p>
                        {viewTarget.description && (
                          <p className="text-white/75 text-sm mt-1.5 line-clamp-2 leading-relaxed">{viewTarget.description}</p>
                        )}
                        <button className="mt-3 bg-white text-black text-xs font-bold px-5 py-2 rounded-full shadow-lg hover:bg-white/90 transition-colors">
                          {viewTarget.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-end px-6 py-4 border-t border-border bg-card">
              <button
                onClick={() => { setViewTarget(null); setEditTarget(viewTarget); setModalOpen(true); }}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Edit Banner
              </button>
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      <AddBannerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        editBanner={editTarget}
        nextPriority={nextPriority}
      />

      <AlertDialog open={!!deactivateTarget} onOpenChange={v => { if (!v) setDeactivateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "<strong>{deactivateTarget?.title}</strong>"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) handleToggleActive(deactivateTarget);
                setDeactivateTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout >
  );
}
