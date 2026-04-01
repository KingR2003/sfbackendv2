import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { adminLogin, getMembers } from "@/lib/api";
import { buildAdminUserFromCredentials } from "@/lib/adminSession";

const MEMBER_STATUS_CACHE_KEY = "memberStatusCache";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const getCachedMemberStatusForEmail = (candidateEmail: string) => {
        const normalizedEmail = candidateEmail.trim().toLowerCase();
        if (!normalizedEmail) return null;

        try {
            const rawCache = localStorage.getItem(MEMBER_STATUS_CACHE_KEY);
            if (!rawCache) return null;

            const cachedMembers = JSON.parse(rawCache) as Array<{ email?: string; status?: string }>;
            const matchedMember = cachedMembers.find(
                (member) => String(member.email ?? "").trim().toLowerCase() === normalizedEmail
            );

            return matchedMember?.status ? String(matchedMember.status).trim().toLowerCase() : null;
        } catch {
            return null;
        }
    };

    const getMemberStatusForEmail = async (candidateEmail: string) => {
        const normalizedEmail = candidateEmail.trim().toLowerCase();
        if (!normalizedEmail) return null;

        const cachedStatus = getCachedMemberStatusForEmail(candidateEmail);
        if (cachedStatus) return cachedStatus;

        try {
            const members = await getMembers();
            localStorage.setItem(
                MEMBER_STATUS_CACHE_KEY,
                JSON.stringify(
                    members.map((member) => ({
                        email: String(member.email ?? "").trim().toLowerCase(),
                        status: String(member.status ?? "").trim(),
                    }))
                )
            );
            const matchedMember = members.find(
                (member) => (member.email ?? "").trim().toLowerCase() === normalizedEmail
            );

            if (!matchedMember) return null;

            return String(matchedMember.status ?? "").trim().toLowerCase();
        } catch {
            return null;
        }
    };

    const showDeniedToast = async (fallbackMessage?: string) => {
        const memberStatus = await getMemberStatusForEmail(email);
        const shouldContactAdministrator = memberStatus === "inactive" || memberStatus === "pending";

        toast({
            title: "Access Denied",
            description: shouldContactAdministrator
                ? "Contact administrator to activate your account."
                : (fallbackMessage || "Invalid administrative credentials."),
            variant: "destructive",
        });
    };

    const isAuthenticationError = (message: string) => {
        const normalizedMessage = message.trim().toLowerCase();
        return normalizedMessage.includes("invalid") ||
            normalizedMessage.includes("credential") ||
            normalizedMessage.includes("unauthorized") ||
            normalizedMessage.includes("401") ||
            normalizedMessage.includes("pending") ||
            normalizedMessage.includes("approve") ||
            normalizedMessage.includes("administrator") ||
            normalizedMessage.includes("inactive") ||
            normalizedMessage.includes("forbidden") ||
            normalizedMessage.includes("403");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await adminLogin(email, password);

            if (res.success) {
                // Store token + auth flag. The new backend returns token in the root `res` object.
                const token = (res as any).token || res.data?.token;
                if (token) {
                    localStorage.setItem("adminToken", token);
                }
                const adminUser = res.data?.admin || buildAdminUserFromCredentials(email);
                localStorage.setItem("adminUser", JSON.stringify(adminUser));
                localStorage.setItem("adminAuthenticated", "true");

                toast({
                    title: "Welcome back",
                    description: "Access granted to Svasthya Fresh Admin Portal.",
                });
                navigate("/dashboard");
            } else {
                await showDeniedToast(res.message || "Invalid administrative credentials.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unable to reach the server. Please try again.";

            if (isAuthenticationError(errorMessage)) {
                await showDeniedToast(errorMessage);
            } else {
                toast({
                    title: "Sign In Failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen w-full flex bg-background font-inter overflow-hidden">
            {/* Left Side: Brand Imagery (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 z-10" />
                <img
                    src="/brand-auth.png"
                    alt="Fresh Produce"
                    className="absolute inset-0 w-full h-full object-cover scale-105 animate-float"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent z-20 flex flex-col justify-end p-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-xl">
                            <span className="text-primary font-bold text-2xl">S</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Svasthya Fresh</h2>
                        <p className="text-white/80 text-lg max-w-md leading-relaxed">
                            Premium Management Portal for Quality Organic Produce & Sustainable Living.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Formal Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
                <div className="w-full max-w-[420px]">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="mb-10 lg:hidden">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
                                <span className="text-white font-bold text-xl">S</span>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h1 className="text-3xl font-extrabold text-[#111827] mb-3 tracking-tight">Sign In</h1>
                            <p className="text-[#6B7280] font-medium">Welcome back! Please enter your details.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                        placeholder="Email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => toast({
                                            title: "Password Reset Request",
                                            description: "A reset link has been sent to your registered email address.",
                                        })}
                                        className="text-sm font-bold text-primary hover:underline"
                                    >
                                        Reset password
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>

                        <div className="mt-12 flex flex-col items-center gap-4 text-center">
                            <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B7280]">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Secure Administrative Tunnel
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                                This portal is restricted to authorized Svasthya Fresh personnel only. Unauthorised access attempts are logged.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Brand */}
                <div className="absolute bottom-10 text-center">
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                        © 2026 Svasthya Fresh Infrastructure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
