import { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  unit?: string;
  subtitle?: string;
  color?: "emerald" | "blue" | "purple" | "amber" | "pink" | "cyan" | "red" | "indigo";
  className?: string;
  index?: number;
}

const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: "text-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "text-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    icon: "text-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "text-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/30",
    icon: "text-pink-500",
    text: "text-pink-600 dark:text-pink-400",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    icon: "text-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: "text-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    icon: "text-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

export function KPICard({
  title,
  value,
  icon,
  trend,
  unit,
  subtitle,
  color = "blue",
  className = "",
  index = 0,
}: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-border transition-all hover:shadow-lg ${className}`}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.bg} p-2.5 rounded-lg flex-shrink-0`}>
          <div className={`w-5 h-5 ${colors.icon}`}>{icon}</div>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-foreground truncate">
              {value}
            </p>
            {unit && (
              <p className="text-sm text-muted-foreground font-medium">{unit}</p>
            )}
          </div>
        </div>

        {trend && (
          <div
            className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              trend.direction === "up"
                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
        color === "emerald" ? "from-emerald-500/0 via-emerald-500 to-emerald-500/0" :
        color === "blue" ? "from-blue-500/0 via-blue-500 to-blue-500/0" :
        color === "purple" ? "from-purple-500/0 via-purple-500 to-purple-500/0" :
        color === "amber" ? "from-amber-500/0 via-amber-500 to-amber-500/0" :
        color === "pink" ? "from-pink-500/0 via-pink-500 to-pink-500/0" :
        color === "cyan" ? "from-cyan-500/0 via-cyan-500 to-cyan-500/0" :
        color === "red" ? "from-red-500/0 via-red-500 to-red-500/0" :
        "from-indigo-500/0 via-indigo-500 to-indigo-500/0"
      } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  );
}
