import { useState, useEffect, useRef } from "react";
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
  Inbox,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getAdminSupportTicketById,
  updateSupportTicketStatus,
  addSupportTicketReply,
  addSupportTicketMessage,
  getSupportTicketMessages,
  markSupportTicketMessagesAsRead,
  getUsers,
  type AdminSupportTicket,
  type SupportTicketStatus as TicketStatus,
  type SupportTicketPriority as TicketPriority,
  type SupportTicketReply as TicketReply,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Badges ───────────────────────────────────────────────────────────────────
const statusCfg: Record<TicketStatus, { cls: string; icon: React.ReactNode; ringCls: string }> = {
  "Open":                 { cls: "bg-blue-50 text-blue-700 border border-blue-200",       ringCls: "ring-blue-300",   icon: <Circle      className="w-3.5 h-3.5" /> },
  "In Progress":          { cls: "bg-amber-50 text-amber-700 border border-amber-200",    ringCls: "ring-amber-300",  icon: <Loader2     className="w-3.5 h-3.5" /> },
  "Waiting for Customer": { cls: "bg-violet-50 text-violet-700 border border-violet-200", ringCls: "ring-violet-300", icon: <Clock       className="w-3.5 h-3.5" /> },
  "Resolved":             { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", ringCls: "ring-emerald-300", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  "Closed":               { cls: "bg-slate-100 text-slate-500 border border-slate-200",   ringCls: "ring-slate-300",  icon: <XCircle     className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const { cls, icon } = statusCfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cls}`}>
      {icon} {status}
    </span>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const allStatuses: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

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
const MessageBubble = ({ reply, ticket }: { reply: TicketReply; ticket: AdminSupportTicket }) => {
  const isAdmin = reply.sender === "Admin" || reply.sender === "ADMIN";
  const isSystem = reply.sender === "System" || reply.sender === "SYSTEM";
  const isContactUs = ticket.order_id === "N/A" && !isAdmin && !isSystem;
  const sentAt = (() => {
    const parsed = parseISO(reply.created_at);
    if (Number.isNaN(parsed.getTime())) return "";
    return format(parsed, "d MMM yyyy, HH:mm");
  })();

  if (isSystem) {
    return (
      <div className="flex justify-center my-3 opacity-90">
        <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
          System: {reply.message}
        </div>
        {sentAt && <div className="ml-2 self-center text-[10px] text-muted-foreground">{sentAt}</div>}
      </div>
    );
  }

  if (isContactUs) {
    return (
      <div className="flex gap-3 py-1">
        <div className="max-w-[75%] space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-semibold text-foreground">{reply.sender_name}</span>
            {sentAt && <span className="text-[10px] text-muted-foreground">{sentAt}</span>}
          </div>
          <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-slate-100 text-foreground rounded-tl-sm border border-slate-200/80 shadow-sm">
            {reply.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 py-1 ${isAdmin ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm border ${
        isAdmin ? "bg-primary text-primary-foreground border-primary/30" : "bg-muted text-muted-foreground border-border"
      }`}>
        {reply.sender_name.charAt(0)}
      </div>
      {/* Bubble */}
      <div className={`max-w-[75%] space-y-1.5 ${isAdmin ? "items-end" : ""}`}>
        <div className={`flex items-center gap-2 px-1 ${isAdmin ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] font-semibold text-foreground">{reply.sender_name}</span>
          {sentAt && <span className="text-[10px] text-muted-foreground">{sentAt}</span>}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm border ${
          isAdmin
            ? "bg-primary text-primary-foreground rounded-tr-sm border-primary/40"
            : "bg-slate-100 text-foreground rounded-tl-sm border-slate-200/80"
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
  const { toast } = useToast();
  const AUTO_CLOSE_HOURS = 48;

  const [ticket, setTicket]               = useState<AdminSupportTicket | null>(null);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>("Open");
  const [conversation, setConversation]   = useState<TicketReply[]>([]);
  const [statusSaved, setStatusSaved]     = useState(false);
  const [replyMessage, setReplyMessage]   = useState("");
  const [sendingReply, setSendingReply]   = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastAutoActionRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const hasConversationChanged = (prev: TicketReply[], next: TicketReply[]) => {
    if (prev.length !== next.length) return true;
    for (let i = 0; i < prev.length; i++) {
      const p = prev[i];
      const n = next[i];
      if (
        p.id !== n.id ||
        p.created_at !== n.created_at ||
        p.message !== n.message ||
        p.sender !== n.sender ||
        p.sender_name !== n.sender_name
      ) {
        return true;
      }
    }
    return false;
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  const mergeConversation = (seedReplies: TicketReply[], messageReplies: TicketReply[]) => {
    const byKey = new Map<string, TicketReply>();
    const put = (reply: TicketReply) => {
      const idKey = String(reply.id || "").trim();
      const fallbackKey = [
        String(reply.sender || "").trim(),
        String(reply.sender_name || "").trim(),
        String(reply.message || "").trim(),
        String(reply.created_at || "").trim(),
      ].join("|");
      const key = idKey ? `id:${idKey}` : `msg:${fallbackKey}`;
      if (!byKey.has(key)) byKey.set(key, reply);
    };

    seedReplies.forEach(put);
    messageReplies.forEach(put);

    return Array.from(byKey.values()).sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return aTime - bTime;
    });
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [conversation]);

  useEffect(() => {
    let isMounted = true;

    const loadTicket = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        if (!ticketId) throw new Error("No ticket ID provided");
        const match = await getAdminSupportTicketById(ticketId);
        if (!isMounted) return;

        if (!match) {
          setTicket(null);
          setCurrentStatus("Open");
          setConversation([]);
          setLoadError("Ticket not found");
          return;
        }

        let enrichedTicket = match;
        if (!String(match.customer_phone ?? "").trim()) {
          try {
            const users = await getUsers();
            const normalizedCustomerId = String(match.customer_id ?? "").trim();
            const normalizedEmail = String(match.customer_email ?? "").trim().toLowerCase();
            const normalizedName = String(match.customer_name ?? "").trim().toLowerCase();
            const matchedUser = users.find((user) => {
              const userId = String(user.id ?? "").trim();
              const userEmail = String(user.email ?? "").trim().toLowerCase();
              const userName = String(user.name ?? "").trim().toLowerCase();
              const sameId = normalizedCustomerId && userId === normalizedCustomerId;
              const sameEmail = normalizedEmail && userEmail === normalizedEmail;
              const sameName = normalizedName && userName === normalizedName;
              return sameId || (!normalizedCustomerId && (sameEmail || sameName));
            });

            if (matchedUser?.mobile) {
              enrichedTicket = {
                ...match,
                customer_phone: matchedUser.mobile,
              };
            }
          } catch {
            // Ignore fallback failures and render ticket as-is.
          }
        }

        setTicket(enrichedTicket);
        setCurrentStatus(enrichedTicket.status);
        
        // Initial fetch of messages
          const fetchedMsgs = await getSupportTicketMessages(enrichedTicket.id);
          setConversation((prev) => {
            const merged = mergeConversation(enrichedTicket.replies ?? [], fetchedMsgs ?? []);
            return hasConversationChanged(prev, merged) ? merged : prev;
          });
        
        // Mark as read
        markSupportTicketMessagesAsRead(enrichedTicket.id);
      } catch (error: any) {
        if (!isMounted) return;
        setLoadError(error?.message || "Failed to load ticket details");
        setTicket(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTicket();
    
    // Poll messages every 5 seconds
    const interval = setInterval(async () => {
      if (ticketId && isMounted) {
         try {
           const match = await getAdminSupportTicketById(ticketId);
           if (!match) return;
             const newMsgs = await getSupportTicketMessages(match.id);
             setConversation((prev) => {
               const merged = mergeConversation(match.replies ?? [], newMsgs ?? []);
               return hasConversationChanged(prev, merged) ? merged : prev;
             });
         } catch(e) {}
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ticketId]);

  useEffect(() => {
    if (!ticket || conversation.length === 0) return;

    const latestReply = conversation[conversation.length - 1];
    const latestTimestamp = new Date(latestReply.created_at).getTime();
    if (Number.isNaN(latestTimestamp)) return;

    const hoursSinceLatest = (Date.now() - latestTimestamp) / (1000 * 60 * 60);
    const isClosed = currentStatus === "Resolved" || currentStatus === "Closed";
    const isCustomerLatest = latestReply.sender === "Customer";

    if (isCustomerLatest && isClosed) {
      const reopenKey = `reopen:${latestReply.id}`;
      if (lastAutoActionRef.current === reopenKey) return;
      lastAutoActionRef.current = reopenKey;

      (async () => {
        try {
          await updateSupportTicketStatus(ticket.id, "In Progress");
          setCurrentStatus("In Progress");
          toast({ title: "Ticket Reopened", description: "A customer reply was received after closure." });
        } catch (error: any) {
          console.error("Failed to reopen ticket", error);
        }
      })();
      return;
    }

    if (!isCustomerLatest || isClosed || hoursSinceLatest < AUTO_CLOSE_HOURS) return;

    const closeKey = `close:${latestReply.id}`;
    if (lastAutoActionRef.current === closeKey) return;
    lastAutoActionRef.current = closeKey;

    (async () => {
      try {
        const systemMessage = "We are closing this ticket as there has been no response. You can reopen it anytime by replying to this thread.";
        const systemReply = await addSupportTicketMessage(ticket.id, systemMessage, "SYSTEM", "Support Bot");
        setConversation((prev) => [...prev, systemReply]);
        await updateSupportTicketStatus(ticket.id, "Resolved");
        setCurrentStatus("Resolved");
        toast({ title: "Ticket Auto-Closed", description: "The ticket was closed after prolonged inactivity." });
      } catch (error: any) {
        console.error("Failed to auto-close ticket", error);
      }
    })();
  }, [conversation, currentStatus, ticket, toast]);

  const updateStatus = async (s: TicketStatus) => {
    const oldStatus = currentStatus;
    setCurrentStatus(s);
    if (!ticket) return;
    try {
      await updateSupportTicketStatus(ticket.id, s);
      setStatusSaved(true);
      toast({ title: "Status Updated", description: "Successfully updated ticket status." });
    } catch (err: any) {
      console.error("Failed to update status", err);
      setCurrentStatus(oldStatus);
      toast({ title: "Update Failed", description: err?.message || "Failed to update ticket status.", variant: "destructive" });
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !ticket) return;
    setSendingReply(true);
    try {
        shouldAutoScrollRef.current = true;
        const newReply = await addSupportTicketReply(ticket.id, replyMessage);
        setConversation(prev => [...prev, newReply]);
        setReplyMessage("");
        toast({ title: "Reply Sent", description: "Your message has been sent to the customer." });
        
        // Auto-update status to In Progress when the thread becomes active again
        if (currentStatus === "Open" || currentStatus === "Resolved" || currentStatus === "Closed") {
           updateStatus("In Progress");
        }
    } catch (err: any) {
        toast({ title: "Failed to send", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
        setSendingReply(false);
    }
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
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-primary">{ticket.ticket_id}</span>
              <span>·</span>
              <span className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                <Inbox className="w-3 h-3" /> {ticket.order_id === "N/A" ? "Contact Us" : "Support Center"}
              </span>
              {ticket.order_id !== "N/A" && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> {ticket.order_id}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – Conversation ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Thread */}
          <GlassCard className="p-0 overflow-hidden border border-border/70 bg-card/95 shadow-sm">
            <div className="px-5 py-3.5 border-b border-border/60 bg-muted/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Customer Message</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">{conversation.length} messages</span>
            </div>
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="p-5 space-y-5 h-[320px] md:h-[400px] overflow-y-scroll overscroll-contain bg-gradient-to-b from-background via-muted/20 to-background [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/40 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50"
            >
              {conversation.map(reply => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <MessageBubble reply={reply} ticket={ticket} />
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Reply Box */}
            <div className="p-4 border-t border-border/60 bg-background/80 backdrop-blur-sm">
              <div className="flex flex-wrap gap-2 mb-3">
                 {ticket?.order_id !== "N/A" && (
                   <>
                     <button onClick={() => setReplyMessage("Your order is currently processing. We will update you once it is packed.")} className="px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200">Order Processing</button>
                     <button onClick={() => setReplyMessage("Your order has been packed and will be dispatched soon.")} className="px-3 py-1.5 text-xs rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200">Order Packed</button>
                     <button onClick={() => setReplyMessage("Your order is on the way and should reach you shortly.")} className="px-3 py-1.5 text-xs rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200">On The Way</button>
                     <button onClick={() => setReplyMessage(`Your order #${ticket.order_id} has been delivered. Thank you!`)} className="px-3 py-1.5 text-xs rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200">Order Delivered</button>
                     <button onClick={() => setReplyMessage(`We regret to inform you that your order #${ticket.order_id} has been cancelled.`)} className="px-3 py-1.5 text-xs rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200">Order Cancelled</button>
                   </>
                 )}
                 <button onClick={() => setReplyMessage("Please upload an image so we can verify your issue.")} className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Ask for Image</button>
                 <button onClick={() => setReplyMessage("We are currently reviewing your request. Please allow some time.")} className="px-3 py-1.5 text-xs rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200">Processing Request</button>
                 <button onClick={() => setReplyMessage("The issue has been resolved from our end.")} className="px-3 py-1.5 text-xs rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200">Issue Resolved</button>
              </div>
              <div className="flex flex-col gap-3">
                <Textarea 
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here... (Will be sent via email)"
                  className="min-h-[96px] resize-y text-sm bg-background border-border/70"
                />
                <div className="flex items-end justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Customer will receive this via email</span>
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim() || sendingReply} className="gap-2 px-6 shadow-sm">
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Attached Images */}
          {ticket.imageUrls && ticket.imageUrls.length > 0 && (
            <GlassCard className="p-0 overflow-hidden mt-4">
              <div className="px-5 py-3.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <span className="font-semibold text-sm">Attached Images</span>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {ticket.imageUrls.map((imgUrl, i) => (
                  <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block w-full aspect-square border rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={imgUrl} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </GlassCard>
          )}

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
                <InfoRow icon={<Inbox className="w-4 h-4" />} label="Source" value={ticket.order_id === "N/A" ? "Contact Us" : "Support Center"} />
                {ticket.order_id !== "N/A" && <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={ticket.customer_name} />}
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={ticket.customer_email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={ticket.customer_phone || "Not available"} />
                <InfoRow icon={<LifeBuoy className="w-4 h-4" />} label="Ticket ID" value={ticket.ticket_id} />
                {ticket.order_id !== "N/A" && (
                  <InfoRow icon={<ShoppingBag className="w-4 h-4" />} label="Order ID" value={ticket.order_id} />
                )}
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
              <div className="p-6 relative">
                 <div className="absolute top-[42px] left-[10%] right-[10%] h-0.5 bg-border z-0 -translate-y-1/2" />
                 <div className="relative z-10 flex justify-between">
                    {allStatuses.map((s, i) => {
                      const active = currentStatus === s;
                      const isPast = allStatuses.indexOf(currentStatus) >= i;
                      
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus(s)}
                          className="flex flex-col items-center gap-2 group outline-none"
                        >
                          <div className={cn(
                            "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-card border-2",
                            active ? `border-primary text-primary shadow-sm` : isPast ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-border text-muted-foreground hover:border-primary/30 bg-muted/30"
                          )}>
                             {isPast && !active ? <CheckCircle2 className="w-5 h-5" /> : statusCfg[s].icon}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={cn("text-xs font-semibold whitespace-nowrap", active ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                            {isPast && <span className="text-[10px] text-muted-foreground mt-0.5">{s === "Open" ? format(parseISO(ticket.created_at), "d MMM yyyy, HH:mm") : format(parseISO(ticket.updated_at), "d MMM yyyy, HH:mm")}</span>}
                          </div>
                        </button>
                      );
                    })}
                 </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetails;
