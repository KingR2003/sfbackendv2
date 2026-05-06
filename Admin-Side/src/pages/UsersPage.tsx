import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motion } from "framer-motion";
import { Search, Mail, MapPin, Calendar, User, CheckCircle, XCircle, ShoppingCart, Package, Eye, Users as UsersIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getUsers, updateUser, updateUserStatus, getUserAddresses, getUserCart, getUserOrders, type UserResponse, type UserAddress } from "@/lib/api";
import type { AdminOrder } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/banners/DateTimePicker";

type AppUser = UserResponse;
type AgeGroup = "All" | "18-25" | "26-35" | "36-45" | "46+";

function formatDateTime(raw: string): { date: string; time: string } {
    if (!raw) return { date: "—", time: "" };
    try {
        // Only show time if the raw value actually contains time info
        const hasTime = raw.includes("T") || /\d{2}:\d{2}/.test(raw);
        const d = new Date(raw);
        if (isNaN(d.getTime())) return { date: raw, time: "" };
        const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const time = hasTime ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
        return { date, time };
    } catch {
        return { date: raw, time: "" };
    }
}

// Mock Data for Users
const mockUsers: AppUser[] = [
    { id: 1, name: "Rahul Sharma", email: "rahul.s@example.com", mobile: "9876543210", gender: "Male", dob: "1990-05-15", addresses: [{ type: "Home", addressLine: "Mumbai, Maharashtra" }], joiningDate: "2024-01-15", status: "Active", image: "" },
    { id: 2, name: "Priya Patel", email: "priya.p@example.com", mobile: "9876543211", gender: "Female", dob: "1992-08-22", addresses: [{ type: "Work", addressLine: "Ahmedabad, Gujarat" }], joiningDate: "2024-02-20", status: "Active", image: "" },
    { id: 3, name: "Amit Kumar", email: "amit.k@example.com", mobile: "9876543212", gender: "Male", dob: "1988-11-30", addresses: [{ type: "Home", addressLine: "Delhi, New Delhi" }], joiningDate: "2023-11-05", status: "Inactive", image: "" },
    { id: 4, name: "Sneha Gupta", email: "sneha.g@example.com", mobile: "9876543213", gender: "Female", dob: "1995-02-14", addresses: [{ type: "Home", addressLine: "Bangalore, Karnataka" }], joiningDate: "2024-03-10", status: "Active", image: "" },
    { id: 5, name: "Vikram Singh", email: "vikram.s@example.com", mobile: "9876543214", gender: "Male", dob: "1985-07-25", addresses: [{ type: "Other", addressLine: "Jaipur, Rajasthan" }], joiningDate: "2023-12-01", status: "Active", image: "" },
];

const Users = () => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive" | "Blocked">("All");
    const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "AZ" | "ZA">("Newest");
    const [filterGender, setFilterGender] = useState<"All" | "Male" | "Female" | "Others">("All");
    const [filterJoiningFrom, setFilterJoiningFrom] = useState("");
    const [filterJoiningTo, setFilterJoiningTo] = useState("");
    const [filterAgeGroup, setFilterAgeGroup] = useState<AgeGroup>("All");
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
    const [draftStatus, setDraftStatus] = useState<"All" | "Active" | "Inactive" | "Blocked">("All");
    const [draftJoiningFrom, setDraftJoiningFrom] = useState("");
    const [draftJoiningTo, setDraftJoiningTo] = useState("");
    const [draftAgeGroup, setDraftAgeGroup] = useState<AgeGroup>("All");
    const [showPanel, setShowPanel] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [users, setUsers] = useState(mockUsers);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    // Form state
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formMobile, setFormMobile] = useState("");
    const [formGender, setFormGender] = useState("");
    const [formDob, setFormDob] = useState("");
    const [formAddresses, setFormAddresses] = useState<UserAddress[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [userCart, setUserCart] = useState<any[]>([]);
    const [isLoadingCart, setIsLoadingCart] = useState(false);
    const [userOrders, setUserOrders] = useState<AdminOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [formStatus, setFormStatus] = useState("Active");
    const [formImage, setFormImage] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoadingUsers(true);
                const response = await getUsers();
                setUsers(response);
                setCurrentPage(1);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                setUsers([]);
                toast({
                    title: "Unable to load users",
                    description: error instanceof Error ? error.message : "Failed to fetch customers from the database.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [toast]);

    const itemsPerPage = 10;

    const getNormalizedGender = (gender?: string) => (gender ?? "").trim().toLowerCase();

    const parseSafeDate = (raw?: string) => {
        if (!raw) return null;
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getAge = (dob?: string) => {
        const dateOfBirth = parseSafeDate(dob);
        if (!dateOfBirth) return null;
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const hasNotHadBirthday =
            today.getMonth() < dateOfBirth.getMonth() ||
            (today.getMonth() === dateOfBirth.getMonth() && today.getDate() < dateOfBirth.getDate());
        if (hasNotHadBirthday) age -= 1;
        return age >= 0 ? age : null;
    };

    const matchesAgeGroup = (age: number | null, group: AgeGroup) => {
        if (group === "All") return true;
        if (age === null) return false;
        if (group === "18-25") return age >= 18 && age <= 25;
        if (group === "26-35") return age >= 26 && age <= 35;
        if (group === "36-45") return age >= 36 && age <= 45;
        return age >= 46;
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (sortBy === "AZ") return a.name.localeCompare(b.name);
        if (sortBy === "ZA") return b.name.localeCompare(a.name);
        
        const dateA = parseSafeDate(a.joiningDate);
        const dateB = parseSafeDate(b.joiningDate);
        
        if (sortBy === "Oldest") {
            if (!dateA && !dateB) return Number(a.id) - Number(b.id);
            if (!dateA) return -1;
            if (!dateB) return 1;
            return dateA.getTime() - dateB.getTime();
        }
        
        // Default: Newest
        if (!dateA && !dateB) return Number(b.id) - Number(a.id);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
    });

    const filteredUsers = sortedUsers.filter(user => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term);
        const matchesStatus = filterStatus === "All" ? true : user.status === filterStatus;
        const normalizedGender = getNormalizedGender(user.gender);
        const matchesGender = filterGender === "All"
            ? true
            : filterGender === "Others"
                ? normalizedGender !== "male" && normalizedGender !== "female"
                : normalizedGender === filterGender.toLowerCase();

        const joiningDate = parseSafeDate(user.joiningDate);
        const fromDate = parseSafeDate(filterJoiningFrom);
        const toDate = parseSafeDate(filterJoiningTo);
        const matchesJoiningFrom = fromDate ? (joiningDate ? joiningDate >= fromDate : false) : true;
        const matchesJoiningTo = toDate ? (joiningDate ? joiningDate <= toDate : false) : true;

        const age = getAge(user.dob);
        const matchesAge = matchesAgeGroup(age, filterAgeGroup);

        return matchesSearch && matchesStatus && matchesGender && matchesJoiningFrom && matchesJoiningTo && matchesAge;
    });

    const getStatusVariant = (status: string) => {
        if (status === "Active") return "green";
        if (status === "Blocked") return "yellow";
        return "red";
    };

    const handleStatClick = (status: "All" | "Active" | "Inactive" | "Blocked") => {
        setCurrentPage(1);
        if (filterStatus === status) {
            setFilterStatus("All");
        } else {
            setFilterStatus(status);
        }
    };

    const handleGenderStatClick = (gender: "All" | "Male" | "Female" | "Others") => {
        setCurrentPage(1);
        if (filterGender === gender) {
            setFilterGender("All");
        } else {
            setFilterGender(gender);
        }
    };



    const handleRowClick = async (user: AppUser) => {
        setSelectedUser(user);
        setFormName(user.name);
        setFormEmail(user.email);
        setFormMobile(user.mobile ?? "");
        setFormGender(user.gender ?? "");
        setFormDob(user.dob ?? "");
        setFormAddresses(user.addresses || []);
        setFormStatus(user.status);
        setFormImage(user.image);
        setShowPanel(true);
        console.log("[handleRowClick] User object:", JSON.stringify(user, null, 2));
        console.log("[handleRowClick] Embedded addresses:", user.addresses?.length ?? 0);

        // Link duplicate/guest IDs by email or mobile to ensure complete sync
        try {
            setIsLoadingAddresses(true);
            setIsLoadingCart(true);
            setIsLoadingOrders(true);
            
            const linkedIds = [...new Set([
                user.id,
                ...users.filter(u => 
                    (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) || 
                    (u.mobile && user.mobile && String(u.mobile) === String(user.mobile))
                ).map(u => u.id)
            ])];

            const [fetchedAddresses, fetchedCart, fetchedOrders] = await Promise.all([
                (async () => {
                   let allAddr: UserAddress[] = [];
                   for (const id of linkedIds) {
                       const res = await getUserAddresses(id).catch(() => []);
                       allAddr = [...allAddr, ...res];
                   }
                   return Array.from(new Map(allAddr.map(a => [a.id, a])).values());
                })(),
                (async () => {
                   for (const id of linkedIds) {
                       const cart = await getUserCart(id).catch(() => []);
                       if (cart.length > 0) return cart;
                   }
                   return [];
                })(),
                (async () => {
                   let allOrd: AdminOrder[] = [];
                   for (const id of linkedIds) {
                       const orders = await getUserOrders(id).catch(() => []);
                       allOrd = [...allOrd, ...orders];
                   }
                   const uniqueOrders = Array.from(new Map(allOrd.map(o => [o.id, o])).values());
                   return uniqueOrders.sort((a, b) => {
                       const tA = new Date(a.date || 0).getTime();
                       const tB = new Date(b.date || 0).getTime();
                       const timeDiff = (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
                       if (timeDiff !== 0) return timeDiff;
                       return Number(b.id) - Number(a.id);
                   });
                })()
            ]);
            
            console.log("[handleRowClick] Cross-linked IDs checked:", linkedIds);
            setFormAddresses(fetchedAddresses);
            setUserCart(fetchedCart);
            setUserOrders(fetchedOrders);
        } catch (err) {
            console.warn("[handleRowClick] Data refresh failed:", err);
            setFormAddresses([]);
            setUserCart([]);
            setUserOrders([]);
        } finally {
            setIsLoadingAddresses(false);
            setIsLoadingCart(false);
            setIsLoadingOrders(false);
        }
    };

    const handleStatusChange = async (newStatus: "Active" | "Inactive" | "Blocked") => {
        if (!selectedUser) return;
        
        try {
            // Optimistic update
            setFormStatus(newStatus);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
            setSelectedUser({ ...selectedUser, status: newStatus });
            
            let payload = { status: newStatus };
            if (newStatus === "Blocked") {
                payload = { ...payload, is_blocked: true, is_active: false } as any;
            } else if (newStatus === "Inactive") {
                payload = { ...payload, is_blocked: false, is_active: false } as any;
            } else {
                payload = { ...payload, is_blocked: false, is_active: true } as any;
            }
            
            await updateUserStatus(selectedUser.id, payload);
            toast({
                title: "Status Updated",
                description: `User status changed to ${newStatus}.`,
            });
        } catch (error) {
            console.error("Failed to update status:", error);
            // Revert on failure
            setFormStatus(selectedUser.status);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: selectedUser.status } : u));
            setSelectedUser({ ...selectedUser, status: selectedUser.status });
            toast({
                title: "Update Failed",
                description: "Could not update user status.",
                variant: "destructive",
            });
        }
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const activeUsers = users.filter(u => u.status === "Active").length;
    const inactiveUsers = users.filter(u => u.status === "Inactive").length;
    const blockedUsers = users.filter(u => u.status === "Blocked").length;

    const maleUsers = users.filter(u => getNormalizedGender(u.gender) === "male").length;
    const femaleUsers = users.filter(u => getNormalizedGender(u.gender) === "female").length;
    const otherGenderUsers = users.length - maleUsers - femaleUsers;

    const openAdvancedFilterModal = () => {
        setDraftStatus(filterStatus);
        setDraftJoiningFrom(filterJoiningFrom);
        setDraftJoiningTo(filterJoiningTo);
        setDraftAgeGroup(filterAgeGroup);
        setIsAdvancedFilterOpen(true);
    };

    const applyAdvancedFilters = () => {
        setFilterStatus(draftStatus);
        setFilterJoiningFrom(draftJoiningFrom);
        setFilterJoiningTo(draftJoiningTo);
        setFilterAgeGroup(draftAgeGroup);
        setCurrentPage(1);
        setIsAdvancedFilterOpen(false);
    };

    const clearAdvancedFilters = () => {
        setDraftStatus("All");
        setDraftJoiningFrom("");
        setDraftJoiningTo("");
        setDraftAgeGroup("All");
        setFilterStatus("All");
        setFilterJoiningFrom("");
        setFilterJoiningTo("");
        setFilterAgeGroup("All");
        setCurrentPage(1);
    };

    const hasAdvancedFilters =
        filterStatus !== "All" ||
        filterJoiningFrom !== "" ||
        filterJoiningTo !== "" ||
        filterAgeGroup !== "All";

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const statusIconMap = {
        Active: CheckCircle,
        Inactive: XCircle,
        Blocked: XCircle,
    } as const;

    const getGenderMeta = (gender?: string) => {
        const normalized = getNormalizedGender(gender);
        if (normalized === "male") {
            return {
                label: "Male",
                iconClass: "text-blue-600",
                chipClass: "bg-blue-500/10 text-blue-700",
                short: "M",
                Icon: User,
            };
        }
        if (normalized === "female") {
            return {
                label: "Female",
                iconClass: "text-pink-600",
                chipClass: "bg-pink-500/10 text-pink-700",
                short: "F",
                Icon: User,
            };
        }
        return {
            label: "Others",
            iconClass: "text-violet-600",
            chipClass: "bg-violet-500/10 text-violet-700",
            short: "O",
            Icon: UsersIcon,
        };
    };

    return (
        <DashboardLayout>
            {/* Header & Stats could go here if needed, keeping it simple as per requirement */}
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 mt-4">
                <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterStatus === 'All' ? 'ring-2 ring-primary/50' : ''}`} onClick={() => handleStatClick("All")}>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                        <p className="text-xl font-bold text-foreground">{users.length}</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-4 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">User Status</p>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <button
                            onClick={() => handleStatClick("Active")}
                            className={`rounded-lg border p-2 transition-all ${filterStatus === "Active" ? "border-green-500/60 bg-green-500/10" : "border-border/60 hover:bg-muted/50"}`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                <p className="text-[10px] text-muted-foreground">Active</p>
                            </div>
                            <p className="text-base font-semibold text-green-600">{activeUsers}</p>
                        </button>
                        <button
                            onClick={() => handleStatClick("Inactive")}
                            className={`rounded-lg border p-2 transition-all ${filterStatus === "Inactive" ? "border-red-500/60 bg-red-500/10" : "border-border/60 hover:bg-muted/50"}`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                <p className="text-[10px] text-muted-foreground">Inactive</p>
                            </div>
                            <p className="text-base font-semibold text-red-600">{inactiveUsers}</p>
                        </button>
                        <button
                            onClick={() => handleStatClick("Blocked")}
                            className={`rounded-lg border p-2 transition-all ${filterStatus === "Blocked" ? "border-yellow-500/60 bg-yellow-500/10" : "border-border/60 hover:bg-muted/50"}`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-yellow-600" />
                                <p className="text-[10px] text-muted-foreground">Blocked</p>
                            </div>
                            <p className="text-base font-semibold text-yellow-600">{blockedUsers}</p>
                        </button>
                    </div>
                </GlassCard>

                <GlassCard className="p-4 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">Gender Split</p>
                        <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <button
                            onClick={() => handleGenderStatClick("Male")}
                            className={`rounded-lg border p-2 transition-all ${filterGender === "Male" ? "border-blue-500/60 bg-blue-500/10" : "border-border/60 hover:bg-muted/50"}`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <User className="w-3.5 h-3.5 text-blue-600" />
                                <p className="text-[10px] text-muted-foreground">Male</p>
                            </div>
                            <p className="text-base font-semibold text-foreground">{maleUsers}</p>
                        </button>
                        <button
                            onClick={() => handleGenderStatClick("Female")}
                            className={`rounded-lg border p-2 transition-all ${filterGender === "Female" ? "border-pink-500/60 bg-pink-500/10" : "border-border/60 hover:bg-muted/50"}`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <User className="w-3.5 h-3.5 text-pink-600" />
                                <p className="text-[10px] text-muted-foreground">Female</p>
                            </div>
                            <p className="text-base font-semibold text-foreground">{femaleUsers}</p>
                        </button>
                        <button
                            onClick={() => handleGenderStatClick("Others")}
                            className={`rounded-lg border p-2 transition-all ${filterGender === "Others" ? "border-violet-500/60 bg-violet-500/10" : "border-border/60 hover:bg-muted/50"}`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <UsersIcon className="w-3.5 h-3.5 text-violet-600" />
                                <p className="text-[10px] text-muted-foreground">Others</p>
                            </div>
                            <p className="text-base font-semibold text-foreground">{otherGenderUsers}</p>
                        </button>
                    </div>
                </GlassCard>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-border/50">
                    <SearchFilter
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterValue={filterStatus}
                        setFilterValue={(val) => setFilterStatus(val as "All" | "Active" | "Inactive" | "Blocked")}
                        filterOptions={[
                            { label: "All Status", value: "All" },
                            { label: "Active", value: "Active" },
                            { label: "Inactive", value: "Inactive" },
                            { label: "Blocked", value: "Blocked" }
                        ]}
                        sortValue={sortBy}
                        setSortValue={(val) => { setSortBy(val as any); setCurrentPage(1); }}
                        sortOptions={[
                            { label: "Newest First", value: "Newest" },
                            { label: "Oldest First", value: "Oldest" },
                            { label: "Name A–Z", value: "AZ" },
                            { label: "Name Z–A", value: "ZA" },
                        ]}
                        onFilterButtonClick={openAdvancedFilterModal}
                        placeholder="Search users by name or email..."
                    />
                    {hasAdvancedFilters && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            {filterStatus !== "All" && (
                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Status: {filterStatus}</span>
                            )}
                            {filterJoiningFrom && (
                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">From: {filterJoiningFrom}</span>
                            )}
                            {filterJoiningTo && (
                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">To: {filterJoiningTo}</span>
                            )}
                            {filterAgeGroup !== "All" && (
                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Age: {filterAgeGroup}</span>
                            )}
                            <button
                                onClick={clearAdvancedFilters}
                                className="px-2 py-1 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                                <th className="text-left py-4 px-5 font-medium w-1/4">User</th>
                                <th className="text-left py-4 px-5 font-medium w-1/4">Email</th>
                                <th className="text-left py-4 px-5 font-medium w-1/5">Address</th>
                                <th className="text-left py-4 px-5 font-medium w-1/5">Joining Date</th>
                                <th className="text-left py-4 px-5 font-medium w-1/12">Status</th>
                                <th className="text-right py-4 px-5 font-medium w-1/12">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingUsers ? (
                                <tr>
                                    <td colSpan={6} className="py-10 px-5 text-center text-sm text-muted-foreground">
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 px-5 text-center text-sm text-muted-foreground">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : paginatedUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    whileHover={{ backgroundColor: "hsla(130, 85%, 45%, 0.04)" }}
                                    className="border-b border-border/50 transition-colors cursor-pointer"
                                    onClick={() => handleRowClick(user)}
                                >
                                    <td className="py-4 px-5 align-middle">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border flex-shrink-0">
                                                    <User className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground text-sm truncate">{user.name}</p>
                                                <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    {(() => {
                                                        const genderMeta = getGenderMeta(user.gender);
                                                        const GenderIcon = genderMeta.Icon;
                                                        return (
                                                            <>
                                                                <GenderIcon className={`w-3 h-3 ${genderMeta.iconClass}`} />
                                                                <span>{genderMeta.label}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 align-middle">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 align-middle">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate text-xs px-1.5 py-0.5 rounded bg-muted max-w-full">
                                                Click to view
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 align-middle">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm text-foreground font-medium">{formatDateTime(user.joiningDate).date}</span>
                                            {formatDateTime(user.joiningDate).time && (
                                                <span className="text-[11px] text-muted-foreground">{formatDateTime(user.joiningDate).time}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 align-middle">
                                        <div className="flex items-center">
                                            <StatusBadge status={user.status} variant={getStatusVariant(user.status) as any} />
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 text-right align-middle">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRowClick(user); }}
                                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/10">
                    <span className="text-xs text-muted-foreground">Showing {filteredUsers.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                            Previous
                        </button>
                        <span className="text-xs font-medium text-foreground">Page {Math.min(currentPage, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                            Next
                        </button>
                    </div>
                </div>
            </GlassCard>

            <Dialog open={isAdvancedFilterOpen} onOpenChange={setIsAdvancedFilterOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] z-[100] overflow-visible">
                    <DialogHeader>
                        <DialogTitle>Advanced User Filters</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 overflow-visible">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">Status</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(["All", "Active", "Inactive", "Blocked"] as const).map((statusOption) => (
                                    <button
                                        key={statusOption}
                                        onClick={() => setDraftStatus(statusOption)}
                                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                                            draftStatus === statusOption
                                                ? "bg-primary/10 border-primary/40 text-primary"
                                                : "border-border text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {statusOption}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">Joining Date Range</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                                <div className="overflow-visible">
                                    <p className="text-[11px] text-muted-foreground mb-1">From</p>
                                    <DateTimePicker
                                        value={draftJoiningFrom}
                                        onChange={setDraftJoiningFrom}
                                        placeholder="Pick from date & time"
                                    />
                                </div>
                                <div className="overflow-visible">
                                    <p className="text-[11px] text-muted-foreground mb-1">To</p>
                                    <DateTimePicker
                                        value={draftJoiningTo}
                                        onChange={setDraftJoiningTo}
                                        placeholder="Pick to date & time"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {(["All", "18-25", "26-35", "36-45", "46+"] as const).map((ageGroup) => (
                                    <button
                                        key={ageGroup}
                                        onClick={() => setDraftAgeGroup(ageGroup)}
                                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                                            draftAgeGroup === ageGroup
                                                ? "bg-primary/10 border-primary/40 text-primary"
                                                : "border-border text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {ageGroup}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                onClick={clearAdvancedFilters}
                                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={applyAdvancedFilters}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modern User Details Modal */}
            {
                showPanel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowPanel(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 25 }}
                            className="bg-white dark:bg-slate-950 shadow-2xl w-full max-w-2xl max-h-[90vh] relative z-10 rounded-2xl flex flex-col overflow-hidden">

                            {/* Header */}
                            <div className="relative shrink-0 px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Details</h2>
                                    <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors duration-200">
                                        <XCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto flex-1">
                                {selectedUser && (
                                    <>
                                        {/* Profile Section */}
                                        <div className="px-8 py-8 border-b border-slate-200/50 dark:border-slate-700/50">
                                            <div className="flex flex-col items-center text-center">
                                                {/* Avatar */}
                                                <div className="relative mb-6">
                                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-1">
                                                        {formImage ? (
                                                            <img src={formImage} alt={formName} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                                <User className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 ${
                                                        formStatus === "Active" ? "bg-emerald-500" : formStatus === "Blocked" ? "bg-red-500" : "bg-slate-400"
                                                    }`} />
                                                </div>

                                                {/* Name & Email */}
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{formName}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{formEmail}</p>

                                                {/* Status Pills */}
                                                <div className="flex items-center justify-center gap-3 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                                                    {(["Active", "Blocked"] as const).map((status) => (
                                                        (() => {
                                                            const StatusIcon = statusIconMap[status];
                                                            return (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusChange(status)}
                                                                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-2 ${
                                                                    formStatus === status 
                                                                        ? status === "Active" 
                                                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm" 
                                                                            : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 shadow-sm" 
                                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-transparent"
                                                                }`}
                                                            >
                                                                <StatusIcon className="w-4 h-4" />
                                                                {status}
                                                            </button>
                                                            );
                                                        })()
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabs */}
                                        <Tabs defaultValue="personal" className="w-full">
                                            <div className="px-8 pt-6 border-b border-slate-200/50 dark:border-slate-700/50">
                                                <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg gap-1">
                                                    <TabsTrigger value="personal" className="rounded-md text-xs font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm">
                                                        <User className="w-3.5 h-3.5 mr-1.5" /> Personal
                                                    </TabsTrigger>
                                                    <TabsTrigger value="cart" className="rounded-md text-xs font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm">
                                                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Cart
                                                    </TabsTrigger>
                                                    <TabsTrigger value="orders" className="rounded-md text-xs font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm">
                                                        <Package className="w-3.5 h-3.5 mr-1.5" /> Orders
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>

                                            <div className="px-8 py-6 space-y-4">
                                                {/* Personal Tab */}
                                                <TabsContent value="personal" className="space-y-6 mt-0">
                                                    {/* Profile Card */}
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Profile Details</p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                                {formImage ? (
                                                                    <img src={formImage} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                                                                ) : (
                                                                    <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formName || "New User"}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">Customer Profile</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Personal Details */}
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">Full Name</label>
                                                            <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white font-medium">{formName || "—"}</div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">Email Address</label>
                                                            <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white font-medium">{formEmail || "—"}</div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">Mobile Number</label>
                                                            <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white font-medium">{formMobile || "—"}</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">Gender</label>
                                                                <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                                                    {(() => {
                                                                        const genderMeta = getGenderMeta(formGender);
                                                                        const GenderIcon = genderMeta.Icon;
                                                                        return (
                                                                            <>
                                                                                <GenderIcon className={`w-4 h-4 ${genderMeta.iconClass}`} />
                                                                                <span>{genderMeta.label}</span>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">Date of Birth</label>
                                                                <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white font-medium">{formDob || "—"}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* User Addresses */}
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 block flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" /> Saved Addresses
                                                        </label>
                                                        <div className="space-y-3">
                                                            {isLoadingAddresses ? (
                                                                <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                                                    <svg className="animate-spin w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                                                    <span className="text-xs font-medium">Loading addresses...</span>
                                                                </div>
                                                            ) : formAddresses.length === 0 ? (
                                                                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                                                    <MapPin className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-2" />
                                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Addresses</p>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">No saved addresses found</p>
                                                                </div>
                                                            ) : (
                                                                formAddresses.map((addr, idx) => (
                                                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-colors">
                                                                        <div className="flex items-start justify-between mb-3">
                                                                            <span className="inline-block px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase rounded">{addr.type}</span>
                                                                            {addr.is_default === 1 && (
                                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">★ Default</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-slate-900 dark:text-white font-medium">{addr.building_no} {addr.building_name}</p>
                                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{addr.area_name}, {addr.city} {addr.pincode}</p>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </TabsContent>

                                                {/* Cart Tab */}
                                                <TabsContent value="cart" className="space-y-4 mt-0">
                                                    {isLoadingCart ? (
                                                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                                            <svg className="animate-spin w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                                            <span className="text-xs font-medium">Loading cart...</span>
                                                        </div>
                                                    ) : userCart.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                                            <ShoppingCart className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-3" />
                                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cart is Empty</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">No items in cart</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-2">
                                                                {userCart.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-colors">
                                                                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                            {item.product?.image || item.image ? (
                                                                                <img src={item.product?.image || item.image} alt="Product" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <Package className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.product?.name || item.name}</p>
                                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                                                                        </div>
                                                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{(item.price || 0).toLocaleString()}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30 flex justify-between items-center">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cart Total</span>
                                                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                                    ₹{userCart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </TabsContent>

                                                {/* Orders Tab */}
                                                <TabsContent value="orders" className="space-y-4 mt-0">
                                                    {isLoadingOrders ? (
                                                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                                            <svg className="animate-spin w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                                            <span className="text-xs font-medium">Loading orders...</span>
                                                        </div>
                                                    ) : userOrders.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                                            <Package className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-3" />
                                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Orders</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">No orders placed yet</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {userOrders.map((order) => (
                                                                <div key={order.id} className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:shadow-md transition-all">
                                                                    {/* Order Header */}
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Order #{order.id}</p>
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                                                <Calendar className="w-3 h-3" /> {order.date}
                                                                            </p>
                                                                        </div>
                                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                                                            order.status === "DELIVERED" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" :
                                                                            order.status === "CANCELLED" ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" :
                                                                            order.status === "ON_THE_WAY" ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : 
                                                                            "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                                                                        }`}>
                                                                            <span className={`w-2 h-2 rounded-full ${
                                                                                order.status === "DELIVERED" ? "bg-emerald-500" :
                                                                                order.status === "CANCELLED" ? "bg-red-500" :
                                                                                order.status === "ON_THE_WAY" ? "bg-blue-500" : 
                                                                                "bg-amber-500"
                                                                            }`} />
                                                                            {order.status}
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Items */}
                                                                    <div className="space-y-2 mb-4">
                                                                        {order.items.map((item, idx) => (
                                                                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                                                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                                    {item.image ? (
                                                                                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <Package className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.productName}</p>
                                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.variantName || "Standard"} • Qty: {item.quantity}</p>
                                                                                </div>
                                                                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">₹{(item.price || 0).toLocaleString()}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Order Total */}
                                                                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Amount</span>
                                                                        <span className="text-lg font-bold text-slate-900 dark:text-white">{order.amount}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            </div>
                                        </Tabs>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-700/50 flex gap-3">
                                <button onClick={() => setShowPanel(false)} className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors duration-200">
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )
            }
        </DashboardLayout>
    );
};

export default Users;
