import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  ShoppingBag,
  CalendarDays,
  Send,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  Clock,
  LifeBuoy,
  AlertCircle,
  Zap,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getAdminQueries,
  type AdminSupportTicket,
  type SupportTicketStatus as TicketStatus,
  type SupportTicketPriority as TicketPriority,
  type SupportTicketReply as TicketReply,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Badges ───────────────────────────────────────────────────────────────────
const statusCfg: Record<TicketStatus, { cls: string; icon: React.ReactNode; ringCls: string }> = {
  "Open":                 { cls: "bg-blue-50 text-blue-700 border border-blue-200",       ringCls: "ring-blue-300",   icon: <Circle      className="w-3.5 h-3.5" /> },
  "In Progress":          { cls: "bg-amber-50 text-amber-700 border border-amber-200",    ringCls: "ring-amber-300",  icon: <Loader2     className="w-3.5 h-3.5" /> },
  "Waiting for Customer": { cls: "bg-violet-50 text-violet-700 border border-violet-200", ringCls: "ring-violet-300", icon: <Clock       className="w-3.5 h-3.5" /> },
  "Resolved":             { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", ringCls: "ring-emerald-300", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  "Closed":               { cls: "bg-slate-100 text-slate-500 border border-slate-200",   ringCls: "ring-slate-300",  icon: <XCircle     className="w-3.5 h-3.5" /> },
};

const priorityCls: Record<TicketPriority, string> = {
  Low:    "bg-slate-100 text-slate-500",
  Medium: "bg-sky-50 text-sky-700",
  High:   "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-600",
};

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const { cls, icon } = statusCfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cls}`}>
      {icon} {status}
    </span>
  );
};

// ─── Quick reply templates ────────────────────────────────────────────────────
const QUICK_REPLIES = [
  "Thank you for reaching out. We're looking into your issue and will update you shortly.",
  "Your order has been processed and is on its way. You'll receive a tracking link soon.",
  "We've initiated a refund for your order. It should reflect within 5–7 business days.",
  "Could you please share more details so we can assist you better?",
  "We sincerely apologize for the inconvenience. Our team is actively working on a resolution.",
  "Your issue has been resolved. Please don't hesitate to reach out if you need further assistance.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const allStatuses: TicketStatus[] = ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
    <div className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground break-all">{value}</p>
    </div>
  </div>
);

// ─── Timeline message bubble ──────────────────────────────────────────────────
const MessageBubble = ({ reply }: { reply: TicketReply }) => {
  const isAdmin = reply.sender === "Admin";
  return (
    <div className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        {reply.sender_name.charAt(0)}
      </div>
      {/* Bubble */}
      <div className={`max-w-[75%] space-y-1 ${isAdmin ? "items-end" : ""}`}>
        <div className={`flex items-center gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-semibold text-foreground">{reply.sender_name}</span>
          <span className="text-xs text-muted-foreground">{format(parseISO(reply.created_at), "d MMM yyyy, HH:mm")}</span>
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAdmin
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        }`}>
          {reply.message}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const TicketDetails = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket]               = useState<AdminSupportTicket | null>(null);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>("Open");
  const [conversation, setConversation]   = useState<TicketReply[]>([]);
  const [replyText, setReplyText]         = useState("");
  const [repliedBy, setRepliedBy]         = useState("Admin");
  const [statusSaved, setStatusSaved]     = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadTicket = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const list = await getAdminQueries();
        if (!isMounted) return;

        const match = list.find((item) => item.id === ticketId || item.ticket_id === ticketId);
        if (!match) {
          setTicket(null);
          setCurrentStatus("Open");
          setConversation([]);
          setLoadError("Ticket not found");
          return;
        }

        setTicket(match);
        setCurrentStatus(match.status);
        setConversation(match.replies ?? []);
      } catch (error: any) {
        if (!isMounted) return;
        setLoadError(error?.message || "Failed to load ticket details");
        setTicket(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTicket();
    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const updateStatus = (s: TicketStatus) => {
    setCurrentStatus(s);
    setStatusSaved(true);
  };

  useEffect(() => {
    if (!statusSaved) return;
    const t = setTimeout(() => setStatusSaved(false), 1800);
    return () => clearTimeout(t);
  }, [statusSaved]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p>Loading ticket details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <LifeBuoy className="w-12 h-12 text-muted-foreground opacity-40" />
          <h2 className="text-xl font-semibold">{loadError ? loadError : "Ticket Not Found"}</h2>
          <button onClick={() => navigate("/support/all")} className="text-primary text-sm hover:underline">← Back to All Tickets</button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const newReply: TicketReply = {
      id: `r-new-${Date.now()}`,
      ticket_id: ticket.ticket_id,
      sender: "Admin",
      sender_name: repliedBy || "Admin",
      message: replyText.trim(),
      created_at: new Date().toISOString(),
    };
    setConversation(prev => [...prev, newReply]);
    setReplyText("");
    if (currentStatus === "Open") updateStatus("In Progress");
  };

  return (
    <DashboardLayout>
      {/* Back nav */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/support/all")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to All Tickets
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
              <StatusBadge status={currentStatus} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${priorityCls[ticket.priority]}`}>
                <AlertCircle className="w-3 h-3 mr-1" /> {ticket.priority}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-primary">{ticket.ticket_id}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> {ticket.order_id}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {format(parseISO(ticket.created_at), "d MMMM yyyy, HH:mm")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – Conversation ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Thread */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Conversation ({conversation.length})</span>
            </div>
            <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">
              {conversation.map(reply => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <MessageBubble reply={reply} />
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Reply box */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Reply to Customer</span>
            </div>
            <div className="p-5 space-y-4">
              {/* Quick replies */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Replies</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newReply: TicketReply = {
                          id: `r-new-${Date.now()}-${i}`,
                          ticket_id: ticket.ticket_id,
                          sender: "Admin",
                          sender_name: repliedBy || "Admin",
                          message: msg,
                          created_at: new Date().toISOString(),
                        };
                        setConversation(prev => [...prev, newReply]);
                        if (currentStatus === "Open") updateStatus("In Progress");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/40 text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-left max-w-xs truncate"
                      title={msg}
                    >
                      {msg.length > 48 ? msg.slice(0, 48) + "…" : msg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Custom reply */}
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type a custom reply…"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Replied by:</label>
                    <input
                      value={repliedBy}
                      onChange={e => setRepliedBy(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()} className="gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right – Info & Status ───────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Customer info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <GlassCard className="p-0 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Customer Information</span>
              </div>
              <div className="px-5 py-2">
                <InfoRow icon={<User         className="w-4 h-4" />} label="Full Name"    value={ticket.customer_name} />
                <InfoRow icon={<Mail         className="w-4 h-4" />} label="Email"         value={ticket.customer_email} />
                <InfoRow icon={<Phone        className="w-4 h-4" />} label="Phone"         value={ticket.customer_phone} />
                <InfoRow icon={<ShoppingBag  className="w-4 h-4" />} label="Order ID"      value={ticket.order_id} />
                <InfoRow icon={<LifeBuoy     className="w-4 h-4" />} label="Ticket ID"     value={ticket.ticket_id} />
                <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Submitted"     value={format(parseISO(ticket.created_at), "d MMMM yyyy, HH:mm")} />
              </div>
            </GlassCard>
          </motion.div>

          {/* Status management */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
            <GlassCard className="p-0 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Update Status</span>
                <AnimatePresence>
                  {statusSaved && (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-auto text-[11px] font-semibold text-emerald-600 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-4 space-y-2">
                {allStatuses.map(s => {
                  const active = currentStatus === s;
                  const { cls, ringCls } = statusCfg[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        active ? `${cls} ring-2 ring-offset-1 ${ringCls}` : "border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {statusCfg[s].icon}
                      {s}
                      {active && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-current" />}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetails;
