import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { adminResetPassword } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { token: routeToken } = useParams();
  const token = useMemo(() => {
    const searchToken = new URLSearchParams(location.search).get("token") || "";
    return (routeToken && routeToken !== "undefined") ? routeToken : searchToken;
  }, [location.search, routeToken]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("This link is invalid or has expired. Please request a new one.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New Password and Confirm Password must match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await adminResetPassword(token, newPassword);
      const message = response?.message || "Password reset successfully!";
      setSuccessMessage(message);
      toast({ title: "Password Reset", description: message });
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message = status === 400
        ? "This link is invalid or has expired. Please request a new one."
        : error instanceof Error
          ? error.message
          : "Unable to reset password. Please try again.";
      setErrorMessage(message);
      toast({ title: "Reset Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-inter overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 z-10" />
        <img
          src="/brand-auth.png"
          alt="Fresh Produce"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-float"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent z-20 flex flex-col justify-end p-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-xl">
              <span className="text-primary font-bold text-2xl">S</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Set New Password</h2>
            <p className="text-white/80 text-lg max-w-md leading-relaxed">
              Securely create a new password for your admin account.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-[420px]">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-10 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-[#111827] mb-3 tracking-tight">Reset Password</h1>
              <p className="text-[#6B7280] font-medium">
                Enter your new password below to complete the reset.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setErrorMessage("");
                      setSuccessMessage("");
                      setNewPassword(e.target.value);
                    }}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setErrorMessage("");
                      setSuccessMessage("");
                      setConfirmPassword(e.target.value);
                    }}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                    placeholder="Confirm new password"
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
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-700">Reset Failed</p>
                      <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-700">Password Reset</p>
                      <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">{successMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isLoading || !token}
                  className="flex-1 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Reset Password <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B7280]">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Reset links expire after 30 minutes
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                Please choose a strong password you have not used before.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 text-center">
          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            © 2026 Svasthya Fresh Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;