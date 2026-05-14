export type SupportIntent =
  | "order_issue"
  | "where_is_my_order"
  | "payment_issue"
  | "request_call"
  | "general";

export type OrderIssueType = "damaged_item" | "wrong_product" | "missing_item" | null;

export interface SupportScenario {
  intent: SupportIntent;
  label: string;
  subject: string;
  initialReply: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  priority: "Low" | "Medium" | "High" | "Urgent";
  adminAlert: string;
  callbackRequested: boolean;
  requiresImage: boolean;
  autoCloseHours: number;
  escalateToAdmin: boolean;
}

const keywordGroups: Array<{ intent: SupportIntent; keywords: RegExp[] }> = [
  {
    intent: "where_is_my_order",
    keywords: [
      /where\s+is\s+my\s+order/i,
      /track/i,
      /tracking/i,
      /shipment/i,
      /in\s+transit/i,
      /delivered/i,
      /shipping/i,
      /order\s+status/i,
    ],
  },
  {
    intent: "payment_issue",
    keywords: [
      /payment/i,
      /refund/i,
      /charged/i,
      /deducted/i,
      /failed\s+payment/i,
      /money\s+back/i,
      /not\s+confirmed/i,
    ],
  },
  {
    intent: "request_call",
    keywords: [
      /call/i,
      /callback/i,
      /phone/i,
      /ring/i,
      /within\s+24\s*hours?/i,
    ],
  },
  {
    intent: "order_issue",
    keywords: [
      /damaged/i,
      /broken/i,
      /wrong\s+product/i,
      /wrong\s+item/i,
      /missing/i,
      /received\s+the\s+wrong/i,
      /item\s+missing/i,
      /cracked/i,
      /defective/i,
    ],
  },
];

export function detectIntent(text: string): SupportIntent {
  const normalized = text.trim();
  if (!normalized) return "general";

  for (const group of keywordGroups) {
    if (group.keywords.some((pattern) => pattern.test(normalized))) {
      return group.intent;
    }
  }

  return "general";
}

export function detectOrderIssue(text: string): OrderIssueType {
  if (/damaged|broken|cracked|defective/i.test(text)) return "damaged_item";
  if (/wrong\s+product|wrong\s+item|received\s+the\s+wrong/i.test(text)) return "wrong_product";
  if (/missing/i.test(text)) return "missing_item";
  return null;
}

export function getSupportScenario(intent: SupportIntent, orderIssue: OrderIssueType = null): SupportScenario {
  if (intent === "where_is_my_order") {
    return {
      intent,
      label: "Where is my Order?",
      subject: "Order Tracking Assistance",
      initialReply: "Your order is currently in transit. You should receive the latest tracking update soon.",
      status: "IN_PROGRESS",
      priority: "Medium",
      adminAlert: "Customer requested order tracking assistance.",
      callbackRequested: false,
      requiresImage: false,
      autoCloseHours: 48,
      escalateToAdmin: false,
    };
  }

  if (intent === "payment_issue") {
    return {
      intent,
      label: "Payment Issue",
      subject: "Payment and Refund Assistance",
      initialReply: "If your payment was deducted but the order was not confirmed, the amount will be refunded within 5-7 business days.",
      status: "IN_PROGRESS",
      priority: "High",
      adminAlert: "Customer reported a payment or refund issue.",
      callbackRequested: false,
      requiresImage: false,
      autoCloseHours: 72,
      escalateToAdmin: true,
    };
  }

  if (intent === "request_call") {
    return {
      intent,
      label: "Request a Call",
      subject: "Callback Request",
      initialReply: "Our support team will contact you within 24 hours.",
      status: "IN_PROGRESS",
      priority: "High",
      adminAlert: "High priority callback request created.",
      callbackRequested: true,
      requiresImage: false,
      autoCloseHours: 24,
      escalateToAdmin: true,
    };
  }

  if (intent === "order_issue") {
    if (orderIssue === "wrong_product") {
      return {
        intent,
        label: "Wrong Product",
        subject: "Wrong Product Delivered",
        initialReply: "We are sorry for the mix-up. Please upload a photo of the item you received so we can verify and arrange the next step.",
        status: "IN_PROGRESS",
        priority: "High",
        adminAlert: "Customer reported the wrong product was delivered.",
        callbackRequested: false,
        requiresImage: true,
        autoCloseHours: 48,
        escalateToAdmin: true,
      };
    }

    if (orderIssue === "missing_item") {
      return {
        intent,
        label: "Missing Item",
        subject: "Missing Item Reported",
        initialReply: "Please upload a photo of the package and packing slip so we can check the missing item quickly.",
        status: "IN_PROGRESS",
        priority: "High",
        adminAlert: "Customer reported a missing item in the order.",
        callbackRequested: false,
        requiresImage: true,
        autoCloseHours: 48,
        escalateToAdmin: true,
      };
    }

    return {
      intent,
      label: "Damaged Item",
      subject: "Damaged Item Reported",
      initialReply: "We are sorry for the inconvenience. Please upload an image of the damaged product so we can verify the issue.",
      status: "IN_PROGRESS",
      priority: "High",
      adminAlert: "Customer reported a damaged item and image evidence is requested.",
      callbackRequested: false,
      requiresImage: true,
      autoCloseHours: 48,
      escalateToAdmin: true,
    };
  }

  return {
    intent: "general",
    label: "General Support",
    subject: "General Support Request",
    initialReply: "Thank you for contacting support. Our team will assist you shortly.",
    status: "NEW",
    priority: "Medium",
    adminAlert: "Customer submitted a general support request.",
    callbackRequested: false,
    requiresImage: false,
    autoCloseHours: 72,
    escalateToAdmin: true,
  };
}

export function buildScenarioFromText(text: string): SupportScenario {
  const intent = detectIntent(text);
  const orderIssue = intent === "order_issue" ? detectOrderIssue(text) : null;
  return getSupportScenario(intent, orderIssue);
}
