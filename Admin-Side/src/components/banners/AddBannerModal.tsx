import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, Monitor, Tablet, Smartphone, ImageIcon, Smartphone as AppIcon, Globe, Layers, Trash2 } from "lucide-react";
import { DateTimePicker } from "./DateTimePicker";
import { cn } from "@/lib/utils";
import {
  Banner, BannerPlatform, BannerCampaign, BannerGender,
  BannerAgeGroup, BannerRedirect,
  CAMPAIGN_OPTIONS, PLATFORM_OPTIONS, GENDER_OPTIONS,
  AGE_OPTIONS, REDIRECT_OPTIONS, CTA_OPTIONS, computeStatus,
} from "./bannerTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (banner: any, file: File | null) => void;
  onDelete?: () => void;
  editBanner?: Banner | null;
  nextPriority: number;
}

function normalizeBannerFormData(banner: Banner, nextPriority: number) {
  const redirectValue = banner.redirectPage;
  const isKnownRedirect = REDIRECT_OPTIONS.includes(redirectValue as BannerRedirect);
  const rawGender = banner.gender as unknown as string;
  const normalizedGender: BannerGender =
    rawGender === "All" ? "All"
      : rawGender === "Men" ? "Male"
      : rawGender === "Women" ? "Female"
      : rawGender === "All Users" ? "All"
      : (rawGender as BannerGender);

  return {
    ...banner,
    gender: normalizedGender,
    redirectPage: (isKnownRedirect ? redirectValue : "Custom Page") as BannerRedirect,
    customPageUrl: isKnownRedirect ? "" : (redirectValue || ""),
    customButtonText: "",
    priority: banner.priority || nextPriority,
  };
}

const EMPTY_FORM = (priority: number) => ({
  title: "",
  description: "",
  imageUrl: null as string | null,
  platform: "Both" as BannerPlatform,
  gender: "All" as BannerGender,
  ageGroup: "All Ages" as BannerAgeGroup,
  campaign: "Festival" as BannerCampaign,
  buttonText: "Shop Now",
  customButtonText: "",
  redirectPage: "Honey" as BannerRedirect,
  customPageUrl: "",
  priority,
  startDate: "",
  endDate: "",
  active: true,
});

// ── Platform icon helper ───────────────────────────────────────────────────
const PLATFORM_ICONS: Record<BannerPlatform, React.ElementType> = {
  App: AppIcon,
  Website: Globe,
  Both: Layers,
};
const PLATFORM_LABELS: Record<BannerPlatform, string> = {
  App: "Mobile App",
  Website: "Website",
  Both: "App & Website",
};

export function AddBannerModal({ open, onClose, onSave, onDelete, editBanner, nextPriority }: Props) {
  const [form, setForm] = useState(() =>
    editBanner
      ? normalizeBannerFormData(editBanner, nextPriority)
      : EMPTY_FORM(nextPriority)
  );
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback((b?: Banner | null) => {
    setForm(b ? normalizeBannerFormData(b, nextPriority) : EMPTY_FORM(nextPriority));
    setSelectedFile(null);
    setErrors({});
  }, [nextPriority]);

  useEffect(() => {
    if (open) resetForm(editBanner ?? null);
  }, [open, editBanner, resetForm]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleImage = (file: File) => {
    setSelectedFile(file);
    // Read as base64 for LOCAL PREVIEW ONLY — not sent to backend
    const reader = new FileReader();
    reader.onload = e => set("imageUrl", e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate >= form.endDate)
      e.endDate = "End date must be after start date";
    if (form.redirectPage === "Custom Page" && !form.customPageUrl.trim())
      e.customPageUrl = "Custom page URL is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const finalButtonText = form.buttonText === "Custom" && form.customButtonText.trim()
      ? form.customButtonText.trim()
      : form.buttonText;

    const finalRedirect = form.redirectPage === "Custom Page"
      ? form.customPageUrl.trim()
      : form.redirectPage;

    const { id: _id, status: _st, analytics: _an, createdAt: _cr,
      customButtonText: _cbt, customPageUrl: _cpu, ...rest } = form as any;

    onSave({ ...rest, buttonText: finalButtonText, redirectPage: finalRedirect }, selectedFile);
    resetForm(null);
    onClose();
  };

  const audience = form.gender === "All" && form.ageGroup === "All Ages"
    ? "All"
    : form.ageGroup === "All Ages"
      ? form.gender
      : `${form.gender} ${form.ageGroup}`;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { resetForm(null); onClose(); } }}>
      {/*
        ┌─────────────────────────────────────────────┐
        │ Fixed header                                │
        ├─────────────────────────────────────────────┤
        │ Scrollable body                             │
        ├─────────────────────────────────────────────┤
        │ Fixed footer                                │
        └─────────────────────────────────────────────┘
      */}
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 bg-card border border-border overflow-hidden">

        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card z-10">
          <h2 className="text-lg font-semibold text-foreground">
            {editBanner ? "Edit Banner" : "Add New Banner"}
          </h2>
          <button
            onClick={() => { resetForm(null); onClose(); }}
            className="rounded-full w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Banner Image ── */}
          <div className="space-y-3">
            {/* Preview area */}
            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border h-44 group shadow-sm">
                <img src={form.imageUrl} alt="banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <button
                  onClick={() => { setSelectedFile(null); set("imageUrl", null); }}
                  className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all duration-200 shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] text-white/80 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5">Click × to remove</span>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith("image/")) handleImage(file);
                }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "group border-2 border-dashed rounded-xl h-44 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden",
                  dragOver
                    ? "border-primary bg-gradient-to-br from-primary/12 to-primary/4 scale-[1.005]"
                    : "border-border/60 hover:border-primary/70 hover:bg-gradient-to-br hover:from-primary/6 hover:to-primary/2"
                )}
              >
                <span className={cn("absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-2xl transition-all duration-300", dragOver ? "border-primary w-8 h-8" : "border-transparent group-hover:border-primary/60")} />
                <span className={cn("absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-2xl transition-all duration-300", dragOver ? "border-primary w-8 h-8" : "border-transparent group-hover:border-primary/60")} />
                <span className={cn("absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-2xl transition-all duration-300", dragOver ? "border-primary w-8 h-8" : "border-transparent group-hover:border-primary/60")} />
                <span className={cn("absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-2xl transition-all duration-300", dragOver ? "border-primary w-8 h-8" : "border-transparent group-hover:border-primary/60")} />

                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300",
                  dragOver ? "bg-primary/20 scale-110 rotate-3" : "bg-muted/60 group-hover:bg-primary/10 group-hover:scale-105"
                )}>
                  <Upload className={cn("w-6 h-6 transition-colors duration-300", dragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                </div>
                <p className={cn("text-sm font-semibold transition-colors duration-300", dragOver ? "text-primary" : "text-foreground")}>
                  {dragOver ? "Release to upload" : "Drag & drop to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">or <span className="text-primary font-medium group-hover:underline">browse files</span></p>
                <p className="text-[11px] text-muted-foreground/50 mt-2.5">1200 × 400 px · JPG, PNG, WebP</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />
          </div>

          {/* ── Banner Details ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input id="title" placeholder="e.g. Women's Day Special"
                  value={form.title} onChange={e => set("title", e.target.value)}
                  className={cn(errors.title && "border-destructive")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Campaign Type</Label>
                <Select value={form.campaign} onValueChange={v => set("campaign", v as BannerCampaign)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
              <Textarea id="desc" placeholder="Celebrate Women's Day with pure organic honey."
                rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>

          {/* ── Display On ── */}
          <div className="space-y-2.5">
            <RadioGroup
              value={form.platform}
              onValueChange={v => set("platform", v as BannerPlatform)}
              className="flex flex-wrap gap-3"
            >
              {PLATFORM_OPTIONS.map(p => {
                const Icon = PLATFORM_ICONS[p];
                const isSelected = form.platform === p;
                return (
                  <label
                    key={p}
                    htmlFor={`platform-${p}`}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none",
                      isSelected
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <RadioGroupItem value={p} id={`platform-${p}`} className="sr-only" />
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{PLATFORM_LABELS[p]}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* ── Target Audience ── */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Gender</Label>
                <Select value={form.gender} onValueChange={v => set("gender", v as BannerGender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Age Group</Label>
                <Select value={form.ageGroup} onValueChange={v => set("ageGroup", v as BannerAgeGroup)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.ageGroup !== "All Ages" && (
              <p className="text-xs text-muted-foreground">
                Targeting: <span className="text-foreground font-medium">{audience}</span>
              </p>
            )}
          </div>

          {/* ── Action / CTA ── */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Button Text</Label>
                <Select
                  value={CTA_OPTIONS.includes(form.buttonText) ? form.buttonText : "Custom"}
                  onValueChange={v => {
                    set("buttonText", v);
                    if (v !== "Custom") set("customButtonText", "");
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CTA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="Custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {(form.buttonText === "Custom" || !CTA_OPTIONS.includes(form.buttonText)) && (
                  <Input
                    placeholder="Enter custom button text"
                    value={form.customButtonText}
                    onChange={e => set("customButtonText", e.target.value)}
                    className="mt-1.5"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Redirect To</Label>
                <Select value={form.redirectPage} onValueChange={v => set("redirectPage", v as BannerRedirect)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REDIRECT_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.redirectPage === "Custom Page" && (
                  <div className="mt-1.5 space-y-1">
                    <Input
                      placeholder="https://svasthyafresh.com/offer"
                      value={form.customPageUrl}
                      onChange={e => set("customPageUrl", e.target.value)}
                      className={cn(errors.customPageUrl && "border-destructive")}
                    />
                    {errors.customPageUrl && (
                      <p className="text-xs text-destructive">{errors.customPageUrl}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Schedule ── */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <DateTimePicker
                  value={form.startDate}
                  onChange={v => set("startDate", v)}
                  placeholder="Pick start date & time"
                  error={!!errors.startDate}
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  End Date & Time <span className="text-destructive">*</span>
                </Label>
                <DateTimePicker
                  value={form.endDate}
                  onChange={v => set("endDate", v)}
                  placeholder="Pick end date & time"
                  error={!!errors.endDate}
                />
                {errors.endDate && (
                  <p className="text-xs text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Settings ── */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Priority</Label>
                <Input
                  type="number"
                  min={1}
                  max={nextPriority}
                  value={form.priority}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1) set("priority", Math.min(v, nextPriority));
                  }}
                />
                <p className="text-[11px] text-muted-foreground">1 = highest. Max: {nextPriority}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Visibility</Label>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 h-10">
                  <p className="text-sm text-foreground">Active</p>
                  <Switch checked={form.active} onCheckedChange={v => set("active", v)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Live Preview ── */}
          <div className="space-y-2.5">
            <Tabs defaultValue="mobile">
              <TabsList className="mb-3">
                <TabsTrigger value="mobile" className="gap-1.5"><Smartphone className="w-3.5 h-3.5" />Mobile</TabsTrigger>
                <TabsTrigger value="tablet" className="gap-1.5"><Tablet className="w-3.5 h-3.5" />Tablet</TabsTrigger>
                <TabsTrigger value="desktop" className="gap-1.5"><Monitor className="w-3.5 h-3.5" />Desktop</TabsTrigger>
              </TabsList>
              {[
                { key: "mobile", width: "max-w-[320px]", ratio: "aspect-[2/1]", textSize: "text-xs", btn: "text-[10px] px-2 py-1" },
                { key: "tablet", width: "max-w-[500px]", ratio: "aspect-[2.5/1]", textSize: "text-sm", btn: "text-xs px-3 py-1.5" },
                { key: "desktop", width: "max-w-full", ratio: "aspect-[3/1]", textSize: "text-base", btn: "text-sm px-4 py-2" },
              ].map(({ key, width, ratio, textSize, btn }) => (
                <TabsContent key={key} value={key}>
                  <div className={cn("mx-auto", width)}>
                    <div className={cn(
                      "relative rounded-xl overflow-hidden border border-border bg-gradient-to-r from-primary/20 to-primary/5",
                      ratio
                    )}>
                      {form.imageUrl
                        ? <img src={form.imageUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                        : <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      }
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 gap-1">
                        <p className={cn("font-bold text-white truncate", textSize)}>
                          {form.title || "Banner Title"}
                        </p>
                        <p className={cn("text-white/80 truncate", textSize === "text-base" ? "text-sm" : "text-[10px]")}>
                          {form.description || "Banner description goes here"}
                        </p>
                        <button className={cn("mt-1 self-start rounded-lg bg-primary text-white font-semibold", btn)}>
                          {form.buttonText === "Custom" && form.customButtonText.trim()
                            ? form.customButtonText
                            : form.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card">
          <div>
            {editBanner && onDelete && (
              <Button variant="ghost" onClick={onDelete}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" /> Delete Banner
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => { resetForm(null); onClose(); }}>Cancel</Button>
            <Button onClick={handleSave} className="gradient-green text-white px-6">
              {editBanner ? "Save Changes" : "Create Banner"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

