import { GlassCard } from "../shared/GlassCard";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, GRID_PROPS } from "@/lib/chartConfig";

export function PlaceholderReport({ title }: { title: string }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    {title}
                </h3>
            </div>
            <GlassCard className="p-12 flex items-center justify-center flex-col gap-4 text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                    <span className="text-2xl opacity-50">📊</span>
                </div>
                <h4 className="text-lg font-medium">Report Under Construction</h4>
                <p className="text-muted-foreground text-sm max-w-md">
                    The {title} data visualizations are currently being integrated.
                    Check back soon for detailed insights.
                </p>
            </GlassCard>
        </div>
    );
}
