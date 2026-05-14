/**
 * Shared chart configuration used across all analytics reports.
 * Centralising these ensures visual consistency site-wide.
 */

/** Professional 6-color palette — works on both light and dark backgrounds */
export const CHART_COLORS = [
    "#16a34a", // forest green  (primary)
    "#3b82f6", // royal blue
    "#8b5cf6", // indigo
    "#f59e0b", // amber
    "#ef4444", // crimson
    "#06b6d4", // teal
] as const;

/** Recharts tooltip style — matches the app's glass card design */
export const TOOLTIP_STYLE = {
    backgroundColor: "hsl(0 0% 100%)",
    border: "1px solid hsl(220 14% 88%)",
    borderRadius: "10px",
    fontSize: "12px",
    fontFamily: "'Inter', system-ui, sans-serif",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    color: "hsl(220 20% 12%)",
    padding: "8px 12px",
} as const;

/** Recharts axis tick style */
export const AXIS_STYLE = {
    fontSize: 11,
    fontFamily: "'Inter', system-ui, sans-serif",
    fill: "hsl(220 10% 46%)",
} as const;

/** Recharts grid props */
export const GRID_PROPS = {
    stroke: "hsl(220 14% 90%)",
    strokeDasharray: "0",  // solid, very faint
} as const;
