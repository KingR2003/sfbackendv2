import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Calendar, Check, ChevronsUpDown, MapPin, User, Activity, ShoppingBag, RefreshCw, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalyticsFilters {
    startDate: string;
    endDate: string;
    products: Record<string, boolean>;
    gender: string;
    ageRange: string;
    location: string;
    orderStatus: string;
}

import { mockProducts } from "@/data/mockData";

interface AnalyticsSidebarProps {
    onGenerateReport: (filters: AnalyticsFilters) => void;
    onResetFilters: () => void;
}

const QUICK_DATES = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "3m", days: 90 },
    { label: "1y", days: 365 },
];

const sectionClass = "space-y-3";
const labelClass = "flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide";

export function AnalyticsSidebar({ onGenerateReport, onResetFilters }: AnalyticsSidebarProps) {
    const initialProductsState: Record<string, boolean> = {};
    mockProducts.forEach(p => { initialProductsState[p.id.toString()] = false; });

    const [filters, setFilters] = useState<AnalyticsFilters>({
        startDate: "",
        endDate: "",
        products: initialProductsState,
        gender: "all",
        ageRange: "all",
        location: "all",
        orderStatus: "all",
    });

    const selectedCount = Object.values(filters.products).filter(Boolean).length;

    const setQuickDate = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
        }));
    };

    const resetAll = () => {
        setFilters({
            startDate: "",
            endDate: "",
            products: initialProductsState,
            gender: "all",
            ageRange: "all",
            location: "all",
            orderStatus: "all",
        });
        onResetFilters();
    };

    return (
        <div className="flex flex-col gap-5">

            {/* Date Range */}
            <div className={sectionClass}>
                <p className={labelClass}><Calendar className="w-3.5 h-3.5 text-primary" />Date Range</p>
                {/* Quick shortcuts */}
                <div className="flex gap-1.5">
                    {QUICK_DATES.map(({ label, days }) => (
                        <button
                            key={label}
                            onClick={() => setQuickDate(days)}
                            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/50 transition-all"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">From</Label>
                        <Input
                            type="date"
                            className="text-xs h-9"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">To</Label>
                        <Input
                            type="date"
                            className="text-xs h-9"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-border/40" />

            {/* Products */}
            <div className={sectionClass}>
                <p className={labelClass}><ShoppingBag className="w-3.5 h-3.5 text-primary" />Products</p>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-xs font-medium">
                            {selectedCount > 0 ? `${selectedCount} product${selectedCount > 1 ? "s" : ""} selected` : "All products"}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search products…" className="text-xs" />
                            <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                    {mockProducts.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            onSelect={() =>
                                                setFilters(prev => ({
                                                    ...prev,
                                                    products: { ...prev.products, [product.id.toString()]: !prev.products[product.id.toString()] },
                                                }))
                                            }
                                            className="text-xs"
                                        >
                                            <Check className={cn("mr-2 h-3.5 w-3.5", filters.products[product.id.toString()] ? "opacity-100" : "opacity-0")} />
                                            <span className="truncate">{product.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {/* Selected chips */}
                {selectedCount > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(filters.products).filter(([, v]) => v).map(([key]) => {
                            const p = mockProducts.find(mp => mp.id.toString() === key);
                            return p ? (
                                <span key={key} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                    {p.name}
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, products: { ...prev.products, [key]: false } }))}
                                        className="ml-0.5 hover:text-primary/60"
                                    >×</button>
                                </span>
                            ) : null;
                        })}
                    </div>
                )}
            </div>

            <div className="border-t border-border/40" />

            {/* Gender */}
            <div className={sectionClass}>
                <p className={labelClass}><User className="w-3.5 h-3.5 text-primary" />Gender</p>
                <Select value={filters.gender} onValueChange={(val) => setFilters({ ...filters, gender: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Age */}
            <div className={sectionClass}>
                <p className={labelClass}><Activity className="w-3.5 h-3.5 text-primary" />Age Range</p>
                <Select value={filters.ageRange} onValueChange={(val) => setFilters({ ...filters, ageRange: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="18-24">18–24</SelectItem>
                        <SelectItem value="25-34">25–34</SelectItem>
                        <SelectItem value="35-44">35–44</SelectItem>
                        <SelectItem value="45+">45+</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className={sectionClass}>
                <p className={labelClass}><MapPin className="w-3.5 h-3.5 text-primary" />Location</p>
                <Select value={filters.location} onValueChange={(val) => setFilters({ ...filters, location: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="north">North India</SelectItem>
                        <SelectItem value="south">South India</SelectItem>
                        <SelectItem value="east">East India</SelectItem>
                        <SelectItem value="west">West India</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Order Status */}
            <div className={sectionClass}>
                <p className={labelClass}><BarChart2 className="w-3.5 h-3.5 text-primary" />Order Status</p>
                <Select value={filters.orderStatus} onValueChange={(val) => setFilters({ ...filters, orderStatus: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
                <Button
                    onClick={() => onGenerateReport(filters)}
                    className="w-full bg-primary hover:bg-primary/90 h-10 text-sm font-semibold"
                >
                    Generate Report
                </Button>
                <button
                    onClick={resetAll}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                    <RefreshCw className="w-3 h-3" />
                    Reset all filters
                </button>
            </div>
        </div>
    );
}
