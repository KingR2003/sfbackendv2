// ...existing code...
// API endpoint configuration
import { API_ENDPOINTS, BASE_URL } from "./apiConfig";
import { mockOrders, mockProducts, type Product, type Variant } from "@/data/mockData";
import { INITIAL_BANNERS, Banner } from "@/components/banners/bannerTypes";
import { CHART_COLORS } from "@/lib/chartConfig";

// --- Response mappers ---
// Backend returns camelCase fields and images as [{ imageUrl: "..." }] objects.
// These mappers normalize everything to the frontend's snake_case Product/Variant types.

function extractImageUrls(images: any[]): string[] {
    if (!Array.isArray(images)) return [];
    return images
        .map(img => (typeof img === "string" ? img : img?.imageUrl ?? ""))
        .filter(Boolean);
}

function mapVariant(v: any): Variant {
    const images = extractImageUrls(v.images);
    return {
        id: v.id ?? 0,
        variant_name: v.variantName ?? v.variant_name ?? "",
        sku: v.sku ?? "",
        mrp: v.mrp ?? 0,
        price: v.price ?? 0,
        discount: v.discount ?? 0,
        stock_quantity: v.stockQuantity ?? v.stock_quantity ?? 0,
        sold: v.sold ?? 0,
        availability_status: v.availabilityStatus ?? v.availability_status ?? "In Stock",
        is_active: v.isActive ?? v.is_active ?? true,
        image: images[0] ?? "",
        images,
    };
}

function mapProduct(p: any): Product {
    const images = extractImageUrls(p.images);
    const rawCategoryId =
        p.categoryId ??
        p.category_id ??
        (typeof p.category === "number" || typeof p.category === "string" ? p.category : undefined) ??
        p.category?.id;
    const parsedCategoryId = Number(rawCategoryId);
    const resolvedCategoryId = Number.isFinite(parsedCategoryId) ? parsedCategoryId : undefined;
    const resolvedCategory =
        (typeof p.category === "object" ? (p.category?.name ?? p.category?.categoryName ?? p.category?.title ?? "") : "") ||
        p.categoryName ||
        p.category_name ||
        p.categoryTitle ||
        p.category_title ||
        p.categoryLabel ||
        p.category_label ||
        (typeof p.category === "string" ? p.category : "") ||
        "Uncategorized";
    return {
        id: p.id ?? 0,
        name: p.name ?? "",
        image: images[0] ?? "",
        images,
        description: p.description ?? "",
        category: resolvedCategory,
        category_id: resolvedCategoryId,
        is_active: p.isActive ?? p.is_active ?? true,
        sold: p.sold ?? 0,
        created_at: p.createdAt ?? p.created_at ?? "",
        variants: Array.isArray(p.variants) ? p.variants.map(mapVariant) : [],
    };
}

function mapBanner(b: any): Banner {
    const rawPriority = b.priority ?? b.displayOrder ?? b.display_order ?? b.order ?? b.orderNo ?? b.order_no;
    const parsedPriority = Number(rawPriority);
    return {
        id: b.id,
        title: b.title || "",
        description: b.description || "",
        imageUrl: b.bannerImage || null,           // backend: bannerImage → frontend: imageUrl
        platform: b.platform || "Both",
        gender: b.gender || "All Users",
        ageGroup: b.ageGroup || "All Ages",
        campaign: b.campaignType || "Festival",    // backend: campaignType → frontend: campaign
        buttonText: b.buttonText || "",
        redirectPage: b.redirectTo || "Honey",     // backend: redirectTo → frontend: redirectPage
        priority: Number.isFinite(parsedPriority) ? parsedPriority : 0,
        startDate: b.startDateTime || new Date().toISOString(),   // backend: startDateTime → frontend: startDate
        endDate: b.endDateTime || new Date().toISOString(),       // backend: endDateTime → frontend: endDate
        active: b.isActive ?? b.active ?? true,    // backend: isActive → frontend: active
        status: b.status || "Active",
        analytics: {
            views: b.views || 0,
            clicks: b.clicks || 0
        },
        createdAt: b.createdAt || new Date().toISOString(),
    };
}

function hasAdminSession(): boolean {
    try {
        return Boolean(localStorage.getItem("adminToken"));
    } catch {
        return false;
    }
}

function getAgeGroup(age: number): string {
    if (!Number.isFinite(age)) return "Unknown";
    if (age < 18) return "<18";
    if (age < 25) return "18-24";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    if (age < 55) return "45-54";
    return "55+";
}

export interface AuthResponse {
    status: number;
    message: string;
    success: boolean;
    data?: {
        token?: string;
        admin?: {
            id: string;
            name: string;
            email: string;
            mobile?: string;
        };
    };
}

export type AdminOrderStatus = "PROCESSING" | "PACKED" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";

export interface AdminOrderItem {
    id?: number | string;
    orderId?: number | string;
    productId?: number | string;
    variantId?: number | string;
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    image?: string;
}

export interface AdminOrder {
    id: number | string;
    userId?: number;
    customer: string;
    customerDemographics?: {
        age?: number;
        gender?: string;
        location?: string;
    };
    customerEmail?: string;
    customerPhone?: string;
    amount: string;
    totalAmount: number;
    couponApplied?: string | null;
    discountAmount?: number;
    finalAmount?: number;
    payment: string;
    status: string;
    date: string;
    shippingAddress: string;
    items: AdminOrderItem[];
}

export type SupportTicketStatus = "Open" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
export type SupportTicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type SupportTicketSender = "Customer" | "Admin" | "System";

export interface SupportTicketReply {
    id: string;
    ticket_id: string;
    sender: SupportTicketSender;
    sender_name: string;
    message: string;
    created_at: string;
}

export interface AdminSupportTicket {
    id: string;
    ticket_id: string;
    order_id: string;
    customer_id?: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    subject: string;
    message: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    created_at: string;
    updated_at: string;
    replies: SupportTicketReply[];
    imageUrls?: string[];
}

export interface AdminSupportOrderDetailsResponse extends AdminSupportTicket {
    order?: AdminOrder | null;
    orderDetails?: AdminOrder | null;
}

function toNumeric(value: any): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
        const normalized = value.replace(/[^0-9.-]/g, "");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function firstNonEmptyString(...values: any[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}

function normalizeOrderStatus(status: any): string {
    const normalized = String(status ?? "").trim().toUpperCase();
    if (normalized === "OUT_FOR_DELIVERY") return "ON_THE_WAY";
    return normalized || "PROCESSING";
}

function formatOrderDate(value: any): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString(); // keep full timestamp so UI can display date + time
}

function normalizeSupportStatus(status: any): SupportTicketStatus {
    const normalized = String(status ?? "").trim().toUpperCase().replace(/[-_]+/g, " ");
    if (normalized === "OPEN") return "Open";
    if (normalized === "IN PROGRESS") return "In Progress";
    if (normalized === "WAITING FOR CUSTOMER") return "Waiting for Customer";
    if (normalized === "RESOLVED") return "Resolved";
    if (normalized === "CLOSED") return "Closed";
    return "Open";
}

function normalizeSupportPriority(priority: any): SupportTicketPriority {
    const normalized = String(priority ?? "").trim().toUpperCase();
    if (normalized === "LOW") return "Low";
    if (normalized === "MEDIUM") return "Medium";
    if (normalized === "HIGH") return "High";
    if (normalized === "URGENT" || normalized === "CRITICAL") return "Urgent";
    return "Medium";
}

function mapSupportReply(item: any, ticketId: string): SupportTicketReply {
    const senderRaw = String(item?.sender ?? item?.from ?? item?.authorType ?? item?.author_type ?? "Customer").toLowerCase();
    const sender: SupportTicketSender = senderRaw.includes("system")
        ? "System"
        : senderRaw.includes("admin") || senderRaw.includes("support")
            ? "Admin"
            : "Customer";
    return {
        id: String(item?.id ?? `${ticketId}-reply-${Math.random().toString(36).slice(2, 10)}`),
        ticket_id: ticketId,
        sender,
        sender_name: String(item?.senderName ?? item?.sender_name ?? item?.authorName ?? item?.author_name ?? (sender === "Admin" ? "Admin" : sender === "System" ? "System" : "Customer")),
        message: String(item?.message ?? item?.text ?? item?.body ?? ""),
        created_at: String(item?.createdAt ?? item?.created_at ?? new Date().toISOString()),
    };
}

function mapSupportTicket(query: any): AdminSupportTicket {
    const rawId = query?.id ?? query?._id ?? query?.queryId ?? query?.query_id ?? query?.ticketId ?? query?.ticket_id ?? "";
    const id = String(rawId || Math.random().toString(36).slice(2, 10));
    const ticketId = String(query?.ticketId ?? query?.ticket_id ?? query?.queryCode ?? query?.query_code ?? `QRY-${id}`);
    const customer = query?.customer ?? query?.user ?? query?.customerDetails ?? query?.customer_details ?? {};
    const composedCustomerName = [
        customer?.firstName ?? customer?.first_name, 
        customer?.lastName ?? customer?.last_name
    ].filter(Boolean).join(" ");
    
    const fallbackCustomerName = [
        query?.firstName ?? query?.first_name, 
        query?.lastName ?? query?.last_name
    ].filter(Boolean).join(" ");

    const rootName = query?.name ?? query?.fullName ?? query?.full_name;

    const customerName =
        query?.customerName ??
        query?.customer_name ??
        customer?.name ??
        customer?.fullName ??
        customer?.full_name ??
        rootName ??
        (composedCustomerName || undefined) ??
        (fallbackCustomerName || undefined) ??
        "Unknown Customer";

    const rawReplies =
        Array.isArray(query?.replies) ? query.replies :
            Array.isArray(query?.messages) ? query.messages :
                Array.isArray(query?.conversation) ? query.conversation :
                    Array.isArray(query?.comments) ? query.comments : [];

    const replies = rawReplies.map((item: any) => mapSupportReply(item, ticketId));

    if (replies.length === 0 && query?.message) {
        replies.push({
            id: `reply-init-${id}`,
            ticket_id: ticketId,
            sender: "Customer",
            sender_name: String(customerName),
            message: String(query.message),
            created_at: String(query?.createdAt ?? query?.created_at ?? new Date().toISOString())
        });
    }

    const subject = String(
        query?.subject ??
        query?.title ??
        query?.queryType ??
        query?.query_type ??
        query?.type ??
        "Customer Query"
    );

    const imageUrls = Array.isArray(query?.imageUrls) ? query.imageUrls :
        Array.isArray(query?.images) ? query.images : [];

    return {
        id,
        ticket_id: ticketId,
        order_id: String(query?.orderId ?? query?.order_id ?? query?.orderCode ?? query?.order_code ?? "N/A"),
        customer_id: String(query?.userId ?? query?.user_id ?? query?.customerId ?? query?.customer_id ?? customer?.id ?? ""),
        customer_name: String(customerName),
        customer_email: String(query?.email ?? query?.customerEmail ?? query?.customer_email ?? customer?.email ?? ""),
        customer_phone: String(query?.phone ?? query?.mobile ?? query?.customerPhone ?? query?.customer_phone ?? customer?.mobile ?? customer?.phone ?? ""),
        subject,
        message: String(query?.message ?? query?.description ?? query?.details ?? subject),
        status: normalizeSupportStatus(query?.status),
        priority: normalizeSupportPriority(query?.priority),
        created_at: String(query?.createdAt ?? query?.created_at ?? new Date().toISOString()),
        updated_at: String(query?.updatedAt ?? query?.updated_at ?? query?.createdAt ?? query?.created_at ?? new Date().toISOString()),
        replies,
        imageUrls,
    };
}

interface SupportLookupParams {
    ticketId?: string | number;
    orderId?: string | number;
}

function buildSupportLookupQuery(params: SupportLookupParams = {}): string {
    const searchParams = new URLSearchParams();
    if (params.ticketId != null && String(params.ticketId).trim()) {
        searchParams.set("ticketId", String(params.ticketId).trim());
    }
    if (params.orderId != null && String(params.orderId).trim()) {
        searchParams.set("orderId", String(params.orderId).trim());
    }
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

function extractSupportResponseList(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;

    const candidates = [
        payload.data,
        payload.supportTickets,
        payload.tickets,
        payload.queries,
        payload.content,
        payload.items,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    if (
        payload.ticket != null ||
        payload.supportTicket != null ||
        payload.query != null ||
        payload.order != null ||
        payload.orderDetails != null ||
        payload.order_detail != null ||
        payload.orderData != null ||
        payload.data != null
    ) {
        return [payload];
    }

    return [];
}

function mapSupportOrderDetailsResponse(payload: any): AdminSupportOrderDetailsResponse {
    const ticketPayload =
        payload?.ticket ??
        payload?.supportTicket ??
        payload?.query ??
        payload?.supportQuery ??
        payload?.data?.ticket ??
        payload?.data?.supportTicket ??
        payload?.data?.query ??
        payload?.data ??
        payload;

    const orderPayload =
        payload?.order ??
        payload?.orderDetails ??
        payload?.order_detail ??
        payload?.orderData ??
        payload?.data?.order ??
        payload?.data?.orderDetails ??
        payload?.data?.order_detail ??
        payload?.data?.orderData ??
        null;

    const ticket = mapSupportTicket(ticketPayload);
    const order = orderPayload ? mapAdminOrder(orderPayload) : null;

    return {
        ...ticket,
        order: order ?? undefined,
        orderDetails: order ?? undefined,
    };
}

export async function getAdminQueries(): Promise<AdminSupportTicket[]> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_ADMIN_QUERIES, { method: "GET" });

    const list: any[] =
        Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
                Array.isArray(res?.queries) ? res.queries :
                    Array.isArray(res?.content) ? res.content :
                        Array.isArray(res?.data?.queries) ? res.data.queries :
                            Array.isArray(res?.data?.content) ? res.data.content : [];

    return list.map(mapSupportTicket);
}

export async function getAdminSupportTickets(params: SupportLookupParams = {}): Promise<AdminSupportOrderDetailsResponse[]> {
    const qs = buildSupportLookupQuery(params);
    const res: any = await safeFetch(`${API_ENDPOINTS.GET_SUPPORT_ADMIN}${qs}`, { method: "GET" });
    const list = extractSupportResponseList(res);
    return list.map(mapSupportOrderDetailsResponse);
}

export async function getAdminSupportTicketById(id: string): Promise<AdminSupportOrderDetailsResponse> {
    const all = await getAdminSupportTickets({ ticketId: id });
    const found = all.find(t => String(t.id) === String(id) || String(t.ticket_id) === String(id));
    if (found) return found;
    throw new Error("Ticket not found");
}

export async function getAdminSupportTicketsByOrderId(orderId: string | number): Promise<AdminSupportOrderDetailsResponse[]> {
    return getAdminSupportTickets({ orderId });
}

export async function createSupportTicket(formData: FormData): Promise<any> {
    const token = localStorage.getItem("adminToken");
    const headers: any = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(API_ENDPOINTS.CREATE_SUPPORT_TICKET_GENERAL, {
        method: "POST",
        headers,
        body: formData,
    });
    const text = await res.text();
    let parsedData;
    try {
        parsedData = JSON.parse(text);
    } catch {
        // Not JSON
    }
    if (!res.ok) {
        throw new Error(parsedData?.message || `Failed to create support ticket (${res.status})`);
    }
    return parsedData;
}

export async function updateSupportTicketStatus(id: string | number, status: SupportTicketStatus): Promise<any> {
    const backendStatus = status.toUpperCase().replace(/ /g, "_");
    const url = API_ENDPOINTS.UPDATE_SUPPORT_TICKET_STATUS_ADMIN(id);
    return await safeFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
    });
}

export async function addSupportTicketReply(ticketId: string | number, message: string): Promise<SupportTicketReply> {
    return addSupportTicketMessage(ticketId, message, "Admin", "Support Agent");
}

function extractSupportMessagePayload(raw: any): any {
    return raw?.data ?? raw?.message ?? raw;
}

function resolveMessagePostUrls(ticketId: string | number): string[] {
    const raw = [
        API_ENDPOINTS.REPLY_SUPPORT_TICKET_ADMIN(ticketId),
        `${BASE_URL}/api/v1/admin/support/${ticketId}/messages`,
        `${BASE_URL}/api/messages`,
        `${BASE_URL}/api/v1/messages`,
        `${BASE_URL}/api/v1/support/messages`,
    ];
    return Array.from(new Set(raw));
}

function resolveMessageReadUrls(ticketId: string | number): string[] {
    const raw = [
        `${BASE_URL}/api/messages/read/${ticketId}`,
        `${BASE_URL}/api/v1/messages/read/${ticketId}`,
        `${BASE_URL}/api/v1/support/messages/read/${ticketId}`,
        `${BASE_URL}/api/v1/admin/support/${ticketId}/messages/read`,
    ];
    return Array.from(new Set(raw));
}

function resolveMessageListUrls(ticketId: string | number): string[] {
    const raw = [
        `${BASE_URL}/api/messages/ticket/${ticketId}`,
        `${BASE_URL}/api/v1/messages/ticket/${ticketId}`,
        `${BASE_URL}/api/v1/support/messages/ticket/${ticketId}`,
        `${BASE_URL}/api/v1/admin/support/${ticketId}/messages`,
        `${BASE_URL}/api/v1/admin/support/${ticketId}/replies`,
    ];
    return Array.from(new Set(raw));
}

function toSupportTicketReply(data: any, fallbackTicketId: string | number, senderName?: string): SupportTicketReply {
    const senderType = String(data?.senderType ?? data?.sender ?? "").toUpperCase();
    const sender: SupportTicketSender = senderType === "USER" || senderType === "CUSTOMER"
        ? "Customer"
        : senderType === "SYSTEM"
            ? "System"
            : "Admin";

    return {
        id: String(data?.id ?? `msg-${Math.random().toString(36).slice(2, 10)}`),
        ticket_id: String(data?.userQueryId ?? data?.ticketId ?? fallbackTicketId),
        sender,
        sender_name: String(data?.senderName ?? data?.sender_name ?? (sender === "Customer" ? "Customer" : sender === "System" ? "System" : (senderName || "Support Agent"))),
        message: String(data?.content ?? data?.message ?? ""),
        created_at: String(data?.createdAt ?? data?.created_at ?? new Date().toISOString()),
    };
}

async function tryPostSupportMessage(
    url: string,
    ticketId: string | number,
    senderType: SupportTicketSender,
    message: string,
    senderName?: string,
): Promise<any> {
    const payloads = [
        { userQueryId: ticketId, senderType: senderType.toUpperCase(), content: message, senderName },
        { ticketId, senderType: senderType.toUpperCase(), content: message, senderName },
        { senderType: senderType.toUpperCase(), content: message, senderName },
        { message, senderType: senderType.toUpperCase() },
    ];

    let lastError: any = null;
    for (const body of payloads) {
        try {
            return await safeFetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

export async function addSupportTicketMessage(
    ticketId: string | number,
    message: string,
    senderType: SupportTicketSender,
    senderName?: string,
): Promise<SupportTicketReply> {
    const urls = resolveMessagePostUrls(ticketId);
    let lastError: any = null;

    for (const url of urls) {
        try {
            const res = await tryPostSupportMessage(url, ticketId, senderType, message, senderName);
            const data = extractSupportMessagePayload(res);
            return toSupportTicketReply(data, ticketId, senderName);
        } catch (error) {
            lastError = error;
        }
    }

    throw new Error(lastError?.message || "Failed to send support message. Backend message endpoint is unavailable.");
}

export async function getSupportTicketMessages(ticketId: string | number): Promise<SupportTicketReply[]> {
    const urls = resolveMessageListUrls(ticketId);

    for (const url of urls) {
        try {
            const res = await safeFetch(url, { method: "GET" });
            const payload = (res as any)?.data ?? (res as any);
            const rows = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.messages)
                    ? payload.messages
                    : Array.isArray(payload?.content)
                        ? payload.content
                        : [];

            return rows.map((msg: any) => toSupportTicketReply(msg, ticketId));
        } catch {
            // Try next URL variant
        }
    }

    return [];
}

export async function markSupportTicketMessagesAsRead(ticketId: string | number): Promise<void> {
    const urls = resolveMessageReadUrls(ticketId);
    for (const url of urls) {
        try {
            await safeFetch(url, { method: "PUT" });
            return;
        } catch (e) {
            // Try next URL variant
        }
    }
}

export interface CustomerQuery {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
}

export async function getCustomerQueries(): Promise<CustomerQuery[]> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_ADMIN_QUERIES, { method: "GET" });
    
    // Based on provided postman response, the array is inside res.data
    const list: any[] = Array.isArray(res?.data) ? res.data : 
                        Array.isArray(res) ? res : [];
                        
    return list.map(q => ({
        id: q.id,
        firstName: q.firstName || "",
        lastName: q.lastName || "",
        email: q.email || "",
        subject: q.subject || "",
        message: q.message || "",
        createdAt: q.createdAt || new Date().toISOString()
    }));
}

function mapOrderItem(item: any): AdminOrderItem {
    const quantity = toNumeric(item?.quantity ?? item?.qty ?? 1) || 1;
    const directUnitPrice = toNumeric(item?.price ?? item?.priceAtPurchase ?? item?.unitPrice ?? item?.unit_price);
    const lineTotal = toNumeric(item?.amount ?? item?.total ?? item?.totalPrice ?? item?.total_price);
    const unitPrice = directUnitPrice > 0 ? directUnitPrice : (lineTotal > 0 ? lineTotal / quantity : 0);
    const product = item?.product ?? item?.productDetails ?? {};
    const variant = item?.variant ?? item?.variantDetails ?? {};
    return {
        id: item?.id,
        orderId: item?.orderId ?? item?.order_id ?? item?.order?.id,
        productId: item?.productId ?? item?.product_id ?? product?.id,
        variantId: item?.variantId ?? item?.variant_id ?? variant?.id,
        productName:
            item?.productName ??
            item?.product_name ??
            item?.name ??
            product?.name ??
            product?.productName ??
            product?.product_name ??
            "Unknown Product",
        variantName:
            item?.variantName ??
            item?.variant_name ??
            variant?.name ??
            variant?.variantName ??
            variant?.variant_name ??
            "Standard",
        quantity,
        price: unitPrice,
        image: item?.image ?? item?.imageUrl ?? item?.image_url ?? product?.image ?? product?.imageUrl ?? product?.image_url,
    };
}

function extractOrderItemList(payload: any): any[] {
    if (!payload) return [];

    if (Array.isArray(payload)) return payload;

    const directLists = [
        payload?.items,
        payload?.orderItems,
        payload?.order_items,
        payload?.products,
        payload?.data?.items,
        payload?.data?.orderItems,
        payload?.data?.order_items,
        payload?.data?.products,
        payload?.data?.content,
        payload?.content,
        payload?.result,
        payload?.data?.result,
        payload?.data?.data?.items,
        payload?.data?.data?.orderItems,
        payload?.data?.data?.order_items,
        payload?.data?.data?.products,
    ];

    for (const candidate of directLists) {
        if (Array.isArray(candidate)) return candidate;
    }

    // Some APIs return a single line-item object instead of an array.
    if (
        payload?.productId != null ||
        payload?.product_id != null ||
        payload?.variantId != null ||
        payload?.variant_id != null
    ) {
        return [payload];
    }

    return [];
}

function mapAdminOrder(order: any): AdminOrder {
    const itemsRaw =
        Array.isArray(order?.items) ? order.items :
            Array.isArray(order?.orderItems) ? order.orderItems :
                Array.isArray(order?.order_items) ? order.order_items :
                    Array.isArray(order?.products) ? order.products : [];
    const items = itemsRaw.map(mapOrderItem);

    const explicitTotal = toNumeric(
        order?.totalAmount ??
        order?.grandTotal ??
        order?.amount ??
        order?.orderAmount ??
        order?.total
    );
    const computedFromItems = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalAmount = explicitTotal > 0 ? explicitTotal : computedFromItems;

    const discountAmount = toNumeric(order?.discountAmount ?? order?.discount_amount ?? order?.discount ?? 0);
    const finalAmount = toNumeric(order?.finalAmount ?? order?.final_amount ?? 0);
    const resolvedFinalAmount = finalAmount > 0 ? finalAmount : Math.max(0, totalAmount - discountAmount);

    const rawCoupon = order?.couponApplied ?? order?.coupon_applied;
    const isCouponActive = rawCoupon && String(rawCoupon) !== "0" && String(rawCoupon).toLowerCase() !== "false";
    const couponApplied = isCouponActive ? String(rawCoupon) : null;

    const customerObj = order?.customer ?? order?.user ?? order?.customerDetails ?? {};
    const composedCustomerName = [customerObj?.firstName, customerObj?.lastName].filter(Boolean).join(" ");
    const customer = firstNonEmptyString(
        order?.customerName,
        order?.customer_name,
        order?.name,
        customerObj?.name,
        customerObj?.fullName,
        customerObj?.full_name,
        composedCustomerName,
    ) || "Unknown Customer";

    const rawAddress = order?.shippingAddress ?? order?.address ?? order?.deliveryAddress;
    const shippingAddress =
        typeof rawAddress === "string"
            ? rawAddress
            : formatUserAddress(rawAddress) || "Not provided";

    return {
        id: order?.id ?? order?.orderId ?? order?.order_id ?? "",
        userId: toNumeric(order?.userId ?? order?.user_id ?? customerObj?.id ?? order?.customerId ?? order?.customer_id) || undefined,
        customer,
        customerDemographics: order?.customerDemographics ?? order?.customer_demographics ?? customerObj?.customerDemographics ?? customerObj?.customer_demographics,
        customerEmail: firstNonEmptyString(order?.customerEmail, order?.customer_email, customerObj?.email),
        customerPhone: firstNonEmptyString(order?.customerPhone, order?.customer_phone, customerObj?.mobile, customerObj?.phone),
        amount: `Rs.${resolvedFinalAmount.toLocaleString("en-IN")}`,
        totalAmount,
        couponApplied,
        discountAmount,
        finalAmount: resolvedFinalAmount,
        payment: String(order?.paymentStatus ?? order?.payment ?? order?.payment_state ?? "Pending"),
        status: normalizeOrderStatus(order?.status ?? order?.orderStatus ?? order?.order_status),
        date: formatOrderDate(order?.createdAt ?? order?.orderDate ?? order?.created_at ?? order?.date),
        shippingAddress,
        items,
    };
}

const AUTH_ENDPOINTS = [
    API_ENDPOINTS.ADMIN_LOGIN,
    API_ENDPOINTS.ADMIN_REGISTER,
    API_ENDPOINTS.ADMIN_FORGOT_PASSWORD,
    API_ENDPOINTS.ADMIN_RESET_PASSWORD,
];

async function postPublicJson<T = any>(url: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsedData: any;

    try {
        parsedData = text ? JSON.parse(text) : null;
    } catch {
        parsedData = null;
    }

    if (!res.ok) {
        const error = new Error(parsedData?.message || `Request failed (${res.status})`) as Error & { status?: number };
        error.status = res.status;
        throw error;
    }

    return (parsedData ?? null) as T;
}

async function safeFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("adminToken");
    const headers = new Headers(options.headers || {});
    // Skip ngrok browser-warning interstitial page (free tier returns HTML otherwise)
    headers.set("ngrok-skip-browser-warning", "true");

    let fetchUrl = url;

    // Prevent browser from caching Admin Panel GET requests
    if (!options.method || options.method.toUpperCase() === "GET") {
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
        options.cache = "no-store";

        // Append unique timestamp to definitively bust browser disk cache
        fetchUrl += (fetchUrl.includes("?") ? "&" : "?") + "_t=" + new Date().getTime();
    }

    // Don't send a stale token to auth endpoints — it causes backend to reject with 401
    if (token && !AUTH_ENDPOINTS.includes(url)) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(fetchUrl, { ...options, headers });
    const text = await res.text();

    let parsedData;
    try {
        parsedData = JSON.parse(text);
    } catch {
        // Not JSON
    }

    if (!res.ok) {
        // On 401 Unauthorized, log the user out and redirect to login
        // — but NOT when the 401 comes from the login/register endpoint itself
        if (res.status === 401 && !AUTH_ENDPOINTS.includes(url)) {
            localStorage.removeItem("adminToken");
            // Use dynamic import to avoid circular dependency
            import("@/lib/routing").then(({ redirectTo }) => {
                redirectTo("/login");
            });
            // Return a never-resolving promise so no error toast is shown
            return new Promise(() => {}) as Promise<T>;
        }
        if (parsedData && parsedData.message) {
            throw new Error(parsedData.message);
        }
        // If backend returned an HTML error page, show a clean message instead of raw HTML
        const isHtml = text.trimStart().startsWith("<");
        if (isHtml) {
            throw new Error(`Server error ${res.status}: ${res.statusText || "Unauthorized"}. Please check your credentials.`);
        }
        console.error("API error:", res.status, text);
        throw new Error(`API error: ${res.status} - ${text.slice(0, 100)}`);
    }

    // If it's a successful response but there's no body (e.g., 204 No Content or a successful DELETE with empty body)
    if (!text) {
        return null as unknown as T;
    }

    if (parsedData !== undefined) {
        return parsedData as T;
    }

    throw new Error("Server returned an unexpected non-JSON response.");
}

export async function adminLogin(email: string, password: string, secretKey?: string): Promise<AuthResponse> {
    const payload: any = { email, password };
    if (secretKey) payload.secretKey = secretKey;
    console.log("Admin Login Config:", { url: API_ENDPOINTS.ADMIN_LOGIN, email, secretKey });
    return safeFetch<AuthResponse>(API_ENDPOINTS.ADMIN_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function adminRegister(
    name: string,
    email: string,
    mobile: string,
    password: string,
    secretKey: string
): Promise<AuthResponse> {
    console.log("Admin Register Config:", { url: API_ENDPOINTS.ADMIN_REGISTER, email, mobile, secretKey });
    return safeFetch<AuthResponse>(API_ENDPOINTS.ADMIN_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, mobile, password, secretKey }),
    });
}

export async function adminForgotPassword(email: string): Promise<{ message?: string; success?: boolean }> {
    return postPublicJson(API_ENDPOINTS.ADMIN_FORGOT_PASSWORD, { email });
}

export async function adminResetPassword(token: string, newPassword: string): Promise<{ message?: string; success?: boolean }> {
    return postPublicJson(API_ENDPOINTS.ADMIN_RESET_PASSWORD, { token, newPassword });
}

export async function adminLogout(): Promise<void> {
    await safeFetch(API_ENDPOINTS.ADMIN_LOGOUT, {
        method: "POST",
    });
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_ADMIN_ORDERS, { method: "GET" });
    const list: any[] =
        Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
                Array.isArray(res?.orders) ? res.orders :
                    Array.isArray(res?.content) ? res.content :
                        Array.isArray(res?.data?.orders) ? res.data.orders :
                            Array.isArray(res?.data?.content) ? res.data.content : [];
    return list.map(mapAdminOrder).filter(order => order.id !== "");
}

export async function getOrderItemsByOrderId(orderId: number | string): Promise<AdminOrderItem[]> {
    const candidateRequests: Array<{ url: string; scoped: boolean }> = [
        { url: `${API_ENDPOINTS.GET_ADMIN_ORDERS}/${orderId}`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ADMIN_ORDERS}/${orderId}/order-items`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ADMIN_ORDERS}/${orderId}/items`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ADMIN_ORDER_ITEMS}/${orderId}`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ORDER_ITEMS}/${orderId}`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ADMIN_ORDER_ITEMS}?orderId=${orderId}`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ADMIN_ORDER_ITEMS}?order_id=${orderId}`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ORDER_ITEMS}?orderId=${orderId}`, scoped: true },
        { url: `${API_ENDPOINTS.GET_ORDER_ITEMS}?order_id=${orderId}`, scoped: true },
        { url: API_ENDPOINTS.GET_ADMIN_ORDER_ITEMS, scoped: false },
        { url: API_ENDPOINTS.GET_ORDER_ITEMS, scoped: false },
    ];

    for (const request of candidateRequests) {
        try {
            const res: any = await safeFetch(request.url, { method: "GET" });
            const list: any[] = extractOrderItemList(res);

            if (!list.length) {
                continue;
            }

            const hasOrderIdInPayload = list.some((item) => {
                const rawOrderId = item?.orderId ?? item?.order_id ?? item?.order?.id;
                return rawOrderId != null;
            });

            if (!hasOrderIdInPayload && request.scoped) {
                return list.map(mapOrderItem);
            }

            const filtered = list.filter((item) => {
                const rawOrderId = item?.orderId ?? item?.order_id ?? item?.order?.id;
                if (rawOrderId == null) return false;
                return String(rawOrderId) === String(orderId);
            });

            if (filtered.length > 0) {
                return filtered.map(mapOrderItem);
            }
        } catch {
            // Try next candidate endpoint.
        }
    }

    return [];
}

export async function updateAdminOrderStatus(id: number | string, status: AdminOrderStatus) {
    const url = `${API_ENDPOINTS.UPDATE_ADMIN_ORDER_STATUS(id)}?status=${encodeURIComponent(status)}&order_status=${encodeURIComponent(status)}`;
    const res: any = await safeFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, orderStatus: status, order_status: status }),
    });

    const payload = res?.data ?? res;
    if (payload && typeof payload === "object") {
        return mapAdminOrder(payload);
    }
    return payload;
}

export async function getProducts(): Promise<Product[]> {
    let res: any;
    try {
        // Admin endpoint includes both active and inactive products.
        res = await safeFetch(API_ENDPOINTS.GET_PRODUCTS_ADMIN, { method: "GET" });
    } catch (adminErr) {
        console.warn("GET_PRODUCTS_ADMIN failed, falling back to public endpoint:", adminErr);
        res = await safeFetch(API_ENDPOINTS.GET_PRODUCTS, { method: "GET" });
    }
    const list: any[] = Array.isArray(res)
        ? res
        : (res?.data ?? res?.products ?? []);
    return list.map(mapProduct);
}

export async function updateUser(id: number | string, data: any) {
    return safeFetch(API_ENDPOINTS.UPDATE_USER(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function updateUserStatus(id: number | string, data: any) {
    return safeFetch(API_ENDPOINTS.UPDATE_USER_STATUS(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function getUsers(): Promise<UserResponse[]> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_USERS, { method: "GET" });
    if (!res) {
        throw new Error("Failed to fetch users");
    }
    console.log("GET_USERS raw response:", res);

    const list =
        Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
                Array.isArray(res?.users) ? res.users :
                    Array.isArray(res?.customers) ? res.customers :
                        Array.isArray(res?.content) ? res.content :
                            Array.isArray(res?.data?.users) ? res.data.users :
                                Array.isArray(res?.data?.customers) ? res.data.customers :
                                    Array.isArray(res?.data?.content) ? res.data.content : [];

    if (list.length > 0) {
        console.log("GET_USERS first raw user:", JSON.stringify(list[0]));
    }

    return list
        .filter(isCustomerRecord)
        .map((u: any) => mapUser(u));
}


export async function getAddresses(): Promise<Record<number, UserAddress[]>> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_ADDRESSES, { method: "GET" });
    console.log("GET_ADDRESSES raw response:", res);
    const list: any[] =
        Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
                Array.isArray(res?.addresses) ? res.addresses :
                    Array.isArray(res?.data?.addresses) ? res.data.addresses : [];

    // Group addresses by userId
    const grouped: Record<number, UserAddress[]> = {};
    for (const a of list) {
        const userId = Number(a.user_id ?? a.userId ?? a.customerId ?? 0);
        if (!userId) continue;

        // Construct visual addressLine but keep all fields
        const parts = [a.building_no, a.building_name, a.street_no, a.area_name, a.city, a.state, a.pincode].filter(Boolean);
        const constructed = parts.join(", ");
        const fallback = formatUserAddress(a) || a.addressLine || a.address_line || a.fullAddress || a.full_address || "";

        if (!grouped[userId]) grouped[userId] = [];
        grouped[userId].push({
            id: a.id,
            type: String(a.address_type ?? a.type ?? a.addressType ?? "Other"),
            addressLine: constructed || fallback || "No address details",
            building_no: a.building_no,
            building_name: a.building_name,
            street_no: a.street_no,
            area_name: a.area_name,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            is_default: a.is_default,
            status: a.status,
            user_id: a.user_id
        });
    }
    return grouped;
}

export async function getUserAddresses(userId: number | string): Promise<UserAddress[]> {
    try {
        const res: any = await safeFetch(API_ENDPOINTS.GET_USER_ADDRESSES(userId), { method: "GET" });
        console.log("[getUserAddresses] API response:", res);

        const list: any[] =
            Array.isArray(res) ? res :
                Array.isArray(res?.data) ? res.data :
                    Array.isArray(res?.addresses) ? res.addresses :
                        Array.isArray(res?.data?.addresses) ? res.data.addresses :
                            Array.isArray(res?.data?.data) ? res.data.data :
                                Array.isArray(res?.result) ? res.result : [];

        if (list.length > 0) {
            return list.map((a: any) => {
                const parts = [a.building_no, a.building_name, a.street_no, a.area_name, a.city, a.state, a.pincode].filter(Boolean);
                return {
                    id: a.id,
                    type: String(a.address_type ?? a.type ?? a.addressType ?? "Other"),
                    addressLine: parts.join(", ") || formatUserAddress(a) || a.addressLine || a.address_line || "No address details",
                    building_no: a.building_no,
                    building_name: a.building_name,
                    street_no: a.street_no,
                    area_name: a.area_name,
                    city: a.city,
                    state: a.state,
                    pincode: a.pincode,
                    is_default: a.is_default,
                    status: a.status,
                    user_id: a.user_id ?? userId
                };
            });
        }
        return [];
    } catch (err) {
        console.error("[getUserAddresses] Failed to fetch secure address data:", err);
        return [];
    }
}

// saveUserAddresses removed as admin is read-only for addresses

export async function getUserCart(userId: number | string): Promise<any[]> {
    try {
        const res: any = await safeFetch(API_ENDPOINTS.GET_USER_CART(userId), { method: "GET" });
        console.log(`[getUserCart] API response for user ${userId}:`, res);
        
        const list: any[] = 
            Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.cart?.items) ? res.cart.items :
            Array.isArray(res?.cart?.cartItems) ? res.cart.cartItems :
            Array.isArray(res?.cartItems) ? res.cartItems :
            Array.isArray(res?.cart_items) ? res.cart_items :
            Array.isArray(res?.items) ? res.items :
            Array.isArray(res?.data?.cartItems) ? res.data.cartItems :
            Array.isArray(res?.data?.cart_items) ? res.data.cart_items :
            Array.isArray(res?.data?.items) ? res.data.items : [];
            
        return list.map((item: any) => {
            const product = item?.product ?? item?.productDetails ?? {};
            const variant = item?.variant ?? item?.variantDetails ?? {};
            return {
                ...item,
                product: {
                    ...product,
                    name: item?.productName ?? item?.product_name ?? item?.name ?? product?.name ?? product?.productName ?? product?.product_name ?? "Unknown Product",
                    image: item?.image ?? item?.imageUrl ?? item?.image_url ?? product?.image ?? product?.imageUrl ?? product?.image_url ?? ""
                },
                variant: {
                    ...variant,
                    name: item?.variantName ?? item?.variant_name ?? variant?.name ?? variant?.variantName ?? variant?.variant_name ?? ""
                },
                quantity: toNumeric(item?.quantity ?? item?.qty ?? 1) || 1,
                price: toNumeric(item?.price ?? item?.unitPrice ?? item?.unit_price ?? item?.subtotal ?? 0)
            };
        });
    } catch (err) {
        console.error(`[getUserCart] Failed to fetch cart for user ${userId}:`, err);
        return [];
    }
}

export async function getUserOrders(userId: number | string): Promise<AdminOrder[]> {
    try {
        const res: any = await safeFetch(API_ENDPOINTS.GET_USER_ORDERS(userId), { method: "GET" });
        console.log(`[getUserOrders] API response for user ${userId}:`, res);
        
        const list: any[] = 
            Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.orders) ? res.orders :
            Array.isArray(res?.data?.orders) ? res.data.orders : [];
            
        return list.map(mapAdminOrder).filter(order => order.id !== "");
    } catch (err) {
        console.error(`[getUserOrders] Failed to fetch orders for user ${userId}:`, err);
        return [];
    }
}

export async function createProduct(data: any | FormData) {
    // If it's FormData (for uploading images), omit Content-Type so the browser sets it with the boundary
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = isFormData ? {} : { "Content-Type": "application/json" };
    const body = isFormData ? data : JSON.stringify(data);

    return safeFetch(API_ENDPOINTS.CREATE_PRODUCT, {
        method: "POST",
        headers,
        body,
    });
}

export async function updateProduct(id: number | string, data: any | FormData) {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = isFormData ? {} : { "Content-Type": "application/json" };
    const body = isFormData ? data : JSON.stringify(data);

    return safeFetch(API_ENDPOINTS.UPDATE_PRODUCT(id), {
        method: "PUT",
        headers,
        body,
    });
}

export async function toggleProductStatus(id: number | string) {
    return safeFetch(API_ENDPOINTS.TOGGLE_PRODUCT_STATUS(id), {
        method: "PATCH",
    });
}

export async function getCategories() {
    // Use admin endpoint to get all categories (both active and inactive)
    // The public endpoint only returns active categories
    return safeFetch(API_ENDPOINTS.GET_CATEGORIES_ADMIN, { method: "GET" });
}

export async function createCategory(data: any, imageFile?: File | null) {
    const formData = new FormData();
    formData.append("category", JSON.stringify(data));
    if (imageFile) {
        formData.append("imageFile", imageFile);
    }

    return safeFetch(API_ENDPOINTS.CREATE_CATEGORY, {
        method: "POST",
        body: formData,
    });
}

export async function updateCategory(id: number | string, data: any, imageFile?: File | null) {
    const formData = new FormData();
    formData.append("category", JSON.stringify(data));
    if (imageFile) {
        formData.append("image", imageFile);
    }

    return safeFetch(API_ENDPOINTS.UPDATE_CATEGORY(id), {
        method: "PUT",
        body: formData,
    });
}

export interface CategoryProductsStatusSyncResult {
    categoryId: number | string;
    isActive: boolean;
    updatedProductsCount: number;
    updatedProductIds: Array<number | string>;
    strategy: "transaction" | "batch" | "single-update" | "category-only";
    raw?: any;
}

function extractUpdatedProductIds(payload: any): Array<number | string> {
    const list =
        payload?.updatedProductIds ??
        payload?.updated_product_ids ??
        payload?.productIds ??
        payload?.product_ids ??
        payload?.data?.updatedProductIds ??
        payload?.data?.updated_product_ids ??
        payload?.data?.productIds ??
        payload?.data?.product_ids;

    return Array.isArray(list) ? list.filter((id) => id != null) : [];
}

function extractUpdatedProductsCount(payload: any, fallbackCount: number): number {
    const value =
        payload?.updatedProductsCount ??
        payload?.updated_products_count ??
        payload?.count ??
        payload?.updatedCount ??
        payload?.data?.updatedProductsCount ??
        payload?.data?.updated_products_count ??
        payload?.data?.count ??
        payload?.data?.updatedCount;

    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallbackCount;
}

export async function syncCategoryAndProductsStatus(
    categoryId: number | string,
    isActive: boolean,
    productIds: Array<number | string> = []
): Promise<CategoryProductsStatusSyncResult> {
    const statusPayload = {
        isActive,
        is_active: isActive,
        status: isActive ? "Active" : "Inactive",
        productIds,
        product_ids: productIds,
    };

    const transactionEndpoints = [
        API_ENDPOINTS.UPDATE_CATEGORY_WITH_PRODUCTS_STATUS(categoryId),
        `${BASE_URL}/api/v1/admin/categories/${categoryId}/status-sync`,
        `${BASE_URL}/api/v1/admin/categories/${categoryId}/status`,
    ];

    for (const endpoint of transactionEndpoints) {
        try {
            const res: any = await safeFetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(statusPayload),
            });

            const updatedProductIds = extractUpdatedProductIds(res);
            const updatedProductsCount = extractUpdatedProductsCount(
                res,
                updatedProductIds.length > 0 ? updatedProductIds.length : productIds.length
            );

            return {
                categoryId,
                isActive,
                updatedProductsCount,
                updatedProductIds: updatedProductIds.length > 0 ? updatedProductIds : productIds,
                strategy: "transaction",
                raw: res,
            };
        } catch {
            // Try next transaction endpoint.
        }
    }

    await updateCategory(categoryId, statusPayload);

    if (productIds.length === 0) {
        return {
            categoryId,
            isActive,
            updatedProductsCount: 0,
            updatedProductIds: [],
            strategy: "category-only",
        };
    }

    const batchEndpoints = [
        API_ENDPOINTS.BATCH_UPDATE_PRODUCTS_STATUS,
        `${BASE_URL}/api/v1/admin/products/status/batch`,
    ];

    let lastBatchError: unknown;
    for (const endpoint of batchEndpoints) {
        try {
            const res: any = await safeFetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(statusPayload),
            });

            const updatedProductIds = extractUpdatedProductIds(res);
            const updatedProductsCount = extractUpdatedProductsCount(
                res,
                updatedProductIds.length > 0 ? updatedProductIds.length : productIds.length
            );

            return {
                categoryId,
                isActive,
                updatedProductsCount,
                updatedProductIds: updatedProductIds.length > 0 ? updatedProductIds : productIds,
                strategy: "batch",
                raw: res,
            };
        } catch (err) {
            lastBatchError = err;
        }
    }

    // Final fallback for backends that only expose single-product update routes.
    // Use FormData because several product update endpoints reject application/json.
    const allProducts = await getProducts();
    const productMap = new Map(allProducts.map((product) => [String(product.id), product]));

    const updatedIds: Array<number | string> = [];
    for (const productId of productIds) {
        const product = productMap.get(String(productId));

        const payload = product
            ? {
                name: product.name,
                description: product.description,
                isActive,
                categoryId: product.category_id ?? categoryId,
                images: (product.images || []).map((url) => ({ imageUrl: url })),
                variants: (product.variants || []).map((variant) => ({
                    id: variant.id,
                    variantName: variant.variant_name,
                    sku: variant.sku,
                    mrp: variant.mrp,
                    price: variant.price,
                    discount: variant.discount,
                    stockQuantity: variant.stock_quantity,
                    availabilityStatus: variant.availability_status,
                    isActive,
                    images: (variant.images || []).map((url) => ({ imageUrl: url })),
                })),
            }
            : {
                isActive,
                is_active: isActive,
                status: isActive ? "Active" : "Inactive",
                categoryId,
            };

        const formData = new FormData();
        formData.append("product", JSON.stringify(payload));

        await updateProduct(productId, formData);
        updatedIds.push(productId);
    }

    if (updatedIds.length === productIds.length) {
        return {
            categoryId,
            isActive,
            updatedProductsCount: updatedIds.length,
            updatedProductIds: updatedIds,
            strategy: "single-update",
        };
    }

    throw lastBatchError instanceof Error
        ? lastBatchError
        : new Error("Failed to synchronize category and product statuses.");
}

// --- Coupons API ---

export interface CouponPayload {
    code: string;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    expireDate?: string | null;
    usageLimitPerUser: number;
    daysOfWeek: string | null;
    startDate?: string | null;
    startTime: string | null;
    endTime: string | null;
    isActive: boolean;
    platform: string;
}

export interface CouponResponse extends CouponPayload {
    id: number;
    createdAt: string;
}

export interface MemberResponse {
    id: number;
    name: string;
    email: string;
    mobile: string;
    role: string;
    is_active: boolean;
    created_at: string;
    address: string;
    status: "Active" | "Inactive" | "Pending";
}

export interface UserAddress {
    id?: number;
    type: string;
    addressLine: string;
    building_no?: string;
    building_name?: string;
    street_no?: string;
    area_name?: string;
    city?: string;
    state?: string;
    pincode?: string;
    is_default?: number;
    status?: string;
    user_id?: number;
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    mobile: string;
    gender: string;
    dob: string;
    addresses: UserAddress[];
    joiningDate: string;
    status: "Active" | "Inactive" | "Blocked";
    image: string;
}

function formatUserAddress(address: any): string {
    if (typeof address === "string") return address;
    if (!address || typeof address !== "object") return "";

    const parts = [
        address.line1,
        address.line2,
        address.street,
        address.area,
        address.city,
        address.state,
        address.country,
        address.zip,
        address.pincode,
        address.postalCode,
    ].filter(Boolean);

    return parts.join(", ");
}

function isCustomerRecord(user: any): boolean {
    const role = String(user.role ?? user.userRole ?? user.type ?? user.accountType ?? "").toLowerCase();
    const roles = Array.isArray(user.roles)
        ? user.roles.map((value: any) => String(value).toLowerCase())
        : [];
    const hasAdminRole =
        role.includes("admin") ||
        roles.some((value: string) => value.includes("admin")) ||
        user.isAdmin === true ||
        user.is_admin === true;
    const hasCustomerRole =
        role.includes("customer") ||
        role.includes("user") ||
        roles.some((value: string) => value.includes("customer") || value.includes("user")) ||
        user.customerId != null;

    if (hasAdminRole) return false;
    if (hasCustomerRole) return true;
    return true;
}

function mapUser(user: any): UserResponse {
    const isBlocked = user.isBlocked ?? user.is_blocked ?? false;
    const isActive = user.isActive ?? user.is_active;
    const statusValue = typeof user.status === "string" ? user.status.toLowerCase() : "";
    const status: UserResponse["status"] =
        statusValue === "blocked" || isBlocked ? "Blocked"
            : statusValue === "inactive" || isActive === false ? "Inactive"
                : "Active";

    const nameParts = [user.firstName, user.lastName].filter(Boolean);
    const resolvedName =
        user.name ??
        user.fullName ??
        (nameParts.length ? nameParts.join(" ") : undefined) ??
        user.username ??
        user.customerName ??
        "Unknown User";

    let addresses: UserAddress[] = [];
    if (Array.isArray(user.addresses) && user.addresses.length > 0) {
        addresses = user.addresses.map((a: any) => ({
            id: a.id,
            type: a.address_type || a.type || a.addressType || "Other",
            addressLine: formatUserAddress(a) || a.addressLine || a.location || "",
            building_no: a.building_no,
            building_name: a.building_name,
            street_no: a.street_no,
            area_name: a.area_name,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            is_default: a.is_default,
            status: a.status,
            user_id: a.user_id
        }));
    } else if (Array.isArray(user.address) && user.address.length > 0) {
        addresses = user.address.map((a: any) => ({
            id: a.id,
            type: a.address_type || a.type || a.addressType || "Other",
            addressLine: formatUserAddress(a) || a.addressLine || a.location || "",
            building_no: a.building_no,
            building_name: a.building_name,
            street_no: a.street_no,
            area_name: a.area_name,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            is_default: a.is_default,
            status: a.status,
            user_id: a.user_id
        }));
    } else {
        const singleAddress = formatUserAddress(user.address) || user.location || user.city || "";
        if (singleAddress) {
            addresses.push({
                type: "Home",
                addressLine: singleAddress,
                city: user.city,
                state: user.state,
                pincode: user.pincode
            });
        }
    }

    return {
        id: Number(user.id ?? user.userId ?? user.customerId ?? 0),
        name: resolvedName,
        email: user.email ?? user.mail ?? "",
        mobile: user.mobile ?? user.phone ?? user.phoneNumber ?? "",
        gender: user.gender ?? "",
        dob: user.dob ?? user.dateOfBirth ?? user.date_of_birth ?? "",
        addresses,
        joiningDate: user.createdAt ?? user.created_at ?? user.joiningDate ?? user.registeredAt ?? "",
        status,
        image: user.image ?? user.imageUrl ?? user.profileImage ?? user.profile_picture ?? user.avatar ?? "",
    };
}

function mapMember(m: any): MemberResponse {
    const isActive = m.isActive ?? m.is_active ?? false;
    const role = m.role ?? "None";
    const status = m.status ?? (role === "None" ? "Pending" : (isActive ? "Active" : "Inactive"));
    return {
        id: m.id ?? 0,
        name: m.name ?? "",
        email: m.email ?? "",
        mobile: m.mobile ?? "",
        role,
        is_active: isActive,
        created_at: m.createdAt ?? m.created_at ?? "",
        address: m.address ?? "",
        status,
    };
}

export async function getCoupons() {
    const res: any = await safeFetch(API_ENDPOINTS.GET_COUPONS, { method: "GET" });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.coupons)) return res.coupons;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
}

export async function createCoupon(data: CouponPayload) {
    return safeFetch(API_ENDPOINTS.CREATE_COUPON, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function updateCoupon(id: number | string, data: CouponPayload) {
    return safeFetch(API_ENDPOINTS.UPDATE_COUPON(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function deleteCoupon(id: number | string) {
    return safeFetch(API_ENDPOINTS.DELETE_COUPON(id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    });
}

// --- Members API ---

export async function getMembers(): Promise<MemberResponse[]> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_MEMBERS, { method: "GET" });
    console.log("GET_MEMBERS raw response:", res);
    const list =
        Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
                Array.isArray(res?.members) ? res.members :
                    Array.isArray(res?.admins) ? res.admins :
                        Array.isArray(res?.users) ? res.users :
                            Array.isArray(res?.content) ? res.content :
                                Array.isArray(res?.data?.members) ? res.data.members :
                                    Array.isArray(res?.data?.admins) ? res.data.admins :
                                        Array.isArray(res?.data?.users) ? res.data.users :
                                            Array.isArray(res?.data?.content) ? res.data.content : [];
    return list.map(mapMember);
}

export interface AdminProfileLookup {
    id?: string | number;
    email?: string;
}

export async function getCurrentAdminProfile(sessionUser?: AdminProfileLookup): Promise<MemberResponse | null> {
    const members = await getMembers();
    if (!members.length) return null;

    const sessionId = sessionUser?.id != null ? String(sessionUser.id) : "";
    const sessionEmail = (sessionUser?.email ?? "").trim().toLowerCase();

    if (sessionId) {
        const byId = members.find((member) => String(member.id) === sessionId);
        if (byId) return byId;
    }

    if (sessionEmail) {
        const byEmail = members.find((member) => (member.email ?? "").trim().toLowerCase() === sessionEmail);
        if (byEmail) return byEmail;
    }

    const adminLike = members.find((member) => (member.role ?? "").toLowerCase().includes("admin"));
    return adminLike ?? members[0] ?? null;
}

export async function updateMember(id: number | string, data: any) {
    return safeFetch(API_ENDPOINTS.UPDATE_MEMBER(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

// --- Banners API ---

export async function getBanners(): Promise<Banner[]> {
    const res: any = await safeFetch(API_ENDPOINTS.GET_BANNERS, { method: "GET" });
    console.log("GET_BANNERS raw response:", res);
    const list =
        res?.success && Array.isArray(res.data) ? res.data :
            Array.isArray(res?.data) ? res.data :
                Array.isArray(res?.content) ? res.content :
                    Array.isArray(res?.banners) ? res.banners :
                        Array.isArray(res) ? res : [];
    return list.map(mapBanner);
}

export async function createBanner(data: any) {
    return safeFetch(API_ENDPOINTS.CREATE_BANNER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function updateBanner(id: number | string, data: any) {
    return safeFetch(API_ENDPOINTS.UPDATE_BANNER(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function uploadBannerImage(id: number | string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return safeFetch(API_ENDPOINTS.UPLOAD_BANNER_IMAGE(id), {
        method: "POST",
        body: formData,
    });
}

export async function deleteBanner(id: number | string) {
    return safeFetch(API_ENDPOINTS.DELETE_BANNER(id), {
        method: "DELETE",
    });
}

// --- Analytics ---

export function buildAnalyticsQueryString(filters: any): string {
    if (!filters) return "";
    const params = new URLSearchParams();
    const deriveDaysFromDateFilter = () => {
        const df = filters.dateFilter;
        if (!df) return undefined;
        const s = String(df).toLowerCase();
        if (s.includes("7")) return 7;
        if (s.includes("30")) return 30;
        if (s.includes("90")) return 90;
        if (s.includes("365") || s.includes("year")) return 365;
        const m = s.match(/(\d+)\s*days?/);
        if (m) return Number(m[1]);
        return undefined;
    };
    const deriveDaysFromRange = () => {
        if (!filters.startDate || !filters.endDate) return undefined;
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
        const ms = Math.abs(end.getTime() - start.getTime());
        return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
    };

    const daysFromFilter = deriveDaysFromDateFilter();
    const days = typeof filters.days === "number" ? filters.days : (daysFromFilter ?? deriveDaysFromRange());
    if (days && days > 0) params.append("days", String(days));

    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.gender && filters.gender !== "all") params.append("gender", filters.gender);
    if (filters.location && filters.location !== "all") params.append("location", filters.location);
    if (filters.orderStatus && filters.orderStatus !== "all") params.append("orderStatus", filters.orderStatus);
    if (filters.ageRange && filters.ageRange !== "all") params.append("ageRange", filters.ageRange);
    const activeProducts = Object.entries(filters.products || {})
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",");
    if (activeProducts) params.append("products", activeProducts);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isNonEmpty(val: any): boolean {
    if (val === null || val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0;
    if (typeof val === "number") return val !== 0;
    return false;
}

function isDenseAnalyticsPayload(data: any): boolean {
    if (!data || typeof data !== "object") return false;
    
    // Check for raw lists returned from stub API implementations
    if (Array.isArray(data.products) && Array.isArray(data.orders)) {
       return false; // Force fallback to process these raw materials
    }
    
    // At least 2 meaningful fields must be non-empty / non-zero
    const checks = [
        isNonEmpty(data.totalRevenue),
        isNonEmpty(data.monthlyData),
        isNonEmpty(data.productData),
        isNonEmpty(data.barData),
        isNonEmpty(data.pieData),
        isNonEmpty(data.statusData),
        isNonEmpty(data.processedProducts),
        isNonEmpty(data.stagesWithDropoff),
        isNonEmpty(data.uniqueCustomers),
        isNonEmpty(data.total),
        isNonEmpty(data.visitors),
        isNonEmpty(data.banners),
        isNonEmpty(data.totalViews),
    ];
    return checks.filter(Boolean).length >= 2;
}

function isUsefulSeries(data: any[], expectedKeys: string[] = ["name", "value"]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const validItems = data.filter(item => item && typeof item === "object" && expectedKeys.every(key => key in item));
    if (validItems.length === 0) return false;

    const labels = validItems.map(item => String(item.name ?? item.age ?? item.label ?? "").trim()).filter(Boolean);
    if (labels.length === 0) return false;

    const normalizedLabels = labels.map(label => label.toLowerCase());
    const allUnknown = normalizedLabels.every(label => label === "unknown" || label === "other" || label === "all users");
    return !allUnknown;
}

async function buildRevenueFallback(filters: any): Promise<any> {
    const [dbOrders, dbProducts, dbUsers] = await Promise.all([getAdminOrders(), getProducts(), getUsers().catch(() => [])]);
    const orders = dbOrders.length > 0 ? dbOrders : mockOrders as any;
    const products = dbProducts.length > 0 ? dbProducts : mockProducts as any;
    const filtered = filterOrdersByDate(orders, filters);
    const revenue = computeRevenueFromOrders(filtered, products);
    const demographic = computeDemographicAnalytics(dbUsers as any, filtered, filters);

    const genderFills: Record<string, string> = { Male: "#3b82f6", Female: "#ec4899", Other: "#8b5cf6" };
    const ageDataFromDemographic = Array.isArray(demographic?.ageRevenueData) && demographic.ageRevenueData.length > 0
        ? demographic.ageRevenueData.map((item: any) => ({ name: item.age, value: item.revenue ?? 0 }))
        : revenue.ageData;
    const genderDataFromDemographic = Array.isArray(demographic?.genderRevenueData) && demographic.genderRevenueData.length > 0
        ? demographic.genderRevenueData.map((item: any) => ({ name: item.name, value: item.revenue ?? 0, fill: genderFills[item.name] ?? "#94a3b8" }))
        : revenue.genderData;

    return {
        ...revenue,
        ageData: ageDataFromDemographic,
        genderData: genderDataFromDemographic,
    };
}

function filterOrdersByDate(orders: AdminOrder[], filters: any): AdminOrder[] {
    if (!filters?.startDate && !filters?.endDate) return orders;
    const start = filters.startDate ? new Date(filters.startDate).getTime() : 0;
    const end = filters.endDate ? new Date(filters.endDate + "T23:59:59").getTime() : Infinity;
    return orders.filter(o => {
        if (!o.date) return true;
        const t = new Date(o.date).getTime();
        return t >= start && t <= end;
    });
}

function groupByMonth(orders: AdminOrder[]): { name: string; revenue: number }[] {
    const map: Record<string, number> = {};
    for (const o of orders) {
        if (!o.date) continue;
        const d = new Date(o.date);
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        map[key] = (map[key] || 0) + (o.finalAmount ?? o.totalAmount ?? 0);
    }
    return Object.entries(map)
        .sort(([a], [b]) => {
            const parse = (s: string) => new Date("01 " + s);
            return parse(a).getTime() - parse(b).getTime();
        })
        .map(([name, revenue]) => ({ name, revenue }));
}

function computeRevenueFromOrders(orders: AdminOrder[], products: any[]): any {
    if (!orders.length && !products.length) return null;

    const totalRevenue = orders.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount ?? 0), 0);
    const productNameMap = new Map<string, string>(products.map((p: any) => [String(p.id), p.name ?? "Unknown"]));

    // Monthly trend
    const monthlyData = groupByMonth(orders);

    // Product revenue map from order items
    const productRevMap: Record<string, { name: string; revenue: number; units: number; price: number }> = {};
    for (const order of orders) {
        for (const item of order.items ?? []) {
            const key = String(item.productId ?? item.productName ?? "Unknown");
            if (!productRevMap[key]) {
                productRevMap[key] = { name: item.productName || productNameMap.get(key) || "Unknown", revenue: 0, units: 0, price: item.price ?? 0 };
            }
            productRevMap[key].revenue += (item.price ?? 0) * (item.quantity ?? 1);
            productRevMap[key].units += item.quantity ?? 1;
        }
    }

    // Fallback: compute from product.sold if no order items
    if (Object.keys(productRevMap).length === 0 && products.length > 0) {
        for (const p of products) {
            for (const v of p.variants ?? []) {
                const key = String(p.id);
                if (!productRevMap[key]) productRevMap[key] = { name: p.name, revenue: 0, units: 0, price: v.price ?? 0 };
                productRevMap[key].revenue += (v.price ?? 0) * (v.sold ?? 0);
                productRevMap[key].units += v.sold ?? 0;
            }
        }
    }

    const productData = Object.values(productRevMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

    const AGE_ORDER = ["<18", "18-24", "25-34", "35-44", "45-54", "55+", "Unknown"];
    const ageCount: Record<string, number> = {};
    const ageRevenue: Record<string, number> = {};
    const genderCount: Record<string, number> = {};
    const genderRevenue: Record<string, number> = {};

    for (const order of orders as any[]) {
        const demographics = order.customerDemographics ?? order.customer_demographics ?? order.customer ?? order.user ?? {};
        const rawGender = demographics.gender ?? demographics.sex ?? demographics.customerGender;
        const rawAge = demographics.age ?? demographics.customerAge ?? demographics.dobAge;
        const gender = String(rawGender ?? "Other");
        const ageGroup = getAgeGroup(Number(rawAge));
        const revenue = order.finalAmount ?? order.totalAmount ?? 0;

        genderCount[gender] = (genderCount[gender] || 0) + 1;
        genderRevenue[gender] = (genderRevenue[gender] || 0) + revenue;
        ageCount[ageGroup] = (ageCount[ageGroup] || 0) + 1;
        ageRevenue[ageGroup] = (ageRevenue[ageGroup] || 0) + revenue;
    }

    const genderFills: Record<string, string> = { Male: "#3b82f6", Female: "#ec4899", Other: "#8b5cf6" };
    const ageData = AGE_ORDER.filter(a => ageCount[a]).map(age => ({ name: age, value: ageCount[age] ?? 0 }));
    const genderData = Object.entries(genderCount).map(([name, value]) => ({ name, value, fill: genderFills[name] ?? "#94a3b8" }));

    // Growth: compare last half vs first half of monthly data
    let growth: string | null = null;
    if (monthlyData.length >= 2) {
        const mid = Math.floor(monthlyData.length / 2);
        const prev = monthlyData.slice(0, mid).reduce((s, m) => s + m.revenue, 0);
        const curr = monthlyData.slice(mid).reduce((s, m) => s + m.revenue, 0);
        if (prev > 0) {
            const pct = (((curr - prev) / prev) * 100).toFixed(1);
            growth = `${Number(pct) >= 0 ? "+" : ""}${pct}%`;
        }
    }

    return {
        totalRevenue,
        monthlyData,
        productData,
        ageData,
        genderData,
        growth,
    };
}

function computeProductAnalytics(products: any[], orders: AdminOrder[]): any {
    if (!products.length) return null;

    // Build product revenue map from order items
    const revMap: Record<string, number> = {};
    const unitMap: Record<string, number> = {};
    for (const order of orders) {
        for (const item of order.items ?? []) {
            const key = String(item.productId ?? "");
            if (!key) continue;
            revMap[key] = (revMap[key] || 0) + (item.price ?? 0) * (item.quantity ?? 1);
            unitMap[key] = (unitMap[key] || 0) + (item.quantity ?? 1);
        }
    }

    // Category unit count
    const catMap: Record<string, number> = {};
    let totalUnits = 0;
    let lowStockCount = 0;

    interface ProcessedProduct {
        id: any;
        name: string;
        category: string;
        unitsSold: number;
        revenue: number;
        stock: number;
        refundRate: number;
        status: string;
    }

    const processedProducts: ProcessedProduct[] = products.map(p => {
        const variants = p.variants ?? [];
        const totalStock = variants.reduce((s: number, v: any) => s + (v.stock_quantity ?? 0), 0);
        const sold = unitMap[String(p.id)] ?? variants.reduce((s: number, v: any) => s + (v.sold ?? 0), 0);
        const revenue = revMap[String(p.id)] ?? variants.reduce((s: number, v: any) => s + (v.price ?? 0) * (v.sold ?? 0), 0);
        const cat = p.category || "Uncategorized";
        catMap[cat] = (catMap[cat] || 0) + sold;
        totalUnits += sold;

        const status =
            totalStock === 0 ? "Out of Stock" :
            totalStock < 10 ? "Low Stock" : "In Stock";
        if (status !== "In Stock") lowStockCount++;

        return { id: p.id, name: p.name, category: cat, unitsSold: sold, revenue, stock: totalStock, refundRate: 0, status };
    });

    processedProducts.sort((a, b) => b.revenue - a.revenue);

    const topRevenueProduct = processedProducts[0] ?? null;
    const slowMovingProduct = [...processedProducts].sort((a, b) => a.unitsSold - b.unitsSold)[0] ?? null;
    const mostAddedToCartProduct = [...processedProducts].sort((a, b) => b.unitsSold - a.unitsSold)[0] ?? null;
    const topCategory = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";

    const barData = processedProducts.slice(0, 5).map(p => ({ name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name, revenue: p.revenue }));

    const pieData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        topRevenueProduct,
        slowMovingProduct,
        mostAddedToCartProduct,
        totalUnits,
        avgRefundRate: 0,
        topCategory,
        lowStockCount,
        barData,
        pieData,
        monthlyData: [],
        processedProducts,
    };
}

function computeDemographicAnalytics(users: any[], orders: AdminOrder[], filters: any): any {
    if (!users.length && !orders.length) return null;

    const filterStart = filters?.startDate ? new Date(filters.startDate).getTime() : 0;

    // Orders per user id
    const ordersByUser: Record<string, AdminOrder[]> = {};
    for (const o of orders) {
        const uid = String(o.userId ?? "");
        if (!uid) continue;
        if (!ordersByUser[uid]) ordersByUser[uid] = [];
        ordersByUser[uid].push(o);
    }

    const totalRevenue = orders.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount ?? 0), 0);

    // New vs returning
    let newCust = 0, returning = 0;
    const genderRev: Record<string, number> = {};
    const genderCount: Record<string, number> = {};
    const ageCount: Record<string, number> = {};
    const ageRev: Record<string, number> = {};

    interface TopCustomer {
        name: string;
        gender: string;
        age: string;
        location: string;
        orders: number;
        revenue: number;
    }

    const topCustomerMap: Record<string, TopCustomer> = {};

    for (const u of users) {
        const uid = String(u.id ?? "");
        const userOrders = ordersByUser[uid] ?? [];
        const userRevenue = userOrders.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount ?? 0), 0);
        const joinedAt = u.joiningDate ? new Date(u.joiningDate).getTime() : 0;

        if (filterStart > 0 && joinedAt >= filterStart) newCust++;
        else if (filterStart === 0) newCust++; // all new if no filter

        if (userOrders.length > 1) returning++;

        const gender = u.gender || "Other";
        genderCount[gender] = (genderCount[gender] || 0) + 1;
        genderRev[gender] = (genderRev[gender] || 0) + userRevenue;

        // Age group from dob
        let ageGroup = "Unknown";
        if (u.dob) {
            const age = new Date().getFullYear() - new Date(u.dob).getFullYear();
            if (age < 18) ageGroup = "<18";
            else if (age < 25) ageGroup = "18-24";
            else if (age < 35) ageGroup = "25-34";
            else if (age < 45) ageGroup = "35-44";
            else if (age < 55) ageGroup = "45-54";
            else ageGroup = "55+";
        }
        ageCount[ageGroup] = (ageCount[ageGroup] || 0) + 1;
        ageRev[ageGroup] = (ageRev[ageGroup] || 0) + userRevenue;

        if (userRevenue > 0 || userOrders.length > 0) {
            topCustomerMap[uid] = {
                name: u.name || "Unknown",
                gender,
                age: ageGroup,
                location: u.addresses?.[0]?.city ?? u.addresses?.[0]?.addressLine?.split(",").pop()?.trim() ?? "—",
                orders: userOrders.length,
                revenue: userRevenue,
            };
        }
    }

    const uniqueCustomers = users.length;
    const returningPct = uniqueCustomers > 0 ? ((returning / uniqueCustomers) * 100).toFixed(1) : "0";

    const genderFills: Record<string, string> = { Male: "#3b82f6", Female: "#ec4899", Other: "#8b5cf6" };
    const genderPieData = Object.entries(genderCount).map(([name, value]) => ({ name, value, fill: genderFills[name] ?? "#94a3b8" }));
    const genderRevenueData = Object.entries(genderRev).map(([name, revenue]) => ({ name, revenue }));

    const AGE_ORDER = ["<18", "18-24", "25-34", "35-44", "45-54", "55+", "Unknown"];
    const ageData = AGE_ORDER.filter(a => ageCount[a]).map(age => ({ age, count: ageCount[age] ?? 0 }));
    const ageRevenueData = AGE_ORDER.filter(a => ageRev[a]).map(age => ({ age, revenue: ageRev[age] ?? 0 }));

    const topCustomers = Object.values(topCustomerMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);

    // If no users but we have orders, synthesize from orders
    if (users.length === 0 && orders.length > 0) {
        const customerMap: Record<string, { name: string; gender: string; age: string; location: string; orders: number; revenue: number }> = {};

        for (const o of orders as any[]) {
            const key = String(o.customer ?? o.userId ?? o.id ?? "unknown");
            const demographics = o.customerDemographics ?? {};
            const gender = String(demographics.gender ?? "Other");
            const age = getAgeGroup(Number(demographics.age));
            const location = String(demographics.location ?? o.shippingAddress?.split(",").pop()?.trim() ?? "—");
            if (!customerMap[key]) {
                customerMap[key] = {
                    name: String(o.customer ?? "Unknown"),
                    gender,
                    age,
                    location,
                    orders: 0,
                    revenue: 0,
                };
            }
            customerMap[key].orders += 1;
            customerMap[key].revenue += o.finalAmount ?? o.totalAmount ?? 0;
        }

        const customers = Object.values(customerMap);
        const genderFills: Record<string, string> = { Male: "#3b82f6", Female: "#ec4899", Other: "#8b5cf6" };
        const AGE_ORDER = ["<18", "18-24", "25-34", "35-44", "45-54", "55+", "Unknown"];
        const genderCount: Record<string, number> = {};
        const genderRev: Record<string, number> = {};
        const ageCount: Record<string, number> = {};
        const ageRev: Record<string, number> = {};

        for (const customer of customers) {
            genderCount[customer.gender] = (genderCount[customer.gender] || 0) + 1;
            genderRev[customer.gender] = (genderRev[customer.gender] || 0) + customer.revenue;
            ageCount[customer.age] = (ageCount[customer.age] || 0) + 1;
            ageRev[customer.age] = (ageRev[customer.age] || 0) + customer.revenue;
        }

        const uniqueCustomers = customers.length;
        const returning = customers.filter(c => c.orders > 1).length;
        const returningPct = uniqueCustomers > 0 ? ((returning / uniqueCustomers) * 100).toFixed(1) : "0";
        const genderPieData = Object.entries(genderCount).map(([name, value]) => ({ name, value, fill: genderFills[name] ?? "#94a3b8" }));
        const genderRevenueData = Object.entries(genderRev).map(([name, revenue]) => ({ name, revenue }));
        const ageData = AGE_ORDER.filter(a => ageCount[a]).map(age => ({ age, count: ageCount[age] ?? 0 }));
        const ageRevenueData = AGE_ORDER.filter(a => ageRev[a]).map(age => ({ age, revenue: ageRev[age] ?? 0 }));
        return {
            uniqueCustomers,
            newCust: uniqueCustomers,
            returning,
            returningPct,
            totalRevenue,
            genderPieData,
            genderRevenueData,
            ageData,
            ageRevenueData,
            topCustomers: customers.sort((a, b) => b.revenue - a.revenue).slice(0, 20),
        };
    }

    return {
        uniqueCustomers,
        newCust,
        returning,
        returningPct,
        totalRevenue,
        genderPieData,
        genderRevenueData,
        ageData,
        ageRevenueData,
        topCustomers,
    };
}

function computeFunnelFromOrders(orders: AdminOrder[], users: any[]): any {
    if (!orders.length) return null;

    const countByStatus: Record<string, number> = {};
    for (const o of orders) {
        const s = (o.status ?? "PROCESSING").toUpperCase();
        countByStatus[s] = (countByStatus[s] || 0) + 1;
    }

    const total = orders.length;
    const delivered = countByStatus["DELIVERED"] ?? 0;
    const cancelled = countByStatus["CANCELLED"] ?? 0;
    const paid = total - cancelled;
    const visitors = Math.max(users.length, total * 3); // approx 3x funnel top
    const addToCart = Math.round(total * 2.5);
    const checkoutStarted = Math.round(total * 1.2);
    const paymentCompleted = paid;
    const overallConversion = visitors > 0 ? ((delivered / visitors) * 100).toFixed(1) : "0";
    const cartAbandonment = addToCart > 0 ? (((addToCart - checkoutStarted) / addToCart) * 100).toFixed(1) : "0";

    const stages = [
        { stage: "Visitors", count: visitors, color: "#3b82f6" },
        { stage: "Add to Cart", count: addToCart, color: "#8b5cf6" },
        { stage: "Checkout", count: checkoutStarted, color: "#f59e0b" },
        { stage: "Payment", count: paymentCompleted, color: "#10b981" },
        { stage: "Delivered", count: delivered, color: "#16a34a" },
    ];

    const stagesWithDropoff = stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].count : s.count;
        const pct = stages[0].count > 0 ? parseFloat(((s.count / stages[0].count) * 100).toFixed(1)) : 0;
        const dropoffPct = i > 0 && prev > 0 ? parseFloat((((prev - s.count) / prev) * 100).toFixed(1)) : null;
        return { ...s, pct, dropoffPct };
    });

    const barData = stages.map(s => ({ stage: s.stage, count: s.count }));

    return {
        visitors,
        addToCart,
        checkoutStarted,
        paymentCompleted,
        delivered,
        overallConversion,
        cartAbandonment,
        stagesWithDropoff,
        barData,
    };
}

function computeOrderStatusAnalytics(orders: AdminOrder[]): any {
    if (!orders.length) return null;

    const STATUS_COLORS: Record<string, string> = {
        CREATED: "#94a3b8",
        PAID: "#3b82f6",
        PROCESSING: "#f59e0b",
        PACKED: "#a78bfa",
        OUT_FOR_DELIVERY: "#8b5cf6",
        ON_THE_WAY: "#8b5cf6",
        DELIVERED: "#16a34a",
        CANCELLED: "#ef4444",
        RETURN_REQUESTED: "#f97316",
        RETURNED: "#ec4899",
    };

    const countByStatus: Record<string, number> = {};
    for (const o of orders) {
        const s = (o.status ?? "PROCESSING").toUpperCase();
        countByStatus[s] = (countByStatus[s] || 0) + 1;
    }

    const total = orders.length;
    const delivered = countByStatus["DELIVERED"] ?? 0;
    const cancelled = countByStatus["CANCELLED"] ?? 0;
    const returnInProgress = countByStatus["RETURN_REQUESTED"] ?? 0;
    const returned = countByStatus["RETURNED"] ?? 0;
    const deliveredPct = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0";
    const cancelledPct = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0";

    const statusData = Object.entries(countByStatus)
        .sort(([, a], [, b]) => b - a)
        .map(([status, count]) => ({
            status,
            count,
            pct: parseFloat(((count / total) * 100).toFixed(1)),
            color: STATUS_COLORS[status] ?? "#ccc",
        }));

    const pieData = statusData.map(s => ({ name: s.status.replace(/_/g, " "), value: s.count, fill: s.color }));

    // Monthly breakdown by status
    const monthStatusMap: Record<string, Record<string, number>> = {};
    for (const o of orders) {
        if (!o.date) continue;
        const month = new Date(o.date).toLocaleDateString("en-IN", { month: "short" });
        const status = (o.status ?? "PROCESSING").toUpperCase();
        if (!monthStatusMap[month]) monthStatusMap[month] = {};
        monthStatusMap[month][status] = (monthStatusMap[month][status] || 0) + 1;
    }

    const stackedData = Object.entries(monthStatusMap).map(([month, statuses]) => ({ month, ...statuses }));
    const statusKeys = [...new Set(orders.map(o => (o.status ?? "PROCESSING").toUpperCase()))];

    // Cancellation trend per month
    const cancellationTrend = Object.entries(monthStatusMap).map(([month, statuses]) => ({
        month,
        cancelled: statuses["CANCELLED"] ?? 0,
    }));

    return {
        total,
        delivered,
        cancelled,
        returnInProgress,
        returned,
        deliveredPct,
        cancelledPct,
        statusData,
        pieData,
        cancellationTrend,
        stackedData,
        statusKeys,
    };
}

function computeBannerAnalyticsFromList(banners: any[]): any {
    if (!banners.length) return null;
    const totalViews = banners.reduce((s, b) => s + (b.analytics?.views ?? b.views ?? 0), 0);
    const totalClicks = banners.reduce((s, b) => s + (b.analytics?.clicks ?? b.clicks ?? 0), 0);
    return { banners, totalViews, totalClicks };
}

function computePaymentRefundAnalytics(orders: AdminOrder[]): any {
    if (!orders.length) return null;

    const total = orders.length;
    const payStatusMap: Record<string, number> = {};
    const methodRevMap: Record<string, { count: number; revenue: number }> = {};
    const monthRefundMap: Record<string, { refunds: number; amount: number }> = {};

    for (const o of orders) {
        const rawPayment = String(o.payment ?? "Pending").trim();
        const normalizedPayment = rawPayment.toUpperCase();
        payStatusMap[normalizedPayment] = (payStatusMap[normalizedPayment] || 0) + 1;

        const method = rawPayment || "Other";
        if (!methodRevMap[method]) methodRevMap[method] = { count: 0, revenue: 0 };
        methodRevMap[method].count += 1;
        methodRevMap[method].revenue += o.finalAmount ?? o.totalAmount ?? 0;

        const status = String(o.status ?? "").toUpperCase();
        if (["CANCELLED", "RETURNED", "REFUNDED"].includes(status) && o.date) {
            const month = new Date(o.date).toLocaleDateString("en-IN", { month: "short" });
            if (!monthRefundMap[month]) monthRefundMap[month] = { refunds: 0, amount: 0 };
            monthRefundMap[month].refunds += 1;
            monthRefundMap[month].amount += o.finalAmount ?? o.totalAmount ?? 0;
        }
    }

    const totalRevenue = orders.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount ?? 0), 0);
    const refundedOrders = orders.filter(o => ["CANCELLED", "RETURNED", "REFUNDED"].includes(String(o.status ?? "").toUpperCase()));
    const refundedAmount = refundedOrders.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount ?? 0), 0);
    const refundRate = total > 0 ? ((refundedOrders.length / total) * 100).toFixed(1) : "0";
    const failedCount = payStatusMap["FAILED"] ?? 0;
    const failedPct = total > 0 ? ((failedCount / total) * 100).toFixed(1) : "0";

    const STATUS_FILLS: Record<string, string> = {
        PAID: "#16a34a",
        PENDING: "#f59e0b",
        FAILED: "#ef4444",
        REFUNDED: "#8b5cf6",
    };

    const paymentStatusData = Object.entries(payStatusMap).map(([name, count]) => ({
        name,
        count,
        fill: STATUS_FILLS[name] ?? "#94a3b8",
    }));

    const methodData = Object.entries(methodRevMap)
        .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue);

    const refundTrend = Object.entries(monthRefundMap).map(([month, v]) => ({ month, ...v }));

    return {
        totalRevenue,
        refundedAmount,
        refundRate,
        failedPct,
        total,
        paymentStatusData,
        methodData,
        paymentPieData: methodData.map(m => ({ name: m.name, value: m.count })),
        refundTrend,
    };
}

function computeInventoryAnalytics(products: Product[]): any {
    if (!products.length) return null;

    let totalStock = 0;
    let outOfStock = 0;
    const stockStatusCount: Record<string, number> = {};
    const inventoryItems: any[] = [];
    const reorderItems: any[] = [];

    for (const p of products) {
        const variants = p.variants ?? [];
        const stock = variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0);
        const sold = variants.reduce((s, v) => s + (v.sold ?? 0), 0);
        totalStock += stock;

        const status =
            stock === 0 ? "Out of Stock" :
                stock < 5 ? "Critical" :
                    stock < 15 ? "Low Stock" : "In Stock";

        if (status === "Out of Stock") outOfStock++;
        stockStatusCount[status] = (stockStatusCount[status] || 0) + 1;

        const needsReorder = stock < 10;
        const item = {
            id: p.id,
            name: p.name,
            category: p.category ?? "Uncategorized",
            stock,
            sold,
            status,
            expirySoon: false,
            needsReorder,
        };

        inventoryItems.push(item);
        if (needsReorder) reorderItems.push(item);
    }

    const STATUS_FILLS: Record<string, string> = {
        "In Stock": "#16a34a",
        "Low Stock": "#f59e0b",
        "Critical": "#f97316",
        "Out of Stock": "#ef4444",
    };

    const stockStatusData = Object.entries(stockStatusCount).map(([name, value]) => ({
        name,
        value,
        fill: STATUS_FILLS[name] ?? "#ccc",
    }));

    const stockVsSold = [...inventoryItems]
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 8)
        .map(p => ({
            name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
            stock: p.stock,
            sold: p.sold,
        }));

    return {
        totalStock,
        outOfStock,
        expirySoon: 0,
        reorderNeeded: reorderItems.length,
        stockStatusData,
        stockVsSold,
        movementData: [],
        inventoryItems,
        reorderItems,
    };
}

function safeNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function computeDashboardFromData(orders: AdminOrder[], users: UserResponse[]): any {
    const totalRevenue = orders.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount ?? 0), 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => String(o.payment ?? "").toUpperCase().includes("PAID")).length;
    const overallConversion = totalOrders > 0 ? Number(((paidOrders / totalOrders) * 100).toFixed(2)) : 0;
    const avgOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;
    const uniqueCustomers = new Set(orders.map(o => String((o as any).customer ?? o.userId ?? o.id ?? ""))).size;
    return {
        totalRevenue,
        totalOrders,
        overallConversion,
        avgOrderValue,
        totalCustomers: users.length || uniqueCustomers,
    };
}

// ─── Public analytics functions ──────────────────────────────────────────────

export async function getAnalyticsRevenue(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        return buildRevenueFallback(filters);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_REVENUE + qs, { method: "GET" });
        const data = res?.data ?? res;
        if (isDenseAnalyticsPayload(data)) {
            const ageData = Array.isArray(data?.ageData) ? data.ageData : [];
            const genderData = Array.isArray(data?.genderData) ? data.genderData : [];
            if (isUsefulSeries(ageData, ["name", "value"]) && isUsefulSeries(genderData, ["name", "value"])) {
                return data;
            }
        }
    } catch (e) {
        console.warn("getAnalyticsRevenue API failed, computing from orders", e);
    }
    // Fallback: compute from orders + products
    try {
        return await buildRevenueFallback(filters);
    } catch (e2) {
        console.warn("getAnalyticsRevenue fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeRevenueFromOrders(filtered, mockProducts as any);
    }
}

export async function getAnalyticsProducts(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeProductAnalytics(mockProducts as any, filtered as any);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_PRODUCTS + qs, { method: "GET" });
        const data = res?.data ?? res;
        
        // Map native backend payload to frontend expectations
        if (data && data.productPerformanceTable) {
            return {
                topRevenueProduct: { name: data.topRevenueProduct, revenue: data.topProductRevenue },
                slowMovingProduct: { name: data.slowMovingProduct },
                totalUnits: data.totalUnitsSold ?? 0,
                avgRefundRate: data.avgRefundRate ?? 0,
                topCategory: data.topCategory ?? "—",
                lowStockCount: data.lowOutOfStock ?? 0,
                barData: Object.entries(data.top5ProductsByRevenue || {}).map(([name, revenue]) => ({ name, revenue: Number(revenue) })),
                pieData: Object.entries(data.unitsSoldByCategory || {}).map(([name, value]) => ({ name, value: Number(value) })),
                monthlyData: Object.entries(data.monthlyProductRevenueGrowth || {}).map(([month, revenue]) => ({ month, revenue: Number(revenue) })),
                processedProducts: (data.productPerformanceTable || []).map((p: any) => ({
                    id: p.product,
                    name: p.product,
                    category: p.category,
                    unitsSold: p.unitsSold,
                    revenue: p.revenue,
                    stock: p.stock,
                    refundRate: p.refundRate,
                    status: p.status
                }))
            };
        }

        if (isDenseAnalyticsPayload(data)) return data;
    } catch (e) {
        console.warn("getAnalyticsProducts API failed, computing from products/orders", e);
    }
    try {
        const [dbProducts, dbOrders] = await Promise.all([getProducts(), getAdminOrders()]);
        const finalProducts = dbProducts.length > 0 ? dbProducts : mockProducts as any;
        const finalOrders = dbOrders.length > 0 ? dbOrders : mockOrders as any;
        const filtered = filterOrdersByDate(finalOrders, filters);
        return computeProductAnalytics(finalProducts, filtered);
    } catch (e2) {
        console.warn("getAnalyticsProducts fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeProductAnalytics(mockProducts as any, filtered as any);
    }
}

export async function getAnalyticsDemographic(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeDemographicAnalytics([], filtered as any, filters);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_DEMOGRAPHIC + qs, { method: "GET" });
        const data = res?.data ?? res;
        
        // As long as the payload is an object, assume the demographic API succeeded.
        if (data && typeof data === "object" && !Array.isArray(data)) {
            const genderFills: Record<string, string> = { 
                Male: "#3b82f6", male: "#3b82f6", 
                Female: "#ec4899", female: "#ec4899", 
                Other: "#8b5cf6", other: "#8b5cf6", 
                Unknown: "#94a3b8", unknown: "#94a3b8" 
            };

            const normalizeGender = (g: string) => {
                if (!g) return "Unknown";
                const lower = g.toLowerCase();
                if (lower === "male") return "Male";
                if (lower === "female") return "Female";
                if (lower === "other") return "Other";
                return "Unknown";
            };

            const aggregatedGender: Record<string, number> = {};
            Object.entries(data.genderDistribution || {}).forEach(([name, value]) => {
                const norm = normalizeGender(name);
                aggregatedGender[norm] = (aggregatedGender[norm] || 0) + Number(value);
            });
            const genderPieData = Object.entries(aggregatedGender).map(([name, value]) => ({
                name,
                value,
                fill: genderFills[name] ?? "#94a3b8"
            }));

            const ageData = Object.entries(data.ageDistribution || {}).map(([age, count]) => ({ age, count }));
            
            const aggregatedGenderRevenue: Record<string, number> = {};
            Object.entries(data.revenueByGender || {}).forEach(([name, rev]) => {
                const norm = normalizeGender(name);
                aggregatedGenderRevenue[norm] = (aggregatedGenderRevenue[norm] || 0) + Number(rev);
            });
            const genderRevenueData = Object.entries(aggregatedGenderRevenue).map(([name, revenue]) => ({ name, revenue }));
            
            const ageRevenueData = Object.entries(data.revenueByAgeGroup || {}).map(([age, revenue]) => ({ age, revenue }));
            const topCustomers = (data.topCustomersTable || []).map((c: any) => ({
                ...c,
                name: c.customer || c.name || "Unknown",
                gender: c.gender ? normalizeGender(c.gender) : "Unknown"
            }));

            return {
                uniqueCustomers: data.totalCustomers ?? 0,
                newCust: data.newCustomers ?? 0,
                returning: data.newVsReturning?.Returning ?? 0,
                returningPct: data.returningCustomersPercentage ?? "0",
                totalRevenue: data.totalRevenue ?? 0,
                genderPieData,
                genderRevenueData,
                ageData,
                ageRevenueData,
                topCustomers
            };
        }
    } catch (e) {
        console.warn("getAnalyticsDemographic API failed, computing from users/orders", e);
    }
    try {
        const [dbUsers, dbOrders] = await Promise.all([getUsers(), getAdminOrders()]);
        const finalOrders = dbOrders.length > 0 ? dbOrders : mockOrders as any;
        const filtered = filterOrdersByDate(finalOrders, filters);
        return computeDemographicAnalytics(dbUsers, filtered, filters);
    } catch (e2) {
        console.warn("getAnalyticsDemographic fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeDemographicAnalytics([], filtered as any, filters);
    }
}

export async function getAnalyticsFunnel(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeFunnelFromOrders(filtered as any, []);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_FUNNEL + qs, { method: "GET" });
        const data = res?.data ?? res;
        if (isDenseAnalyticsPayload(data)) return data;
    } catch (e) {
        console.warn("getAnalyticsFunnel API failed, computing from orders", e);
    }
    try {
        const [dbOrders, dbUsers] = await Promise.all([getAdminOrders(), getUsers().catch(() => [])]);
        const finalOrders = dbOrders.length > 0 ? dbOrders : mockOrders as any;
        const filtered = filterOrdersByDate(finalOrders, filters);
        return computeFunnelFromOrders(filtered, dbUsers);
    } catch (e2) {
        console.warn("getAnalyticsFunnel fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeFunnelFromOrders(filtered as any, []);
    }
}

export async function getAnalyticsOrderStatus(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeOrderStatusAnalytics(filtered as any);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_ORDER_STATUS + qs, { method: "GET" });
        const data = res?.data ?? res;
        if (isDenseAnalyticsPayload(data)) return data;
    } catch (e) {
        console.warn("getAnalyticsOrderStatus API failed, computing from orders", e);
    }
    try {
        const orders = await getAdminOrders();
        const finalOrders = orders.length > 0 ? orders : mockOrders as any;
        const filtered = filterOrdersByDate(finalOrders, filters);
        return computeOrderStatusAnalytics(filtered);
    } catch (e2) {
        console.warn("getAnalyticsOrderStatus fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeOrderStatusAnalytics(filtered as any);
    }
}

export async function getAnalyticsDashboard(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeDashboardFromData(filtered as any, []);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_DASHBOARD + qs, { method: "GET" });
        const data = res?.data ?? res;
        if (data && typeof data === "object" && Object.keys(data).length > 0) return data;
    } catch (e) {
        console.warn("getAnalyticsDashboard API failed, computing from orders/users", e);
    }
    try {
        const [dbOrders, dbUsers] = await Promise.all([getAdminOrders(), getUsers().catch(() => [])]);
        const finalOrders = dbOrders.length > 0 ? dbOrders : mockOrders as any;
        const filtered = filterOrdersByDate(finalOrders, filters);
        return computeDashboardFromData(filtered, dbUsers);
    } catch (e2) {
        console.warn("getAnalyticsDashboard fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computeDashboardFromData(filtered as any, []);
    }
}

export async function getAnalyticsPaymentRefund(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computePaymentRefundAnalytics(filtered as any);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_PAYMENT_REFUND + qs, { method: "GET" });
        const data = res?.data ?? res;
        if (data && typeof data === "object" && Object.keys(data).length > 0) return data;
    } catch (e) {
        console.warn("getAnalyticsPaymentRefund API failed, computing from orders", e);
    }
    try {
        const orders = await getAdminOrders();
        const finalOrders = orders.length > 0 ? orders : mockOrders as any;
        const filtered = filterOrdersByDate(finalOrders, filters);
        return computePaymentRefundAnalytics(filtered);
    } catch (e2) {
        console.warn("getAnalyticsPaymentRefund fallback failed, using mock data", e2);
        const filtered = filterOrdersByDate(mockOrders as any, filters);
        return computePaymentRefundAnalytics(filtered as any);
    }
}

export async function getAnalyticsInventory(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        return computeInventoryAnalytics(mockProducts as any);
    }
    const qs = buildAnalyticsQueryString(filters);
    // Ensure inventory API always requests recent window when no filters provided
    const finalQs = qs && qs.length > 0 ? qs : "?days=30";
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_INVENTORY + finalQs, { method: "GET" });
        const raw = res?.data ?? res;
        if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
            // Normalize backend inventory shape to frontend shape used by InventoryReport
            const data: any = {};
            // numeric KPIs
            data.totalStock = raw.totalStockUnits ?? raw.totalStock ?? 0;
            data.outOfStock = raw.outOfStockCount ?? raw.outOfStock ?? 0;
            data.expirySoon = raw.expirySoonCount ?? raw.expirySoon ?? 0;
            data.reorderNeeded = raw.reorderNeededCount ?? raw.reorderNeeded ?? 0;

            // stock status / pie data
            const health = raw.stockHealthOverview ?? raw.stockStatusData ?? raw.stockStatus ?? {};
            if (Array.isArray(health)) {
                data.stockStatusData = health;
            } else if (health && typeof health === 'object') {
                data.stockStatusData = Object.entries(health).map(([k, v], i) => ({ name: k, value: Number(v) || 0, fill: CHART_COLORS[i % CHART_COLORS.length] }));
            } else {
                data.stockStatusData = [];
            }

            // stock vs sold
            const svs = raw.stockVsSoldTopProducts ?? raw.stockVsSold ?? raw.stockVsSoldProducts ?? {};
            if (Array.isArray(svs)) {
                data.stockVsSold = svs;
            } else if (svs && typeof svs === 'object') {
                data.stockVsSold = Object.entries(svs).map(([name, obj]: any) => ({ name, stock: Number(obj?.Stock ?? obj?.stock ?? 0), sold: Number(obj?.Sold ?? obj?.sold ?? 0) }));
            } else {
                data.stockVsSold = [];
            }

            // monthly movement
            const monthly = raw.monthlyStockMovement ?? raw.movementData ?? raw.monthlyMovement ?? {};
            if (Array.isArray(monthly)) {
                data.movementData = monthly.map((m: any) => ({ month: m.month, units: Number(m.units ?? m.value ?? 0) }));
            } else if (monthly && typeof monthly === 'object') {
                data.movementData = Object.entries(monthly).map(([month, units]) => ({ month, units: Number(units ?? 0) }));
            } else {
                data.movementData = [];
            }

            // inventory table
            const table = raw.inventoryDetailsTable ?? raw.inventoryItems ?? raw.items ?? [];
            if (Array.isArray(table)) {
                data.inventoryItems = table.map((r: any) => ({
                    name: r.product ?? r.name ?? "",
                    category: r.category ?? r.cat ?? "",
                    stock: Number(r.stock ?? r.qty ?? 0),
                    sold: Number(r.sold ?? r.unitsSold ?? 0),
                    status: r.status ?? (Number(r.stock ?? 0) <= 0 ? 'Out of Stock' : (Number(r.stock ?? 0) <= 10 ? 'Low Stock' : 'In Stock')),
                    expirySoon: Boolean(r.expiryRisk && String(r.expiryRisk).toLowerCase() !== '—' && String(r.expiryRisk).toLowerCase() !== 'ok'),
                    needsReorder: (typeof r.reorderNeeded === 'string' ? r.reorderNeeded.toLowerCase().startsWith('y') : Boolean(r.reorderNeeded)),
                }));
            } else {
                data.inventoryItems = [];
            }

            // reorder items
            data.reorderItems = raw.reorderItems ?? data.inventoryItems.filter((p: any) => p.needsReorder);

            return data;
        }
    } catch (e) {
        console.warn("getAnalyticsInventory API failed, computing from products", e);
    }
    try {
        const products = await getProducts();
        return computeInventoryAnalytics(products);
    } catch (e2) {
        console.warn("getAnalyticsInventory fallback failed, using mock data", e2);
        return computeInventoryAnalytics(mockProducts as any);
    }
}

export async function getAnalyticsBanners(filters: any = null): Promise<any> {
    if (!hasAdminSession()) {
        return computeBannerAnalyticsFromList(INITIAL_BANNERS as any);
    }
    const qs = buildAnalyticsQueryString(filters);
    try {
        const res = await safeFetch(API_ENDPOINTS.GET_ANALYTICS_BANNERS + qs, { method: "GET" });
        const data = res?.data ?? res;
        if (isDenseAnalyticsPayload(data)) return data;
    } catch (e) {
        console.warn("getAnalyticsBanners API failed, falling back to banner list", e);
    }
    try {
        const banners = await getBanners();
        return computeBannerAnalyticsFromList(banners);
    } catch (e2) {
        console.warn("getAnalyticsBanners fallback failed, using mock banners", e2);
        return computeBannerAnalyticsFromList(INITIAL_BANNERS as any);
    }
}

