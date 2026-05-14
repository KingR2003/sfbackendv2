import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Lock, Palette, Eye, EyeOff, X, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
    const { toast } = useToast();
    
    // Appearance settings
    const [darkMode, setDarkMode] = useState(true);
    const [compactMode, setCompactMode] = useState(false);
    
    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    
    // Change password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSettingToggle = (setting: string, value: boolean) => {
        toast({
            title: "Setting Updated",
            description: `${setting} has been ${value ? 'enabled' : 'disabled'}.`,
            className: "bg-primary text-primary-foreground",
        });
    };

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                title: "Error",
                description: "Please fill in all password fields.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New password and confirmation do not match.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: "Error",
                description: "Password must be at least 8 characters long.",
                variant: "destructive",
            });
            return;
        }

        // Simulate API call
        setTimeout(() => {
            toast({
                title: "Password Changed",
                description: "Your password has been successfully updated.",
                className: "bg-primary text-primary-foreground",
            });
            setShowPasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }, 1000);
    };

    const handleSignOutAll = () => {
        // Simulate API call
        setTimeout(() => {
            toast({
                title: "Signed Out",
                description: "You have been signed out of all devices.",
                className: "bg-primary text-primary-foreground",
            });
            setShowSignOutModal(false);
        }, 1000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl space-y-6">

                {/* Application Settings */}
                <GlassCard delay={0.1} className="p-6">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Palette className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Appearance</h3>
                            <p className="text-sm text-muted-foreground">Customize how the application looks</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Dark Mode</label>
                                <p className="text-xs text-muted-foreground">Adjust the appearance to reduce eye strain</p>
                            </div>
                            <Switch 
                                checked={darkMode} 
                                onCheckedChange={(value) => {
                                    setDarkMode(value);
                                    handleSettingToggle("Dark Mode", value);
                                }} 
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Compact Mode</label>
                                <p className="text-xs text-muted-foreground">Reduce spacing to show more content</p>
                            </div>
                            <Switch 
                                checked={compactMode} 
                                onCheckedChange={(value) => {
                                    setCompactMode(value);
                                    handleSettingToggle("Compact Mode", value);
                                }} 
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* Notifications */}
                <GlassCard delay={0.2} className="p-6">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Notifications</h3>
                            <p className="text-sm text-muted-foreground">Manage how you receive updates</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Email Notifications</label>
                                <p className="text-xs text-muted-foreground">Receive daily summaries and alerts</p>
                            </div>
                            <Switch 
                                checked={emailNotifications} 
                                onCheckedChange={(value) => {
                                    setEmailNotifications(value);
                                    handleSettingToggle("Email Notifications", value);
                                }} 
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Push Notifications</label>
                                <p className="text-xs text-muted-foreground">Receive real-time updates on your device</p>
                            </div>
                            <Switch 
                                checked={pushNotifications} 
                                onCheckedChange={(value) => {
                                    setPushNotifications(value);
                                    handleSettingToggle("Push Notifications", value);
                                }} 
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* Security */}
                <GlassCard delay={0.3} className="p-6">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Security</h3>
                            <p className="text-sm text-muted-foreground">Manage your account security</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <motion.button 
                                whileHover={{ scale: 1.02 }} 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl gradient-green text-primary-foreground font-semibold text-sm green-glow shadow-lg transition-all"
                            >
                                Change Password
                            </motion.button>
                        </div>
                        <div>
                            <motion.button 
                                whileHover={{ scale: 1.02 }} 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowSignOutModal(true)}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-destructive/50 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors"
                            >
                                Sign out of all devices
                            </motion.button>
                        </div>
                    </div>
                </GlassCard>

            </div>

            {/* Change Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong shadow-elevated rounded-2xl p-8 w-full max-w-md relative z-10 mx-4"
                        >
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Change Password</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Update your account password</p>
                                </div>
                                <button onClick={() => setShowPasswordModal(false)} className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-2 block">Current Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-2 block">New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Minimum 8 characters</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-2 block">Confirm New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t border-border/50">
                                <button 
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <motion.button 
                                    whileHover={{ scale: 1.01 }} 
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleChangePassword}
                                    className="flex-1 px-6 py-3 rounded-xl gradient-green text-primary-foreground text-sm font-bold green-glow-sm shadow-lg"
                                >
                                    Update Password
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sign Out Confirmation Modal */}
            <AnimatePresence>
                {showSignOutModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowSignOutModal(false)} />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong shadow-elevated rounded-2xl p-8 w-full max-w-md relative z-10 mx-4"
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-8 h-8 text-destructive" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground mb-2">Sign Out All Devices?</h2>
                                <p className="text-sm text-muted-foreground">
                                    This will sign you out from all devices where you're currently logged in. You'll need to sign in again on each device.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowSignOutModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <motion.button 
                                    whileHover={{ scale: 1.01 }} 
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleSignOutAll}
                                    className="flex-1 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold shadow-lg hover:bg-destructive/90 transition-colors"
                                >
                                    Sign Out All
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default Settings;
