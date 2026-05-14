import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { User, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAdminUserFromStorage } from "@/lib/adminSession";
import { getCurrentAdminProfile, type MemberResponse } from "@/lib/api";

const Profile = () => {
    const { toast } = useToast();
    const sessionAdmin = getAdminUserFromStorage();
    const [profile, setProfile] = useState<MemberResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setIsLoading(true);
                const dbProfile = await getCurrentAdminProfile({
                    id: sessionAdmin.id,
                    email: sessionAdmin.email,
                });
                setProfile(dbProfile);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to fetch profile.";
                toast({
                    title: "Profile Load Failed",
                    description: message,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [sessionAdmin.id, sessionAdmin.email, toast]);

    const resolved = useMemo(() => {
        const name = profile?.name || sessionAdmin.name;
        const email = profile?.email || sessionAdmin.email;
        const mobile = profile?.mobile || sessionAdmin.mobile || "";
        const role = profile?.role || sessionAdmin.role || "Administrator";
        const status = profile?.status || (profile?.is_active === false ? "Inactive" : "Active");
        return { name, email, mobile, role, status };
    }, [profile, sessionAdmin.email, sessionAdmin.mobile, sessionAdmin.name, sessionAdmin.role]);

    const isActive = resolved.status.toLowerCase() === "active";

    return (
        <DashboardLayout>
            <div className="max-w-3xl">
                <GlassCard delay={0.1} className="p-8">
                    <div className="flex items-start justify-between mb-8 pb-6 border-b border-border/50">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl gradient-green flex items-center justify-center green-glow">
                                    <User className="w-10 h-10 text-primary-foreground" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{resolved.name}</h3>
                                <p className="text-sm text-muted-foreground">{resolved.email}</p>
                                <div className="mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                                        <Check className="w-3 h-3" />
                                        {resolved.role || "Administrator"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {isLoading && (
                            <p className="text-sm text-muted-foreground">Loading profile from database...</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">Full Name</label>
                                <input 
                                    value={resolved.name}
                                    readOnly
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground outline-none cursor-not-allowed" 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">Email Address</label>
                                <input 
                                    type="email" 
                                    value={resolved.email}
                                    readOnly
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground outline-none cursor-not-allowed" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">Mobile Number</label>
                                <input 
                                    type="tel" 
                                    value={resolved.mobile || "-"}
                                    readOnly
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground outline-none cursor-not-allowed" 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">Role</label>
                                <input 
                                    value={resolved.role || "Administrator"}
                                    disabled 
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground outline-none cursor-not-allowed" 
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="text-sm font-semibold text-foreground mb-3 block">Account Status</label>
                            <div className="flex items-center gap-3 text-sm text-foreground px-4 py-3 rounded-xl bg-muted/30 border border-border w-fit cursor-not-allowed">
                                <div className={`w-11 h-6 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-muted'}`}>
                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-all shadow-sm ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                                </div>
                                <span className="font-medium">{isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
