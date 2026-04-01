import { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Professional card component — clean white surface with a subtle border
 * and soft shadow. Used across the entire app.
 */
export function GlassCard({ children, className = "", hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border shadow-sm",
        hover && "card-hover cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
