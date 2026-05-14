interface StatusBadgeProps {
  status: string;
  variant?: "green" | "yellow" | "blue" | "red" | "gray";
}

const variantStyles: Record<string, string> = {
  green:  "bg-primary/10 text-primary border-primary/20",
  yellow: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  blue:   "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800",
  red:    "bg-destructive/10 text-destructive border-destructive/20",
  gray:   "bg-muted text-muted-foreground border-border",
};

const dotStyles: Record<string, string> = {
  green:  "bg-primary",
  yellow: "bg-amber-500",
  blue:    "bg-teal-500",
  red:    "bg-destructive",
  gray:   "bg-muted-foreground",
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const normalized = String(status ?? "").trim().toLowerCase();
  const inferredVariant =
    normalized === "inactive" || normalized === "disabled" || normalized === "blocked"
      ? "red"
      : "green";
  const resolvedVariant = variant ?? inferredVariant;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${variantStyles[resolvedVariant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[resolvedVariant]}`} />
      {status}
    </span>
  );
}
