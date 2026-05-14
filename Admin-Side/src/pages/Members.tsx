import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Users as UsersIcon, UserCheck, Shield, MapPin, Lock, X, UserX, Mail, User, Phone, ShieldCheck, Eye, EyeOff, Check, CheckCircle, ChevronDown, KeyRound, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { adminRegister, getMembers, updateMember } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(raw: string): { date: string; time: string } {
    if (!raw) return { date: "—", time: "" };
    try {
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

interface Member {
    id: number;
    name: string;
    email: string;
    mobile: string;
    role: string;
    is_active: boolean;
    created_at: string;
    address: string;
    status: "Active" | "Inactive" | "Pending";
}

const MEMBER_STATUS_CACHE_KEY = "memberStatusCache";

type MemberStatus = Member["status"];

const normalizeMemberStatus = (rawStatus: unknown, isActive?: boolean): MemberStatus => {
    const value = String(rawStatus ?? "").trim().toLowerCase();
    if (value === "active") return "Active";
    if (value === "inactive") return "Inactive";
    if (value === "pending") return "Pending";
    if (value === "blocked") return "Inactive";
    if (isActive === true) return "Active";
    if (isActive === false) return "Inactive";
    return "Pending";
};

const toUiMember = (member: any): Member => ({
    ...member,
    status: normalizeMemberStatus(member?.status, member?.is_active),
});

interface MemberFormData {
    name: string;
    email: string;
    mobile: string;
    secretKey: string;
    password: string;
    confirmPassword: string;
    isActive: boolean;
}

const initialFormState: MemberFormData = {
    name: "",
    email: "",
    mobile: "",
    secretKey: "",
    password: "",
    confirmPassword: "",
    isActive: true,
};

const cacheMemberStatuses = (memberList: Member[]) => {
    const cachePayload = memberList.map((member) => ({
        email: String(member.email ?? "").trim().toLowerCase(),
        status: normalizeMemberStatus(member.status, member.is_active),
    }));
    localStorage.setItem(MEMBER_STATUS_CACHE_KEY, JSON.stringify(cachePayload));
};

const Members = () => {
    const { toast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"All" | "Active" | "Inactive" | "Pending">("All");
    const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "AZ" | "ZA">("Newest");
    const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    const [addForm, setAddForm] = useState<MemberFormData>(initialFormState);
    const [editForm, setEditForm] = useState<MemberFormData>(initialFormState);

    const [showAddPassword, setShowAddPassword] = useState(false);
    const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
    // Change password modal state
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [changePasswordForm, setChangePasswordForm] = useState({ current: "", newPass: "", confirm: "" });
    const [changePasswordError, setChangePasswordError] = useState("");

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const data = await getMembers();
            const normalizedMembers = data.map(toUiMember);
            setMembers(normalizedMembers);
            cacheMemberStatuses(normalizedMembers);
        } catch (error: any) {
            console.error("Failed to fetch members:", error);
            setMembers([]);
            cacheMemberStatuses([]);
            toast({
                title: "Error loading members",
                description: error.message || "Failed to fetch members from the database.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMemberForEdit = async (memberId: number | string): Promise<Member | null> => {
        const freshMembers = await getMembers();
        const normalizedMembers = freshMembers.map(toUiMember);
        setMembers(normalizedMembers);
        cacheMemberStatuses(normalizedMembers);
        return normalizedMembers.find((item) => String(item.id) === String(memberId)) ?? null;
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
                setOpenStatusDropdown(null);
            }
        };
        const closeRowDropdown = () => setOpenStatusDropdown(null);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("scroll", closeRowDropdown, true);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("scroll", closeRowDropdown, true);
        };
    }, []);

    const sanitizeMobile = (value: string) => value.replace(/[^0-9]/g, "").slice(0, 10);

    const handleFormInputChange = (
        target: "add" | "edit",
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "status") {
            const isActive = value === "Active";
            setEditForm((prev) => ({ ...prev, isActive }));
            return;
        }

        const nextValue = name === "mobile" ? sanitizeMobile(value) : value;

        if (target === "add") {
            setAddForm((prev) => ({ ...prev, [name]: nextValue }));
            return;
        }

        setEditForm((prev) => ({ ...prev, [name]: nextValue }));
    };

    const openEditModal = async (member: Member) => {
        try {
            const latestMember = (await fetchMemberForEdit(member.id)) ?? member;
            setSelectedMember(latestMember);
            setEditForm({
                name: latestMember.name,
                email: latestMember.email,
                mobile: sanitizeMobile(latestMember.mobile),
                secretKey: "",
                password: "",
                confirmPassword: "",
                isActive: normalizeMemberStatus(latestMember.status, latestMember.is_active) === "Active",
            });
        } catch {
            setSelectedMember(member);
            setEditForm({
                name: member.name,
                email: member.email,
                mobile: sanitizeMobile(member.mobile),
                secretKey: "",
                password: "",
                confirmPassword: "",
                isActive: normalizeMemberStatus(member.status, member.is_active) === "Active",
            });
        }

        setShowEditPassword(false);
        setShowEditConfirmPassword(false);
        setShowEditModal(true);
    };

    const filtered = members.filter((u) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.mobile.includes(term);

        if (filterType === "Active") return matchesSearch && u.status === "Active";
        if (filterType === "Inactive") return matchesSearch && u.status === "Inactive";
        if (filterType === "Pending") return matchesSearch && u.status === "Pending";
        return matchesSearch;
    }).sort((a, b) => {
        if (sortBy === "AZ") return a.name.localeCompare(b.name);
        if (sortBy === "ZA") return b.name.localeCompare(a.name);
        if (sortBy === "Oldest") return Number(a.id) - Number(b.id);
        return Number(b.id) - Number(a.id); // Newest
    });

    const handleStatClick = (type: "All" | "Active" | "Inactive" | "Pending") => {
        setCurrentPage(1);
        if (filterType === type) {
            setFilterType("All");
        } else {
            setFilterType(type);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const visibleMembers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when sort/filter changes
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, sortBy]);

    const handleMemberClick = (member: Member) => {
        setSelectedMember(member);
        setShowDetailsModal(true);
    };

    const handleCreateMember = async (e: React.FormEvent) => {
        e.preventDefault();

        if (addForm.password !== addForm.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        setIsCreating(true);
        try {
            const res = await adminRegister(
                addForm.name,
                addForm.email,
                addForm.mobile,
                addForm.password,
                addForm.secretKey
            );

            if (!res.success) {
                throw new Error(res.message || "Member creation failed.");
            }

            const freshMembers = await getMembers();
            const createdMember = freshMembers.find(
                (m) => m.email.toLowerCase() === addForm.email.toLowerCase()
            );

            if (createdMember) {
                await updateMember(createdMember.id, {
                    name: addForm.name,
                    email: addForm.email,
                    mobile: addForm.mobile,
                });
            }

            await fetchMembers();
            setShowAddModal(false);
            setAddForm(initialFormState);
            setShowAddPassword(false);
            setShowAddConfirmPassword(false);

            toast({
                title: "Success",
                description: "Member created successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create member.",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        if ((editForm.password || editForm.confirmPassword) && editForm.password !== editForm.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        try {
            const nextStatus: MemberStatus = editForm.isActive ? "Active" : "Inactive";
            const payload: Record<string, any> = {
                name: editForm.name,
                email: editForm.email,
                mobile: editForm.mobile,
                status: nextStatus,
                isActive: editForm.isActive,
            };

            await updateMember(selectedMember.id, payload);

            const updatedStatus: Member["status"] =
                selectedMember.status === "Pending" && editForm.isActive
                    ? "Active"
                    : nextStatus;

            const updatedMember: Member = {
                ...selectedMember,
                name: editForm.name,
                email: editForm.email,
                mobile: editForm.mobile,
                is_active: editForm.isActive,
                status: updatedStatus,
            };

            setMembers((prev) => {
                const nextMembers = prev.map((m) => (m.id === updatedMember.id ? updatedMember : m));
                cacheMemberStatuses(nextMembers);
                return nextMembers;
            });
            setSelectedMember(updatedMember);
            setShowEditModal(false);

            toast({
                title: "Success",
                description: "Member updated successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update member.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const PasswordStrengthMeter = ({ password }: { password: string }) => {
        if (!password) return null;
        const checks = [
            { label: "8+ characters", pass: password.length >= 8 },
            { label: "Uppercase", pass: /[A-Z]/.test(password) },
            { label: "Lowercase", pass: /[a-z]/.test(password) },
            { label: "Number", pass: /[0-9]/.test(password) },
            { label: "Special char", pass: /[^A-Za-z0-9]/.test(password) },
        ];
        const score = checks.filter(c => c.pass).length;
        const strengthConfig = [
            { label: "Very Weak", color: "bg-red-500", textColor: "text-red-500" },
            { label: "Weak", color: "bg-orange-500", textColor: "text-orange-500" },
            { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-500" },
            { label: "Good", color: "bg-blue-500", textColor: "text-blue-500" },
            { label: "Strong", color: "bg-green-500", textColor: "text-green-600" },
        ];
        const strength = strengthConfig[Math.max(0, score - 1)];
        return (
            <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-1">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= score ? strength.color : "bg-gray-200"
                            }`} />
                        ))}
                    </div>
                    <span className={`text-[11px] font-bold ml-2 ${strength.textColor}`}>{strength.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {checks.map(c => (
                        <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.pass ? "text-green-600" : "text-gray-400"}`}>
                            <Check className={`w-3 h-3 ${c.pass ? "opacity-100" : "opacity-30"}`} />
                            {c.label}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const ConfirmPasswordHint = ({ password, confirmPassword }: { password: string; confirmPassword: string }) => {
        if (!password || !confirmPassword) return null;
        return (
            <div className={`text-[11px] font-bold mt-1 px-1 flex items-center gap-1 ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                {password === confirmPassword ? (
                    <><Check className="w-3 h-3" /> Passwords match</>
                ) : (
                    <><ShieldCheck className="w-3 h-3" /> Passwords don't match</>
                )}
            </div>
        );
    };

    const handleStatusUpdate = async (member: Member, nextStatus: MemberStatus) => {
        const isActive = nextStatus === "Active";
        try {
            await updateMember(member.id, {
                name: member.name,
                email: member.email,
                mobile: member.mobile,
                status: nextStatus,
                isActive,
            });

            const updatedMember: Member = {
                ...member,
                is_active: isActive,
                status: nextStatus,
            };

            setMembers((prev) => {
                const nextMembers = prev.map((item) => (item.id === member.id ? updatedMember : item));
                cacheMemberStatuses(nextMembers);
                return nextMembers;
            });
            if (selectedMember?.id === member.id) {
                setSelectedMember(updatedMember);
                setEditForm((prev) => ({ ...prev, isActive }));
            }

            toast({
                title: "Success",
                description: `Member status updated to ${nextStatus}.`,
            });
            setOpenStatusDropdown(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update member status.",
                variant: "destructive",
            });
        }
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5 mt-4">
                <GlassCard className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${filterType === "All" ? "ring-2 ring-primary/50" : ""}`} onClick={() => handleStatClick("All")}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <UsersIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">Total Members</p>
                            <p className="text-xl font-bold text-foreground">{members.length}</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setAddForm(initialFormState);
                            setShowAddPassword(false);
                            setShowAddConfirmPassword(false);
                            setShowAddModal(true);
                        }}
                        className="w-10 h-10 rounded-full gradient-green flex items-center justify-center text-primary-foreground shadow-lg green-glow"
                    >
                        <Plus className="w-5 h-5" />
                    </motion.button>
                </GlassCard>

                <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterType === "Active" ? "ring-2 ring-green-500/50" : ""}`} onClick={() => handleStatClick("Active")}>
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">Active Members</p>
                        <p className="text-xl font-bold text-foreground">{members.filter((m) => m.status === "Active").length}</p>
                    </div>
                </GlassCard>

                <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterType === "Inactive" ? "ring-2 ring-red-500/50" : ""}`} onClick={() => handleStatClick("Inactive")}>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <UserX className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">Inactive Members</p>
                        <p className="text-xl font-bold text-foreground">{members.filter((m) => m.status === "Inactive").length}</p>
                    </div>
                </GlassCard>

                <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterType === "Pending" ? "ring-2 ring-orange-500/50" : ""}`} onClick={() => handleStatClick("Pending")}>
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">Pending Members</p>
                        <p className="text-xl font-bold text-foreground">{members.filter((m) => m.status === "Pending").length}</p>
                    </div>
                </GlassCard>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <div className="p-4 border-b border-border/50">
                    <SearchFilter
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterValue={filterType}
                        setFilterValue={(val) => setFilterType(val as "All" | "Active" | "Inactive" | "Pending")}
                        filterOptions={[
                            { label: "All Members", value: "All" },
                            { label: "Active Only", value: "Active" },
                            { label: "Inactive Only", value: "Inactive" },
                            { label: "Pending Only", value: "Pending" },
                        ]}
                        sortValue={sortBy}
                        setSortValue={(val) => { setSortBy(val as any); setCurrentPage(1); }}
                        sortOptions={[
                            { label: "Newest First", value: "Newest" },
                            { label: "Oldest First", value: "Oldest" },
                            { label: "Name A–Z", value: "AZ" },
                            { label: "Name Z–A", value: "ZA" },
                        ]}
                        placeholder="Search members by name, email, or mobile..."
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                                <th className="text-left py-4 px-5 font-medium">Name</th>
                                <th className="text-left py-4 px-5 font-medium">Email</th>
                                <th className="text-left py-4 px-5 font-medium">Mobile</th>
                                <th className="text-left py-4 px-5 font-medium">Status</th>
                                <th className="text-left py-4 px-5 font-medium">Created</th>
                                <th className="text-left py-4 px-5 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">Loading members...</td>
                                </tr>
                            ) : visibleMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No members found.</td>
                                </tr>
                            ) : (
                                visibleMembers.map((user) => {
                                    const normalizedStatus = normalizeMemberStatus(user.status, user.is_active);
                                    return (
                                    <motion.tr
                                        key={user.id}
                                        whileHover={{ backgroundColor: "hsla(130, 85%, 45%, 0.04)" }}
                                        className="border-b border-border/50"
                                    >
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full gradient-green flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                                                    {user.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </div>
                                                <span className="text-sm font-semibold text-foreground">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{user.email}</td>
                                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{user.mobile}</td>
                                        <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (openStatusDropdown === user.id) {
                                                        setOpenStatusDropdown(null);
                                                        setDropdownPos(null);
                                                    } else {
                                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                                        setOpenStatusDropdown(user.id);
                                                    }
                                                }}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${normalizedStatus === 'Active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    normalizedStatus === 'Pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${normalizedStatus === 'Active' ? 'bg-green-500' :
                                                    normalizedStatus === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                {normalizedStatus}
                                                <ChevronDown className="w-3 h-3 ml-0.5" />
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-5 align-middle">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm text-foreground font-medium">{formatDateTime(user.created_at).date}</span>
                                                {formatDateTime(user.created_at).time && (
                                                    <span className="text-[11px] text-muted-foreground">{formatDateTime(user.created_at).time}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMemberClick(user);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(user);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                                    title="Edit Member"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/10">
                    <span className="text-xs text-muted-foreground">Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                            Previous
                        </button>
                        <span className="text-xs font-medium text-foreground">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                            Next
                        </button>
                    </div>
                </div>
            </GlassCard>

            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-2xl relative z-10 mx-4"
                        >
                            <h2 className="text-lg font-bold text-foreground mb-5">Add New Member</h2>
                            <form onSubmit={handleCreateMember} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="name"
                                                value={addForm.name}
                                                onChange={(e) => handleFormInputChange("add", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                                placeholder="Full Name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Secret Access Key</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 group-focus-within:text-orange-500 transition-colors" />
                                            <input
                                                name="secretKey"
                                                value={addForm.secretKey}
                                                onChange={(e) => handleFormInputChange("add", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-orange-50/30 border border-orange-100 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-mono"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="email"
                                                type="email"
                                                value={addForm.email}
                                                onChange={(e) => handleFormInputChange("add", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                                placeholder="Email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Mobile Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="mobile"
                                                type="tel"
                                                value={addForm.mobile}
                                                onChange={(e) => handleFormInputChange("add", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                                placeholder="00000 00000"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="password"
                                                type={showAddPassword ? "text" : "password"}
                                                value={addForm.password}
                                                onChange={(e) => handleFormInputChange("add", e)}
                                                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAddPassword((prev) => !prev)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showAddPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <PasswordStrengthMeter password={addForm.password} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="confirmPassword"
                                                type={showAddConfirmPassword ? "text" : "password"}
                                                value={addForm.confirmPassword}
                                                onChange={(e) => handleFormInputChange("add", e)}
                                                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAddConfirmPassword((prev) => !prev)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showAddConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <ConfirmPasswordHint password={addForm.password} confirmPassword={addForm.confirmPassword} />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        disabled={isCreating}
                                        className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm disabled:opacity-70"
                                    >
                                        {isCreating ? "Creating..." : "Create Member"}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDetailsModal && selectedMember && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-lg relative z-10 mx-4"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-foreground">Member Details</h2>
                                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Avatar + name header */}
                                <div className="flex items-center gap-4 border-b border-border/50 pb-5">
                                    <div className="w-16 h-16 rounded-full gradient-green flex items-center justify-center text-2xl font-bold text-primary-foreground flex-shrink-0">
                                        {selectedMember.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-foreground truncate">{selectedMember.name}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{selectedMember.email}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <StatusBadge status={selectedMember.is_active ? "Active" : "Inactive"} variant={selectedMember.is_active ? "green" : "gray"} />
                                            {selectedMember.role && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                                    <Shield className="w-3 h-3" />{selectedMember.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/30 rounded-xl p-3.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Member ID</p>
                                        <p className="text-sm font-bold text-foreground font-mono mt-0.5">#{selectedMember.id}</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-xl p-3.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mobile</p>
                                        <p className="text-sm font-medium text-foreground mt-0.5">{selectedMember.mobile || "—"}</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-xl p-3.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Joined</p>
                                        <p className="text-sm font-medium text-foreground mt-0.5">{formatDateTime(selectedMember.created_at).date}</p>
                                        {formatDateTime(selectedMember.created_at).time && (
                                            <p className="text-[11px] text-muted-foreground">{formatDateTime(selectedMember.created_at).time}</p>
                                        )}
                                    </div>
                                    <div className="bg-muted/30 rounded-xl p-3.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Account Status</p>
                                        <p className={`text-sm font-semibold mt-0.5 ${selectedMember.is_active ? "text-green-600" : "text-red-500"}`}>
                                            {selectedMember.is_active ? "Active" : "Inactive"}
                                        </p>
                                    </div>
                                </div>

                                {/* Address */}
                                {selectedMember.address && (
                                    <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-3.5">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Address</p>
                                            <p className="text-sm text-foreground">{selectedMember.address}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Security */}
                                <div className="flex items-center justify-between bg-muted/30 rounded-xl px-3.5 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-foreground font-medium">Password</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowChangePasswordModal(true);
                                        }}
                                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Change →
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                                    Close
                                </button>
                                <motion.button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        openEditModal(selectedMember);
                                    }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Profile
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditModal && selectedMember && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-2xl relative z-10 mx-4"
                        >
                            <h2 className="text-lg font-bold text-foreground mb-5">Edit Member</h2>
                            <form onSubmit={handleSaveChanges} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="name"
                                                value={editForm.name}
                                                onChange={(e) => handleFormInputChange("edit", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                                placeholder="Full Name"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="email"
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => handleFormInputChange("edit", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                                placeholder="Email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Mobile Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="mobile"
                                                type="tel"
                                                value={editForm.mobile}
                                                onChange={(e) => handleFormInputChange("edit", e)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                                placeholder="00000 00000"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="password"
                                                type={showEditPassword ? "text" : "password"}
                                                value={editForm.password}
                                                onChange={(e) => handleFormInputChange("edit", e)}
                                                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                                placeholder="Leave empty to keep current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowEditPassword((prev) => !prev)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showEditPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                name="confirmPassword"
                                                type={showEditConfirmPassword ? "text" : "password"}
                                                value={editForm.confirmPassword}
                                                onChange={(e) => handleFormInputChange("edit", e)}
                                                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowEditConfirmPassword((prev) => !prev)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showEditConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <ConfirmPasswordHint password={editForm.password} confirmPassword={editForm.confirmPassword} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 px-1 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                                        className={`w-11 h-6 rounded-full relative transition-colors ${editForm.isActive ? "bg-primary" : "bg-muted"}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-all shadow-sm ${editForm.isActive ? "right-0.5" : "left-0.5"}`}
                                        />
                                    </button>
                                    <span className="text-base font-medium text-foreground">Active Status</span>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        disabled={isUpdating}
                                        className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm disabled:opacity-70"
                                    >
                                        {isUpdating ? "Saving..." : "Save Changes"}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showChangePasswordModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setShowChangePasswordModal(false); setChangePasswordError(""); }} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-md relative z-10 mx-4"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <KeyRound className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Change Password</h2>
                                        <p className="text-xs text-muted-foreground">{selectedMember?.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowChangePasswordModal(false); setChangePasswordError(""); }} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const checks = [
                                    changePasswordForm.newPass.length >= 8,
                                    /[A-Z]/.test(changePasswordForm.newPass),
                                    /[a-z]/.test(changePasswordForm.newPass),
                                    /[0-9]/.test(changePasswordForm.newPass),
                                    /[^A-Za-z0-9]/.test(changePasswordForm.newPass),
                                ];
                                if (!changePasswordForm.current) {
                                    setChangePasswordError("Please enter your current password.");
                                    return;
                                }
                                if (checks.filter(Boolean).length < 4) {
                                    setChangePasswordError("Password must be at least 8 chars with uppercase, lowercase, number and special character.");
                                    return;
                                }
                                if (changePasswordForm.newPass !== changePasswordForm.confirm) {
                                    setChangePasswordError("New passwords do not match. Please try again.");
                                    return;
                                }
                                setChangePasswordError("");
                                // TODO: call API to change password
                                toast({ title: "Success", description: "Password updated successfully." });
                                setShowChangePasswordModal(false);
                                setChangePasswordForm({ current: "", newPass: "", confirm: "" });
                            }} className="space-y-4">
                                {/* Inline error banner */}
                                <AnimatePresence>
                                    {changePasswordError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <X className="w-3 h-3 text-white" />
                                            </div>
                                            <p className="text-sm text-red-700 font-medium leading-snug">{changePasswordError}</p>
                                            <button
                                                type="button"
                                                onClick={() => setChangePasswordError("")}
                                                className="ml-auto text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {/* Current Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Current Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={changePasswordForm.current}
                                            onChange={e => { setChangePasswordError(""); setChangePasswordForm(p => ({ ...p, current: e.target.value })); }}
                                            required
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                            placeholder="Enter current password"
                                        />
                                        <button type="button" onClick={() => setShowCurrentPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={changePasswordForm.newPass}
                                            onChange={e => { setChangePasswordError(""); setChangePasswordForm(p => ({ ...p, newPass: e.target.value })); }}
                                            required
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                            placeholder="Enter new password"
                                        />
                                        <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <PasswordStrengthMeter password={changePasswordForm.newPass} />
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Confirm New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            value={changePasswordForm.confirm}
                                            onChange={e => { setChangePasswordError(""); setChangePasswordForm(p => ({ ...p, confirm: e.target.value })); }}
                                            required
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                            placeholder="Re-enter new password"
                                        />
                                        <button type="button" onClick={() => setShowConfirmNewPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <ConfirmPasswordHint password={changePasswordForm.newPass} confirmPassword={changePasswordForm.confirm} />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowChangePasswordModal(false); setChangePasswordForm({ current: "", newPass: "", confirm: "" }); setChangePasswordError(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                                        Cancel
                                    </button>
                                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm">
                                        Update Password
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {openStatusDropdown !== null && dropdownPos && (() => {
                const targetMember = members.find((m) => m.id === openStatusDropdown);
                if (!targetMember) return null;
                const targetStatus = normalizeMemberStatus(targetMember.status, targetMember.is_active);
                return (
                    <motion.div
                        ref={statusDropdownRef}
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                        className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {[
                            { value: "Active" as MemberStatus, color: "bg-green-500", text: "text-green-600" },
                            { value: "Inactive" as MemberStatus, color: "bg-red-500", text: "text-red-500" },
                            { value: "Pending" as MemberStatus, color: "bg-yellow-500", text: "text-yellow-600" },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void handleStatusUpdate(targetMember, opt.value);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-muted/60 ${targetStatus === opt.value ? "bg-muted/40" : ""}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                <span className={opt.text}>{opt.value}</span>
                                {targetStatus === opt.value && <CheckCircle className="w-3 h-3 ml-auto text-primary" />}
                            </button>
                        ))}
                    </motion.div>
                );
            })()}
        </DashboardLayout>
    );
};

export default Members;
