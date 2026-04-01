// ...existing code...
// API endpoint configuration
import { API_ENDPOINTS, BASE_URL } from "./apiConfig";
import type { Product, Variant } from "@/data/mockData";
import { Banner } from "@/components/banners/bannerTypes";

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

export interface SupportTicketReply {
    id: string;
    ticket_id: string;
    sender: "Customer" | "Admin";
    sender_name: string;
    message: string;
    created_at: string;
}

export interface AdminSupportTicket {
    id: string;
    ticket_id: string;
    order_id: string;
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
    const sender: "Customer" | "Admin" = senderRaw.includes("admin") || senderRaw.includes("support") ? "Admin" : "Customer";
    return {
        id: String(item?.id ?? `${ticketId}-reply-${Math.random().toString(36).slice(2, 10)}`),
        ticket_id: ticketId,
        sender,
        sender_name: String(item?.senderName ?? item?.sender_name ?? item?.authorName ?? item?.author_name ?? (sender === "Admin" ? "Admin" : "Customer")),
        message: String(item?.message ?? item?.text ?? item?.body ?? ""),
        created_at: String(item?.createdAt ?? item?.created_at ?? new Date().toISOString()),
    };
}

function mapSupportTicket(query: any): AdminSupportTicket {
    const rawId = query?.id ?? query?.queryId ?? query?.query_id ?? query?.ticketId ?? query?.ticket_id ?? "";
    const id = String(rawId || Math.random().toString(36).slice(2, 10));
    const ticketId = String(query?.ticketId ?? query?.ticket_id ?? query?.queryCode ?? query?.query_code ?? `QRY-${id}`);
    const customer = query?.customer ?? query?.user ?? query?.customerDetails ?? query?.customer_details ?? {};
    const composedCustomerName = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");
    const customerName =
        query?.customerName ??
        query?.customer_name ??
        customer?.name ??
        customer?.fullName ??
        customer?.full_name ??
        (composedCustomerName || undefined) ??
        "Unknown Customer";

    const rawReplies =
        Array.isArray(query?.replies) ? query.replies :
            Array.isArray(query?.messages) ? query.messages :
                Array.isArray(query?.conversation) ? query.conversation :
                    Array.isArray(query?.comments) ? query.comments : [];

    const replies = rawReplies.map((item: any) => mapSupportReply(item, ticketId));

    const subject = String(
        query?.subject ??
        query?.title ??
        query?.queryType ??
        query?.query_type ??
        query?.type ??
        "Customer Query"
    );

    return {
        id,
        ticket_id: ticketId,
        order_id: String(query?.orderId ?? query?.order_id ?? query?.orderCode ?? query?.order_code ?? "N/A"),
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
];

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
        if (res.status === 401) {
            localStorage.removeItem("adminToken");
            window.location.href = "/";
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

export async function createCategory(data: any) {
    return safeFetch(API_ENDPOINTS.CREATE_CATEGORY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function updateCategory(id: number | string, data: any) {
    return safeFetch(API_ENDPOINTS.UPDATE_CATEGORY(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
