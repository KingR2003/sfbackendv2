import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

function toDateAndTime(value: string): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: "00:00" };

  // Fast path for our local persisted format: yyyy-MM-ddTHH:mm
  const localMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (localMatch) {
    const [, datePart, hh, mm] = localMatch;
    return {
      date: new Date(`${datePart}T00:00:00`),
      time: `${hh}:${mm}`,
    };
  }

  // Support common 12-hour formats: yyyy-MM-dd HH:mm AM/PM or yyyy-MM-ddTHH:mm PM
  const twelveHourMatch = value.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    const [, datePart, h12Raw, mmRaw, meridiemRaw] = twelveHourMatch;
    const h12 = Number.parseInt(h12Raw, 10);
    const mm = Number.parseInt(mmRaw, 10);
    const meridiem = meridiemRaw.toUpperCase();
    const clampedMinute = Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0;
    const safeH12 = Number.isFinite(h12) ? Math.min(12, Math.max(1, h12)) : 12;
    const h24 = meridiem === "AM"
      ? (safeH12 === 12 ? 0 : safeH12)
      : (safeH12 === 12 ? 12 : safeH12 + 12);
    return {
      date: new Date(`${datePart}T00:00:00`),
      time: `${pad2(h24)}:${pad2(clampedMinute)}`,
    };
  }

  // Handle external values (seconds/timezone/space-separated) safely.
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const datePart = format(parsed, "yyyy-MM-dd");
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    return {
      date: new Date(`${datePart}T00:00:00`),
      time: `${hh}:${mm}`,
    };
  }

  // Last-resort fallback if parser fails.
  const [firstToken = "", ...restTokens] = value.trim().split(/\s+/);
  const fallbackSplit = firstToken.includes("T")
    ? firstToken.split("T")
    : [firstToken, restTokens.join(" ")];
  const dateToken = fallbackSplit[0] ?? "";
  const timeToken = (fallbackSplit[1] ?? restTokens.join(" ") ?? "00:00").trim();
  const fallbackDate = dateToken ? new Date(`${dateToken}T00:00:00`) : undefined;
  return {
    date: fallbackDate && !Number.isNaN(fallbackDate.getTime()) ? fallbackDate : undefined,
    time: normalizeTime(timeToken),
  };
}

function toISO(date: Date | undefined, time: string): string {
  if (!date) return "";
  return `${format(date, "yyyy-MM-dd")}T${time}`;
}

// ── Analog Clock ───────────────────────────────────────────────────────────
const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 85;

function handXY(angleDeg: number, len: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * len, y: CY + Math.sin(rad) * len };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function normalizeTime(time: string): string {
  const raw = (time || "").trim();

  const meridiemMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (meridiemMatch) {
    const [, h12Raw, mRaw, meridiemRaw] = meridiemMatch;
    const h12 = Number.parseInt(h12Raw, 10);
    const minute = Number.parseInt(mRaw, 10);
    const safeH12 = Number.isFinite(h12) ? Math.min(12, Math.max(1, h12)) : 12;
    const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0;
    const meridiem = meridiemRaw.toUpperCase();
    const h24 = meridiem === "AM"
      ? (safeH12 === 12 ? 0 : safeH12)
      : (safeH12 === 12 ? 12 : safeH12 + 12);
    return `${pad2(h24)}:${pad2(safeMinute)}`;
  }

  const plainMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  const parsedH = plainMatch ? Number.parseInt(plainMatch[1], 10) : Number.parseInt(raw.split(":")[0] || "0", 10);
  const parsedM = plainMatch ? Number.parseInt(plainMatch[2], 10) : Number.parseInt(raw.split(":")[1] || "0", 10);
  const h = Number.isFinite(parsedH) ? Math.min(23, Math.max(0, parsedH)) : 0;
  const m = Number.isFinite(parsedM) ? Math.min(59, Math.max(0, parsedM)) : 0;
  return `${pad2(h)}:${pad2(m)}`;
}


function AnalogClockPicker({ time, onChange, onConfirm }: { time: string; onChange: (t: string) => void; onConfirm: () => void }) {
  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  const svgRef = useRef<SVGSVGElement>(null);

  const normalizedTime = normalizeTime(time);
  const [hStr, mStr] = normalizedTime.split(":");
  const h24 = Number.parseInt(hStr, 10) || 0;
  const mins = Number.parseInt(mStr, 10) || 0;
  const h12 = h24 % 12;
  const isAM = h24 < 12;

  const hourDeg = (h12 + mins / 60) * 30;
  const minDeg = mins * 6;
  const hourTip = handXY(hourDeg, 64);
  const minTip = handXY(minDeg, 90);
  const activeTip = mode === "hours" ? hourTip : minTip;

  const setMeridiem = (meridiem: "AM" | "PM") => {
    const baseHour12 = h12 === 0 ? 12 : h12;
    const newH = meridiem === "AM"
      ? (baseHour12 === 12 ? 0 : baseHour12)
      : (baseHour12 === 12 ? 12 : baseHour12 + 12);
    onChange(`${pad2(newH)}:${pad2(mins)}`);
  };

  const stepHour = (delta: number) => {
    const newH = ((h24 + delta + 24) % 24);
    onChange(`${pad2(newH)}:${pad2(mins)}`);
  };

  const stepMinute = (delta: number) => {
    const newM = ((mins + delta + 60) % 60);
    onChange(`${pad2(h24)}:${pad2(newM)}`);
  };

  // Unified face click — works for both hours and minutes
  const handleFaceClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * SIZE;
    let deg = Math.atan2(py - CY, px - CX) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    if (mode === "hours") {
      const h12val = Math.round(deg / 30) % 12; // 0 = 12 on face
      const newH24 = isAM ? h12val : h12val + 12;
      onChange(`${pad2(newH24)}:${pad2(mins)}`);
      // stay in hours mode so user can see the hand move
    } else {
      const m = Math.round((deg / 360) * 60) % 60;
      onChange(`${pad2(h24)}:${pad2(m)}`);
    }
  };

  // Hour number positions
  const hourNums = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i;
    const pos = handXY(i * 30, R - 22);
    const active = mode === "hours" && (n === h12 || (n === 12 && h12 === 0));
    return { n, ...pos, active };
  });

  // Minute tick marks
  const minuteMarks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0;
    const outer = handXY(i * 6, R - 2);
    const inner = handXY(i * 6, big ? R - 10 : R - 6);
    const active = mode === "minutes" && i === mins;
    return { outer, inner, big, active };
  });

  const stepBtn = "w-9 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-xs font-bold select-none";

  return (
    <div className="flex flex-col items-center gap-3 px-3 py-3 w-full">

      {/* AM/PM SECTION */}
      <div className="flex items-center justify-center gap-3 w-full">
        <span className="text-sm font-medium">TIME:</span>
        <select
          value={isAM ? "AM" : "PM"}
          onChange={(e) => setMeridiem(e.target.value as "AM" | "PM")}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {/* Hour/Minute Stepper + Digital readout */}
      <div className="flex items-center justify-center gap-1">
        {/* Hour stepper */}
        <div className="flex flex-col items-center gap-0.5">
          <button type="button" onClick={() => stepHour(1)} className={stepBtn}>▲</button>
          <button
            type="button"
            onClick={() => setMode("hours")}
            className={cn(
              "w-11 h-10 rounded-xl text-2xl font-bold tabular-nums transition-all",
              mode === "hours" ? "bg-primary text-primary-foreground shadow" : "text-foreground/80 hover:bg-muted"
            )}
          >
            {String(h12 === 0 ? 12 : h12).padStart(2, "0")}
          </button>
          <button type="button" onClick={() => stepHour(-1)} className={stepBtn}>▼</button>
        </div>

        <span className="text-2xl font-bold text-muted-foreground pb-0 mx-0.5">:</span>

        {/* Minute stepper */}
        <div className="flex flex-col items-center gap-0.5">
          <button type="button" onClick={() => stepMinute(1)} className={stepBtn}>▲</button>
          <button
            type="button"
            onClick={() => setMode("minutes")}
            className={cn(
              "w-11 h-10 rounded-xl text-2xl font-bold tabular-nums transition-all",
              mode === "minutes" ? "bg-primary text-primary-foreground shadow" : "text-foreground/80 hover:bg-muted"
            )}
          >
            {mStr.padStart(2, "0")}
          </button>
          <button type="button" onClick={() => stepMinute(-1)} className={stepBtn}>▼</button>
        </div>
      </div>

      {/* Clock face */}
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onClick={handleFaceClick}
        className="cursor-pointer mt-1"
        style={{ userSelect: "none", touchAction: "none" }}
      >
        {/* Face */}
        <circle cx={CX} cy={CY} r={R} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Shaded ring for active mode */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="hsl(var(--primary)/0.06)" strokeWidth="18" />

        {/* Minute tick marks */}
        {minuteMarks.map((m, i) => (
          <line key={i}
            x1={m.outer.x} y1={m.outer.y} x2={m.inner.x} y2={m.inner.y}
            stroke={m.active ? "hsl(var(--primary))" : m.big ? "hsl(var(--foreground)/0.3)" : "hsl(var(--foreground)/0.12)"}
            strokeWidth={m.big ? 2 : 1} strokeLinecap="round"
          />
        ))}

        {/* Hour numbers */}
        {hourNums.map(n => (
          <g key={n.n} style={{ cursor: "pointer" }}>
            {n.active && <circle cx={n.x} cy={n.y} r={15} fill="hsl(var(--primary))" />}
            <circle cx={n.x} cy={n.y} r={14} fill="transparent" />
            <text
              x={n.x} y={n.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="13" fontWeight={n.active ? "700" : "500"}
              fill={n.active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground)/0.7)"}
            >
              {n.n}
            </text>
          </g>
        ))}

        {/* Active track line */}
        <line x1={CX} y1={CY} x2={activeTip.x} y2={activeTip.y}
          stroke="hsl(var(--primary)/0.12)" strokeWidth="20" strokeLinecap="round" />

        {/* Hour hand — always visible; brighter when active */}
        <line x1={CX} y1={CY} x2={hourTip.x} y2={hourTip.y}
          stroke={mode === "hours" ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
          strokeWidth="3.5" strokeLinecap="round"
        />

        {/* Minute hand — always visible; brighter when active */}
        <line x1={CX} y1={CY} x2={minTip.x} y2={minTip.y}
          stroke={mode === "minutes" ? "hsl(var(--primary))" : "hsl(var(--foreground)/0.4)"}
          strokeWidth="2.5" strokeLinecap="round"
        />

        {/* Tip glow on active hand only */}
        <circle cx={activeTip.x} cy={activeTip.y} r={10} fill="hsl(var(--primary))" opacity="0.25" />
        <circle cx={activeTip.x} cy={activeTip.y} r={6} fill="hsl(var(--primary))" />

        {/* Center pivot */}
        <circle cx={CX} cy={CY} r={5} fill="hsl(var(--foreground))" />
        <circle cx={CX} cy={CY} r={2.5} fill="hsl(var(--primary))" />
      </svg>

      <p className="text-[11px] text-muted-foreground tracking-wide -mt-1">
        {mode === "hours" ? "Tap clock or ▲▼ to set hour" : "Tap clock or ▲▼ to set minute"}
      </p>

      {/* Confirm button */}
      <button
        type="button"
        onClick={onConfirm}
        className="mt-1 flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors"
      >
        OK
      </button>
    </div>
  );
}

// ── Main DateTimePicker ────────────────────────────────────────────────────
export function DateTimePicker({ value, onChange, placeholder = "Pick date & time", error }: Props) {
  const { date, time } = toDateAndTime(value);
  const [open, setOpen] = useState(false);

  // localTime lets the clock work even before a date is selected
  const [localTime, setLocalTime] = useState(time);

  // Keep localTime in sync if value is changed externally (e.g. form reset)
  useEffect(() => {
    setLocalTime(toDateAndTime(value).time);
  }, [value]);

  const handleDaySelect = (day: Date | undefined) => onChange(toISO(day, localTime));
  const handleTimeChange = (t: string) => {
    setLocalTime(t);
    // If user changes time without selecting a date first, default to today
    const selectedDate = date || new Date(); 
    onChange(toISO(selectedDate, t));
  };

  const displayValue = date
    ? `${format(date, "dd MMM yyyy")} • ${format(new Date(`2000-01-01T${localTime}`), "h:mm aa")}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 gap-2",
            !displayValue && "text-muted-foreground",
            error && "border-destructive",
          )}
        >
          <CalendarIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{displayValue ?? placeholder}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" side="right" sideOffset={8} className="z-[9999] p-0 w-fit overflow-visible">
        <div className="flex flex-row w-fit">
          <Calendar mode="single" selected={date} onSelect={handleDaySelect} initialFocus className="flex-shrink-0" />
          <div className="border-l border-border flex-shrink-0">
            <AnalogClockPicker time={localTime} onChange={handleTimeChange} onConfirm={() => setOpen(false)} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


