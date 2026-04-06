import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion } from "framer-motion";
import { Plus, Ticket, Check, Flame, Search, Pencil, Filter, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCoupons, createCoupon, updateCoupon, type CouponResponse } from "@/lib/api";
import { DateTimePicker } from "@/components/banners/DateTimePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Coupons = () => {
  const { toast } = useToast();
  const [showPanel, setShowPanel] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<"All" | "Active" | "Inactive" | "Expired" | "Percentage" | "Flat" | "Available">("All");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deactivateCouponTarget, setDeactivateCouponTarget] = useState<CouponResponse | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await getCoupons();
      const sortedData = [...data].sort((a, b) => Number(b.id) - Number(a.id));
      console.log("FETCHED COUPONS DATA:", JSON.stringify(sortedData, null, 2));
      setCoupons(sortedData);
    } catch (error: any) {
      toast({
        title: "Error fetching coupons",
        description: error.message || "Failed to load coupons from server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState("Percentage");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formPlatform, setFormPlatform] = useState("");
  // New fields
  const [formMaxDiscount, setFormMaxDiscount] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  // Days of week
  const daysOfWeekOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<string[]>([]);

  const itemsPerPage = 10;

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const filteredCoupons = coupons.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (c.code || "").toLowerCase().includes(term) ||
      (c.discountType || "").toLowerCase().includes(term);

    const isActive = c.isActive;
    const isOver = isExpired(c.expireDate);

    if (filterType === "Active") {
      return matchesSearch && isActive && !isOver;
    } else if (filterType === "Inactive") {
      return matchesSearch && !isActive;
    } else if (filterType === "Expired") {
      return matchesSearch && isOver;
    } else if (filterType === "Percentage") {
      return matchesSearch && c.discountType === "Percentage";
    } else if (filterType === "Flat") {
      return matchesSearch && c.discountType === "Flat";
    } else if (filterType === "Available") {
      return matchesSearch && !isOver;
    }
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "AZ") return (a.code || "").localeCompare(b.code || "");
    if (sortBy === "ZA") return (b.code || "").localeCompare(a.code || "");
    if (sortBy === "Oldest") return Number(a.id) - Number(b.id);
    return Number(b.id) - Number(a.id);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (coupon: CouponResponse) => {
    setSelectedCoupon(coupon);
    setFormCode(coupon.code || "");
    setFormType(coupon.discountType || "Percentage");
    setFormValue(coupon.discountValue ? coupon.discountValue.toString() : "");
    setFormMinOrder(coupon.minOrderAmount ? coupon.minOrderAmount.toString() : "");
    setFormUsageLimit(coupon.usageLimitPerUser ? coupon.usageLimitPerUser.toString() : "");
    setFormActive(!!coupon.isActive);
    setFormPlatform(coupon.platform || "App & Web");
    setFormDaysOfWeek(coupon.daysOfWeek ? coupon.daysOfWeek.split(',') : []);
    setFormMaxDiscount(coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : "");
    const formatIsoForPicker = (datePart: string | null | undefined, timePart: string | null | undefined) => {
      if (!timePart || timePart === "000000" || timePart === "00:00:00" || timePart === "00:00:00.000000" || timePart.startsWith("0000-")) return "";

      const timeMatch = timePart.match(/^(\d{2}):(\d{2})/);
      if (!timeMatch) return "";

      let d = new Date();
      if (datePart && !datePart.startsWith("0000-")) {
        const pd = new Date(datePart);
        if (!isNaN(pd.getTime())) {
          d = pd;
        }
      }

      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${timeMatch[1]}:${timeMatch[2]}`;
    };

    setFormStartTime(formatIsoForPicker(coupon.startDate, coupon.startTime));
    setFormEndTime(formatIsoForPicker(coupon.expireDate, coupon.endTime));
    setShowPanel(true);
  };

  const handleCreateClick = () => {
    setSelectedCoupon(null);
    setFormCode("");
    setFormType("Percentage");
    setFormValue("");
    setFormMinOrder("");
    setFormUsageLimit("");
    setFormActive(true);
    setFormPlatform("");
    setFormMaxDiscount("");
    setFormStartTime("");
    setFormEndTime("");
    setFormDaysOfWeek([]);
    setShowPanel(true);
  };

  const handleStatClick = (type: "All" | "Active" | "Expired") => {
    if (filterType === type) {
      setFilterType("All");
    } else {
      setFilterType(type);
    }
  };

  const handleToggleStatus = async (coupon: CouponResponse) => {
    const nextActive = !coupon.isActive;
    try {
      const payload = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        usageLimitPerUser: coupon.usageLimitPerUser,
        daysOfWeek: coupon.daysOfWeek,
        startTime: coupon.startTime,
        endTime: coupon.endTime,
        isActive: nextActive,
        platform: coupon.platform
      };
      await updateCoupon(coupon.id, payload);
      toast({
        title: "Status Updated",
        description: `Coupon ${coupon.code} is now ${nextActive ? 'Active' : 'Inactive'}.`,
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleSaveCoupon = async () => {
    if (!formCode.trim()) {
      toast({
        title: "Error",
        description: "Coupon code is required!",
        variant: "destructive",
      });
      return;
    }

    // Validation: block update if any required field is blank
    const requiredFields = [
      formCode,
      formType,
      formValue,
      formMinOrder,
      formMaxDiscount,
      formUsageLimit,
      formPlatform,
      formStartTime,
      formEndTime,
    ];
    // No error toast, just block update button if any required field is blank
    setIsSaving(true);
    try {
      const payload = {
        code: formCode,
        discountType: formType,
        discountValue: parseFloat(formValue) || 0,
        minOrderAmount: parseFloat(formMinOrder) || 0,
        maxDiscountAmount: formMaxDiscount ? parseFloat(formMaxDiscount) : null,
        usageLimitPerUser: parseInt(formUsageLimit) || 1,
        daysOfWeek: formDaysOfWeek.length > 0 ? formDaysOfWeek.join(',') : null,
        startDate: formStartTime ? (formStartTime + ':00') : null,
        startTime: formStartTime ? (formStartTime.split('T')[1] + ':00') : null,
        expireDate: formEndTime ? (formEndTime + ':00') : null,
        endTime: formEndTime ? (formEndTime.split('T')[1] + ':00') : null,
        isActive: formActive,
        platform: formPlatform
      };

      if (selectedCoupon) {
        // Update existing coupon
        await updateCoupon(selectedCoupon.id, payload);
        toast({
          title: "Success",
          description: `Coupon "${formCode}" has been updated successfully!`,
        });
      } else {
        // Create new coupon
        await createCoupon(payload);
        toast({
          title: "Success",
          description: `Coupon "${formCode}" has been created successfully!`,
        });
      }
      setShowPanel(false);
      setSelectedCoupon(null);
      fetchCoupons(); // Refresh list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save coupon",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 mt-4">
        <GlassCard className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${filterType === 'All' ? 'ring-2 ring-purple-500/50' : ''}`} onClick={() => handleStatClick("All")}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Coupons</p>
              <p className="text-xl font-bold text-foreground">{coupons.length}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleCreateClick(); }}
            className="w-10 h-10 rounded-full gradient-green flex items-center justify-center text-primary-foreground shadow-lg green-glow">
            <Plus className="w-5 h-5" />
          </motion.button>
        </GlassCard>

        <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterType === 'Active' ? 'ring-2 ring-green-500/50' : ''}`} onClick={() => handleStatClick("Active")}>
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Coupons</p>
            <p className="text-xl font-bold text-foreground">{coupons.filter(c => c.isActive && !isExpired(c.expireDate)).length}</p>
          </div>
        </GlassCard>

        <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterType === 'Expired' ? 'ring-2 ring-red-500/50' : ''}`} onClick={() => handleStatClick("Expired")}>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expired Coupons</p>
            <p className="text-xl font-bold text-foreground">{coupons.filter(c => isExpired(c.expireDate)).length}</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search Bar */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); }}
                placeholder="Search coupons..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-muted/40 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>
            {/* Filter Dropdown */}
            <div className="flex items-center gap-3 md:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/40 text-foreground hover:bg-muted transition-all border border-border">
                    <Filter className="w-3.5 h-3.5" />
                    {filterType !== "All" || sortBy !== "Newest" ? "Filtered" : "All"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border bg-card shadow-elevated p-1">
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                  </div>
                  {([
                    { label: "All Coupons", value: "All" },
                    { label: "Active Only", value: "Active" },
                    { label: "Inactive Only", value: "Inactive" },
                    { label: "Expired Only", value: "Expired" },
                    { label: "Percentage Discount", value: "Percentage" },
                    { label: "Flat Discount", value: "Flat" },
                    { label: "Available", value: "Available" },
                  ] as { label: string; value: "All" | "Active" | "Inactive" | "Expired" | "Percentage" | "Flat" | "Available" }[]).map((f) => (
                    <DropdownMenuCheckboxItem
                      key={f.value}
                      checked={filterType === f.value}
                      onCheckedChange={() => { setFilterType(f.value); setCurrentPage(1); }}
                      className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                    >
                      {f.label}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator className="my-1 opacity-50" />
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort By</p>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { label: "Newest First", value: "Newest" },
                      { label: "Oldest First", value: "Oldest" },
                      { label: "A-Z", value: "AZ" },
                      { label: "Z-A", value: "ZA" }
                    ].map((s) => (
                      <DropdownMenuCheckboxItem
                        key={s.value}
                        checked={sortBy === s.value}
                        onCheckedChange={() => { setSortBy(s.value); setCurrentPage(1); }}
                        className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                      >
                        {s.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {(filterType !== "All" || sortBy !== "Newest") && (
                <button
                  onClick={() => { setFilterType("All"); setSortBy("Newest"); setCurrentPage(1); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left py-4 px-5 font-medium">Code</th>
                <th className="text-left py-4 px-5 font-medium">Type</th>
                <th className="text-left py-4 px-5 font-medium">Value</th>
                <th className="text-left py-4 px-5 font-medium">Min Order</th>
                <th className="text-left py-4 px-5 font-medium">Platform</th>
                <th className="text-left py-4 px-5 font-medium">Expiry</th>
                <th className="text-left py-4 px-5 font-medium">Usage</th>
                <th className="text-left py-4 px-5 font-medium">Status</th>
                <th className="text-left py-4 px-5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading coupons...
                  </td>
                </tr>
              ) : paginatedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                paginatedCoupons.map((c) => (
                  <motion.tr
                    key={c.id}
                    whileHover={{ backgroundColor: "hsla(130, 85%, 45%, 0.04)" }}
                    className={`border-b border-border/50 transition-colors cursor-pointer ${c.isActive ? '' : 'opacity-70'}`}
                    onClick={() => handleRowClick(c)}
                  >
                    <td className="py-3.5 px-5"><span className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-sm font-mono font-bold">{c.code}</span></td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">{c.discountType}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-foreground">
                      {c.discountType === 'Percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">₹{c.minOrderAmount}</td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.platform === 'App & Web' ? 'bg-purple-500/10 text-purple-500' : c.platform === 'App' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {c.platform || "Platform"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground lg:min-w-32">{c.expireDate ? new Date(c.expireDate).toLocaleDateString() : '-'}</td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">{c.usageLimitPerUser || '-'}</td>
                    <td className="py-3.5 px-5">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={c.isActive}
                          onCheckedChange={() => {
                            if (c.isActive) {
                              setDeactivateCouponTarget(c);
                            } else {
                              handleToggleStatus(c);
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowClick(c); }}
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors"
                          title="Edit Coupon"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/10">
          <span className="text-xs text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCoupons.length)} of {filteredCoupons.length} entries</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
              Previous
            </button>
            <span className="text-xs font-medium text-foreground">Page {currentPage} of {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Centered Modal */}
      {
        showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPanel(false)} />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-strong shadow-elevated relative z-10 w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">{selectedCoupon ? "Coupon Details" : "Create Coupon"}</h2>
                <button
                  onClick={() => setShowPanel(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Coupon Code</label><input value={formCode} onChange={(e) => setFormCode(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono" placeholder="e.g. FRESH20" /></div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount Type</label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none hover:bg-muted focus:ring-2 focus:ring-primary/30 min-h-[42px] h-auto">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="z-[200] rounded-xl border border-border bg-card shadow-elevated p-1">
                      <SelectItem value="Percentage" className="rounded-lg cursor-pointer">Percentage</SelectItem>
                      <SelectItem value="Flat" className="rounded-lg cursor-pointer">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Days of Week</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger type="button" className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30">
                        <span className="truncate flex-1 text-left">
                          {formDaysOfWeek.length > 0 ? formDaysOfWeek.join(", ") : "Select Days"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="z-[200] w-56 rounded-xl border border-border bg-card shadow-elevated p-1">
                        {daysOfWeekOptions.map(day => (
                          <DropdownMenuCheckboxItem
                            key={day}
                            checked={formDaysOfWeek.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormDaysOfWeek([...formDaysOfWeek, day]);
                              } else {
                                setFormDaysOfWeek(formDaysOfWeek.filter(d => d !== day));
                              }
                            }}
                            className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                          >
                            {day}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount Value</label><input value={formValue} onChange={(e) => setFormValue(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Minimum Order (₹)</label><input value={formMinOrder} onChange={(e) => setFormMinOrder(e.target.value)} type="number" className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Discount Amount</label><input value={formMaxDiscount} onChange={e => setFormMaxDiscount(e.target.value)} type="number" className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Usage Limit</label><input value={formUsageLimit} onChange={(e) => setFormUsageLimit(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Time</label>
                    <DateTimePicker value={formStartTime} onChange={v => setFormStartTime(v)} placeholder="Pick start & time" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Time</label>
                    <DateTimePicker value={formEndTime} onChange={v => setFormEndTime(v)} placeholder="Pick end date & time" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</label>
                  <Select value={formPlatform} onValueChange={setFormPlatform}>
                    <SelectTrigger className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none hover:bg-muted focus:ring-2 focus:ring-primary/30 min-h-[42px] h-auto">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="z-[200] rounded-xl border border-border bg-card shadow-elevated p-1">
                      <SelectItem value="App & Web" className="rounded-lg cursor-pointer">App & Web</SelectItem>
                      <SelectItem value="App" className="rounded-lg cursor-pointer">App</SelectItem>
                      <SelectItem value="Website" className="rounded-lg cursor-pointer">Website</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowPanel(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <motion.button
                  onClick={handleSaveCoupon}
                  disabled={isSaving || [
                    formCode,
                    formType,
                    formValue,
                    formMinOrder,
                    formMaxDiscount,
                    formUsageLimit,
                    formPlatform,
                    formStartTime,
                    formEndTime
                  ].some(f => !f || f.toString().trim() === "") || formDaysOfWeek.length === 0}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm disabled:opacity-75 flex items-center justify-center"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedCoupon ? "Update" : "Create")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )
      }

      <AlertDialog open={!!deactivateCouponTarget} onOpenChange={v => { if (!v) setDeactivateCouponTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "<strong>{deactivateCouponTarget?.code}</strong>"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateCouponTarget) {
                  handleToggleStatus(deactivateCouponTarget);
                }
                setDeactivateCouponTarget(null);
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
};

export default Coupons;
