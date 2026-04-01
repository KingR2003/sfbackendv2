import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, X, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { mockUserPermissions, UserPermission, ModulePermission, PermissionRole } from "@/data/mockData";

const MODULES = ["Dashboard", "Categories", "Products", "Orders", "Coupons", "Payments", "Members", "Users", "Analytics"];
const PERMISSIONS: { key: keyof ModulePermission; label: string; color: string }[] = [
    { key: "view", label: "View Access", color: "green" },
    { key: "create", label: "Create Access", color: "green" },
    { key: "update", label: "Update Access", color: "green" },
    { key: "delete", label: "Delete Access", color: "green" },
];

const roleColors: Record<PermissionRole, string> = {
    Admin: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    Manager: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    Staff: "bg-green-500/15 text-green-400 border border-green-500/30",
    Viewer: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};

const avatarColors: Record<PermissionRole, string> = {
    Admin: "bg-purple-500",
    Manager: "bg-blue-500",
    Staff: "bg-green-500",
    Viewer: "bg-gray-500",
};

interface ToggleProps {
    checked: boolean;
    onChange: () => void;
    color?: string;
}

const toggleOnClass: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
};

const Toggle = ({ checked, onChange, color = "green" }: ToggleProps) => (
    <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none ${checked ? toggleOnClass[color] : "bg-muted"}`}
    >
        <motion.div
            animate={{ x: checked ? 20 : 2 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
    </button>
);

const ManagePermissions = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserPermission[]>(mockUserPermissions);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
    // Local editable copy of permissions for selected user
    const [editPerms, setEditPerms] = useState<Record<string, ModulePermission>>({});

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectUser = (user: UserPermission) => {
        setSelectedUser(user);
        // Deep copy permissions for editing
        setEditPerms(JSON.parse(JSON.stringify(user.permissions)));
    };

    const handleToggle = (module: string, perm: keyof ModulePermission) => {
        setEditPerms(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [perm]: !prev[module][perm],
            },
        }));
    };

    const handleSave = () => {
        if (!selectedUser) return;
        setUsers(prev =>
            prev.map(u => u.id === selectedUser.id ? { ...u, permissions: { ...editPerms } } : u)
        );
        setSelectedUser(prev => prev ? { ...prev, permissions: { ...editPerms } } : prev);
        toast({ title: "Permissions Saved", description: `Access rights for ${selectedUser.name} have been updated.` });
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
                {/* Left — User List */}
                <div className="lg:col-span-1 space-y-3">
                    {/* Search */}
                    <GlassCard delay={0} className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search users by name, email..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </GlassCard>

                    {/* User List */}
                    <GlassCard delay={0.05} className="p-2 space-y-1">
                        {filtered.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-6">No users found.</p>
                        )}
                        {filtered.map(user => (
                            <motion.button
                                key={user.id}
                                whileHover={{ x: 3 }}
                                onClick={() => handleSelectUser(user)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${selectedUser?.id === user.id
                                    ? "bg-primary/10 ring-1 ring-primary/30"
                                    : "hover:bg-muted/50"
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColors[user.role]}`}>
                                    {user.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${roleColors[user.role]}`}>
                                    {user.role}
                                </span>
                            </motion.button>
                        ))}
                    </GlassCard>
                </div>

                {/* Right — Permission Panel */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {!selectedUser ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center py-24 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                                    <Shield className="w-8 h-8 text-purple-500/50" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Select a user to manage their permissions</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedUser.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4"
                            >
                                {/* Selected User Card */}
                                <GlassCard delay={0} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ${avatarColors[selectedUser.role]}`}>
                                                {selectedUser.avatar}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{selectedUser.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                                <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${roleColors[selectedUser.role]}`}>
                                                    {selectedUser.role}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                                        >
                                            <X className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                </GlassCard>

                                {/* Module Permissions Table */}
                                <GlassCard delay={0.05} className="p-0 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-border/50">
                                        <h3 className="text-sm font-semibold text-foreground">Module Permissions</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Configure access levels for each module</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border/50 bg-muted/20">
                                                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module</th>
                                                    {PERMISSIONS.map(p => (
                                                        <th key={p.key} className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                                            {p.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {MODULES.map((mod, idx) => (
                                                    <motion.tr
                                                        key={mod}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                                                    >
                                                        <td className="py-3.5 px-5">
                                                            <span className="text-sm font-medium text-foreground">{mod}</span>
                                                        </td>
                                                        {PERMISSIONS.map(perm => (
                                                            <td key={perm.key} className="py-3.5 px-4 text-center">
                                                                <div className="flex justify-center">
                                                                    <Toggle
                                                                        checked={editPerms[mod]?.[perm.key] ?? false}
                                                                        onChange={() => handleToggle(mod, perm.key)}
                                                                        color={
                                                                            perm.color === "blue" ? "blue" :
                                                                                perm.color === "yellow" ? "yellow" :
                                                                                    perm.color === "red" ? "red" : "green"
                                                                        }
                                                                    />
                                                                </div>
                                                            </td>
                                                        ))}
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Save Button */}
                                    <div className="px-5 py-4 border-t border-border/50 bg-muted/10 flex justify-end">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm shadow-md"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </motion.button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManagePermissions;
