import { ChangeEvent, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSupportTicket } from "@/lib/api";
import {
  buildScenarioFromText,
  detectOrderIssue,
  getSupportScenario,
  type OrderIssueType,
  type SupportIntent,
  type SupportScenario,
} from "@/lib/supportChatbot";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  FileText,
  Headphones,
  Inbox,
  PackageSearch,
  Paperclip,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  Truck,
  Upload,
  User,
  Clock3,
} from "lucide-react";

type ChatEntry = {
  id: string;
  role: "System" | "Customer";
  text: string;
};

const QUICK_ACTIONS: Array<{
  intent: SupportIntent;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    intent: "order_issue",
    label: "Order Issue",
    description: "Damaged, wrong, or missing item",
    icon: <PackageSearch className="w-4 h-4" />,
  },
  {
    intent: "where_is_my_order",
    label: "Where is my Order?",
    description: "Track a shipment or check transit status",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    intent: "payment_issue",
    label: "Payment Issue",
    description: "Deducted amount, refund, or failed payment",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    intent: "request_call",
    label: "Request a Call",
    description: "High priority callback within 24 hours",
    icon: <PhoneCall className="w-4 h-4" />,
  },
];

const ORDER_ISSUES: Array<{
  key: OrderIssueType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: "damaged_item",
    label: "Damaged Item",
    description: "Broken, cracked, or leaking product",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    key: "wrong_product",
    label: "Wrong Product",
    description: "A different item arrived in the parcel",
    icon: <Inbox className="w-4 h-4" />,
  },
  {
    key: "missing_item",
    label: "Missing Item",
    description: "Something from the order is missing",
    icon: <AlertCircle className="w-4 h-4" />,
  },
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function getIntentLabel(intent: SupportIntent) {
  switch (intent) {
    case "order_issue":
      return "Order Issue";
    case "where_is_my_order":
      return "Where is my Order?";
    case "payment_issue":
      return "Payment Issue";
    case "request_call":
      return "Request a Call";
    default:
      return "General Support";
  }
}

function getDefaultCustomerMessage(scenario: SupportScenario, issueType: OrderIssueType, fallback = "") {
  if (scenario.intent === "order_issue") {
    if (issueType === "wrong_product") return "I received the wrong item.";
    if (issueType === "missing_item") return "My order is missing an item.";
    return "My order arrived damaged.";
  }

  if (scenario.intent === "where_is_my_order") return "Where is my order?";
  if (scenario.intent === "payment_issue") return "I need help with a payment issue.";
  if (scenario.intent === "request_call") return "Please arrange a callback within 24 hours.";
  return fallback || "I need help with my order.";
}

export default function OrderQueryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<SupportIntent | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<OrderIssueType>(null);
  const [scenario, setScenario] = useState<SupportScenario | null>(null);
  const [customerMessage, setCustomerMessage] = useState("");
  const [freeText, setFreeText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [conversation, setConversation] = useState<ChatEntry[]>([
    {
      id: "welcome",
      role: "System",
      text: "How can we help you? Choose one of the options below or describe your issue in your own words.",
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pushConversation = (role: ChatEntry["role"], text: string) => {
    setConversation((prev) => [...prev, { id: makeId(), role, text }]);
  };

  const applyScenario = (nextScenario: SupportScenario, issueType: OrderIssueType = null) => {
    setScenario(nextScenario);
    setSelectedIntent(nextScenario.intent);
    setSelectedIssue(issueType);
    const nextMessage = getDefaultCustomerMessage(nextScenario, issueType, freeText.trim());
    setCustomerMessage(nextMessage);
  };

  const handleQuickAction = (intent: SupportIntent) => {
    setError(null);
    setSuccess(null);
    const nextScenario = getSupportScenario(intent);
    setSelectedIntent(intent);
    setScenario(nextScenario);
    setSelectedIssue(null);

    const prompt = getIntentLabel(intent);
    pushConversation("Customer", prompt);

    if (intent === "order_issue") {
      pushConversation("System", "Select your issue: Damaged Item, Wrong Product, or Missing Item.");
      setCustomerMessage("I need help with an order issue.");
      setFreeText("");
      return;
    }

    pushConversation("System", nextScenario.initialReply);
    applyScenario(nextScenario);
    setFreeText("");
  };

  const handleOrderIssue = (issueType: OrderIssueType) => {
    if (!issueType) return;
    setError(null);
    setSuccess(null);
    const nextScenario = getSupportScenario("order_issue", issueType);
    setSelectedIntent("order_issue");
    setSelectedIssue(issueType);
    setScenario(nextScenario);

    const issueLabel = ORDER_ISSUES.find((issue) => issue.key === issueType)?.label ?? "Order Issue";
    pushConversation("Customer", issueLabel);
    pushConversation("System", nextScenario.initialReply);
    applyScenario(nextScenario, issueType);
    setFreeText("");
  };

  const analyzeFreeText = () => {
    if (!freeText.trim()) return;
    setError(null);
    setSuccess(null);
    const nextScenario = buildScenarioFromText(freeText);
    const issueType = nextScenario.intent === "order_issue" ? detectOrderIssue(freeText) : null;
    setSelectedIntent(nextScenario.intent);
    setSelectedIssue(issueType);
    setScenario(nextScenario);
    pushConversation("Customer", freeText.trim());
    pushConversation("System", nextScenario.initialReply);
    setCustomerMessage(freeText.trim());
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const nextScenario = scenario ?? getSupportScenario("general");

    if (nextScenario.requiresImage && images.length === 0) {
      setSubmitting(false);
      setError("This issue type needs at least one image attachment.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (orderId.trim()) formData.append("orderId", orderId.trim());
      formData.append("subject", nextScenario.subject);
      formData.append("message", customerMessage.trim() || nextScenario.initialReply);
      formData.append("intent", nextScenario.intent);
      if (selectedIssue) formData.append("issueType", selectedIssue);
      formData.append("initialSystemReply", nextScenario.initialReply);
      formData.append("priority", nextScenario.priority);
      formData.append("ticketStatus", nextScenario.status === "NEW" ? "NEW" : "IN_PROGRESS");
      formData.append("callbackRequested", String(nextScenario.callbackRequested));
      formData.append("autoCloseHours", String(nextScenario.autoCloseHours));
      formData.append("adminAlert", nextScenario.adminAlert);
      images.forEach((img) => formData.append("images", img));

      await createSupportTicket(formData);

      const completionText = nextScenario.callbackRequested
        ? "A callback request has been created and flagged for priority handling."
        : nextScenario.escalateToAdmin
          ? "Your ticket has been created and will be routed to the support team."
          : "Your request has been logged successfully.";

      setSuccess(`${completionText} Auto-close window: ${nextScenario.autoCloseHours} hours.`);
      pushConversation("System", `Ticket created. Status: ${nextScenario.status}. ${completionText}`);
      setCustomerMessage("");
      setFreeText("");
      setImages([]);
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const phoneRequired = scenario?.callbackRequested ?? false;
  const imageRequired = scenario?.requiresImage ?? false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <GlassCard className="overflow-hidden border border-border/60 shadow-lg">
        <div className="p-6 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Guided support intake
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">How can we help you today?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start with a quick option, let the chatbot branch the flow, and create a ticket that is already ready for admin triage.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {QUICK_ACTIONS.map((action) => {
                  const active = selectedIntent === action.intent;
                  return (
                    <button
                      key={action.intent}
                      type="button"
                      onClick={() => handleQuickAction(action.intent)}
                      className={`group rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/70 bg-card hover:border-primary/30 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                          {action.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{action.label}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bot className="w-4 h-4 text-primary" /> Live flow preview
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-muted/40 p-3 text-sm text-foreground">
                  {scenario?.initialReply ?? "Select an option to see the bot response and escalation path."}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="rounded-xl border border-border/60 p-3">
                    <div className="font-semibold uppercase tracking-wider text-[10px]">Ticket status</div>
                    <div className="mt-1 text-sm text-foreground">{scenario?.status ?? "NEW"}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3">
                    <div className="font-semibold uppercase tracking-wider text-[10px]">Auto-close</div>
                    <div className="mt-1 text-sm text-foreground">{scenario ? `${scenario.autoCloseHours}h` : "48h"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ArrowRight className="w-3.5 h-3.5 text-primary" /> Admin handoff
                  </div>
                  <p className="mt-2">
                    {scenario?.adminAlert ?? "If no rule matches, the request falls back to manual support handling."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <GlassCard className="overflow-hidden border border-border/60">
          <div className="border-b border-border/60 bg-muted/30 px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Headphones className="w-4 h-4 text-primary" /> Conversation trace
            </div>
          </div>
          <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
            {conversation.map((entry) => (
              <div key={entry.id} className={`flex ${entry.role === "Customer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  entry.role === "Customer"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted text-foreground"
                }`}>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
                    {entry.role === "Customer" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    {entry.role}
                  </div>
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden border border-border/60">
          <div className="border-b border-border/60 bg-muted/30 px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" /> Ticket details
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Phone {phoneRequired && <span className="text-xs text-primary">(required for callback)</span>}
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  required={phoneRequired}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Order ID</label>
                <Input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. SV-659435"
                />
              </div>
            </div>

            {selectedIntent === "order_issue" && (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldAlert className="w-4 h-4 text-primary" /> Order issue type
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {ORDER_ISSUES.map((issue) => {
                    const active = selectedIssue === issue.key;
                    return (
                      <button
                        key={issue.key}
                        type="button"
                        onClick={() => handleOrderIssue(issue.key)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          active ? "border-primary bg-primary/10" : "border-border/60 bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          {issue.icon}
                          {issue.label}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Describe your issue</label>
              <Textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Tell us what happened, or use the smart analyzer below if you're not sure which option fits."
                className="min-h-[120px] resize-y"
                required
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
                  <Clock3 className="w-3 h-3" /> Auto-close: {scenario?.autoCloseHours ?? 48} hours
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
                  <Sparkles className="w-3 h-3" /> {scenario?.priority ?? "Medium"} priority
                </span>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <Paperclip className="w-4 h-4 text-primary" /> Attachments
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
                <Upload className="w-5 h-5 text-primary" />
                <span className="mt-2 text-sm font-medium text-foreground">Upload images for verification</span>
                <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WEBP</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
              {imageRequired && (
                <p className="mt-2 text-xs text-muted-foreground">
                  This issue requires at least one image to be attached before submission.
                </p>
              )}
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((image) => (
                    <span key={image.name} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      <Paperclip className="w-3 h-3" /> {image.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
              <Button type="button" variant="outline" className="gap-2" onClick={analyzeFreeText} disabled={!freeText.trim()}>
                <Sparkles className="w-4 h-4" /> Analyze text
              </Button>
              <Input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Type something like: my product broken badly"
                className="flex-1 min-w-[220px]"
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? "Submitting..." : "Create Support Ticket"}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </Button>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Flow summary</p>
              <p className="mt-1">
                User message is saved, the system reply is attached to the journey, and the ticket enters the queue with {scenario?.status ?? "NEW"} or IN_PROGRESS status depending on the scenario.
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
