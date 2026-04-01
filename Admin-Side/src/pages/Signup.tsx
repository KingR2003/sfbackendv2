import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, ShieldCheck, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { adminRegister } from "@/lib/api";

const Signup = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        secretKey: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Validation for mobile: only numbers and max 10 digits
        if (name === "mobile") {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setFormData((prev) => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const res = await adminRegister(
                formData.name,
                formData.email,
                formData.mobile,
                formData.password,
                formData.secretKey
            );

            if (res.success) {
                toast({
                    title: "Registration Successful",
                    description: "Your admin account has been created. Please sign in.",
                });
                navigate("/login");
            } else {
                toast({
                    title: "Registration Failed",
                    description: res.message || "Something went wrong. Please try again.",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Connection Error",
                description: "Unable to reach the server. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen w-full flex bg-background font-inter overflow-hidden">
            {/* Left Side: Brand Imagery (Desktop Only) */}
            <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-900/10 z-10" />
                <img
                    src="/brand-signup.png"
                    alt="Herbs and Spices"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent z-20 flex flex-col justify-end p-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-xl">
                            <ShieldCheck className="text-primary w-7 h-7" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Join the Infrastructure</h2>
                        <p className="text-white/80 text-lg max-w-md leading-relaxed">
                            Apply for administrative credentials to help manage our sustainable supply chain.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Formal Signup Form */}
            <div className="w-full lg:w-3/5 flex items-center justify-center p-8 md:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-[580px]">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="mb-10 lg:hidden text-center">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-white font-bold text-xl uppercase tracking-tighter">S</span>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h1 className="text-3xl font-extrabold text-[#111827] mb-3 tracking-tight">Create Account</h1>
                            <p className="text-[#6B7280] font-medium leading-relaxed">
                                Join the infrastructure team. Complete your profile to continue.
                            </p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
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
                                            value={formData.secretKey}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-orange-50/30 border border-orange-100 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-mono"
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
                                            value={formData.email}
                                            onChange={handleInputChange}
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
                                            value={formData.mobile}
                                            onChange={handleInputChange}
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
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
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

                                    {/* Premium Strength Indicator */}
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Security Strength</span>
                                            <span className={`text-[11px] font-bold transition-colors duration-300 ${(() => {
                                                const rulesMet = [
                                                    formData.password.length >= 8,
                                                    /[A-Z]/.test(formData.password),
                                                    /[0-9]/.test(formData.password),
                                                    /[^A-Za-z0-9]/.test(formData.password)
                                                ].filter(Boolean).length;
                                                if (formData.password.length === 0) return 'text-gray-300';
                                                if (rulesMet <= 1) return 'text-red-500';
                                                if (rulesMet === 2) return 'text-amber-500';
                                                if (rulesMet === 3) return 'text-blue-500';
                                                return 'text-green-500';
                                            })()
                                                }`}>
                                                {(() => {
                                                    const rulesMet = [
                                                        formData.password.length >= 8,
                                                        /[A-Z]/.test(formData.password),
                                                        /[0-9]/.test(formData.password),
                                                        /[^A-Za-z0-9]/.test(formData.password)
                                                    ].filter(Boolean).length;
                                                    if (formData.password.length === 0) return 'Empty';
                                                    if (rulesMet <= 1) return 'Weak';
                                                    if (rulesMet === 2) return 'Fair';
                                                    if (rulesMet === 3) return 'Good';
                                                    return 'Very Strong';
                                                })()}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min((([
                                                        formData.password.length >= 8,
                                                        /[A-Z]/.test(formData.password),
                                                        /[0-9]/.test(formData.password),
                                                        /[^A-Za-z0-9]/.test(formData.password)
                                                    ].filter(Boolean).length) / 4) * 100, 100)}%`,
                                                    backgroundColor: (() => {
                                                        const rulesMet = [
                                                            formData.password.length >= 8,
                                                            /[A-Z]/.test(formData.password),
                                                            /[0-9]/.test(formData.password),
                                                            /[^A-Za-z0-9]/.test(formData.password)
                                                        ].filter(Boolean).length;
                                                        if (rulesMet <= 1) return '#ef4444'; // Red
                                                        if (rulesMet === 2) return '#f59e0b'; // Amber
                                                        if (rulesMet === 3) return '#3b82f6'; // Blue
                                                        return '#10b981'; // Green
                                                    })()
                                                }}
                                                className="h-full rounded-full transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {formData.password && formData.confirmPassword && (
                                        <div className={`text-[11px] font-bold mt-1 px-1 flex items-center gap-1 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                            {formData.password === formData.confirmPassword ? (
                                                <><Check className="w-3 h-3" /> Match</>
                                            ) : (
                                                <><ShieldCheck className="w-3 h-3" /> No match</>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
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
                                            Sign Up <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>

                        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
                            <span className="text-gray-500">Already part of the team?</span>
                            <Link to="/login" className="text-primary font-bold hover:underline flex items-center gap-1 group">
                                Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
