export interface Variant {
    id: number;
    variant_name: string;
    sku: string;
    mrp: number;
    price: number;
    discount: number;
    stock_quantity: number;
    sold: number;
    availability_status: string;
    is_active: boolean;
    image: string;
    images: string[];
}

export interface Product {
    id: number;
    name: string;
    image: string;
    images: string[];
    description: string;
    category: string;
    category_id?: number;
    is_active: boolean;
    sold: number;
    created_at: string;
    variants: Variant[];
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    image: string;
    is_active?: boolean;
    created_at?: string;
}

export const categories: Category[] = [
    { id: 1, name: "Sweeteners", description: "Natural sweeteners including honey, jaggery, and sugar alternatives", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2025-12-10" },
    { id: 2, name: "Oils & Fats", description: "Cold-pressed oils and healthy cooking fats", image: "https://images.unsplash.com/photo-1520050735087-1ed65d9dc3de?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2025-12-11" },
    { id: 3, name: "Spreads", description: "Nut butters, jams, and healthy spreads", image: "https://images.unsplash.com/photo-1577745738870-0f2c4e207d57?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2025-12-12" },
    { id: 4, name: "Spices", description: "Organic spices and masala blends", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2026-01-05" },
    { id: 5, name: "Grains & Seeds", description: "Millets, quinoa, chia seeds and more", image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2026-01-10" },
    { id: 6, name: "Beverages", description: "Herbal teas, matcha, and health drinks", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=200", is_active: false, created_at: "2026-01-15" },
    { id: 7, name: "Health Foods", description: "Superfoods and health supplements", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2026-01-20" },
    { id: 8, name: "Dairy", description: "Fresh dairy products and alternatives", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=200", is_active: true, created_at: "2026-02-01" },
];

export const mockProducts: Product[] = [
    {
        id: 1,
        name: "Honey",
        image: "",
        images: [],
        description: "Pure, unprocessed wildflower honey sourced from organic farms",
        category: "Sweeteners",
        is_active: true,
        sold: 540,
        created_at: "2025-12-10",
        variants: [
            {
                id: 1, variant_name: "250g Jar", sku: "HON-250", mrp: 450, price: 399, discount: 11,
                stock_quantity: 120, sold: 210, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
            {
                id: 2, variant_name: "500g Jar", sku: "HON-500", mrp: 850, price: 749, discount: 12,
                stock_quantity: 80, sold: 185, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
            {
                id: 3, variant_name: "1kg Jar", sku: "HON-1000", mrp: 1600, price: 1399, discount: 13,
                stock_quantity: 40, sold: 145, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
        ],
    },
    {
        id: 2,
        name: "Ghee",
        image: "",
        images: [],
        description: "Traditionally churned A2 cow ghee from grass-fed cows",
        category: "Oils & Fats",
        is_active: true,
        sold: 420,
        created_at: "2025-12-20",
        variants: [
            {
                id: 4, variant_name: "250ml Jar", sku: "GHE-250", mrp: 380, price: 340, discount: 11,
                stock_quantity: 95, sold: 160, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
            {
                id: 5, variant_name: "500ml Jar", sku: "GHE-500", mrp: 720, price: 649, discount: 10,
                stock_quantity: 60, sold: 175, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
            {
                id: 6, variant_name: "1L Jar", sku: "GHE-1000", mrp: 1380, price: 1199, discount: 13,
                stock_quantity: 25, sold: 85, availability_status: "Low Stock", is_active: true,
                image: "", images: [],
            },
        ],
    },
    {
        id: 3,
        name: "Chikki",
        image: "",
        images: [],
        description: "Traditional jaggery and nut brittle made with no preservatives",
        category: "Sweeteners",
        is_active: true,
        sold: 730,
        created_at: "2026-01-05",
        variants: [
            {
                id: 7, variant_name: "Peanut Chikki 200g", sku: "CHK-PNT-200", mrp: 120, price: 99, discount: 18,
                stock_quantity: 200, sold: 320, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
            {
                id: 8, variant_name: "Sesame Chikki 200g", sku: "CHK-SES-200", mrp: 110, price: 89, discount: 19,
                stock_quantity: 150, sold: 245, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
            {
                id: 9, variant_name: "Mixed Nut Chikki 300g", sku: "CHK-MIX-300", mrp: 180, price: 149, discount: 17,
                stock_quantity: 80, sold: 165, availability_status: "In Stock", is_active: true,
                image: "", images: [],
            },
        ],
    },
];

export interface OrderItem {
    productId: number;
    variantId: number;
    quantity: number;
    price: number;
}


export interface Order {
    id: string;
    customer: string;
    customerDemographics: {
        age: number;
        gender: 'Male' | 'Female' | 'Other';
        location: 'North' | 'South' | 'East' | 'West' | 'Central';
    };
    amount: string; // Keep as string for display, but Analytics needs number
    totalAmount: number; // Added for easy analytics math
    payment: "Paid" | "Pending" | "Refunded" | "Failed";
    paymentMethod: "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "COD";
    status: "CREATED" | "PAID" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
    platform: "Web Application" | "Mobile Application";
    date: string; // ISO string
    items: OrderItem[];
    shippingAddress: string;
}

// Generate 200 robust mock orders for analytics
const generateMockOrders = (): Order[] => {
    const orders: Order[] = [];
    const names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anita", "Karan", "Nisha", "Ravi", "Meera", "Suresh", "Divya"];
    const surnames = ["Sharma", "Patel", "Kumar", "Reddy", "Singh", "Desai", "Mehta", "Gupta", "Jain", "Nair"];
    const locations: ('North' | 'South' | 'East' | 'West' | 'Central')[] = ['North', 'South', 'East', 'West', 'Central'];
    const statuses: Order['status'][] = ["CREATED", "PAID", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
    const paymentMethods: Order['paymentMethod'][] = ["UPI", "Credit Card", "Debit Card", "Net Banking", "COD"];

    const today = new Date();

    for (let i = 1; i <= 200; i++) {
        // Randomize dates over the last 6 months
        const orderDate = new Date(today.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);

        // Randomize items
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items: OrderItem[] = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
            const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;

            items.push({
                productId: product.id,
                variantId: variant.id,
                quantity,
                price: variant.price
            });
            totalAmount += variant.price * quantity;
        }

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        let payment: Order['payment'] = "Paid";
        if (status === "CREATED") payment = "Pending";
        if (status === "CANCELLED") payment = Math.random() > 0.5 ? "Refunded" : "Failed";

        orders.push({
            id: `ORD-${3000 + i}`,
            customer: `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`,
            customerDemographics: {
                age: Math.floor(Math.random() * 50) + 18, // 18 to 67
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                location: locations[Math.floor(Math.random() * locations.length)],
            },
            amount: `₹${totalAmount.toLocaleString()}`,
            totalAmount,
            payment,
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            status,
            platform: Math.random() > 0.6 ? "Mobile Application" : "Web Application",
            date: orderDate.toISOString().split('T')[0],
            shippingAddress: "Mock Address, India",
            items
        });
    }

    // Sort by date descending
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockOrders: Order[] = generateMockOrders();

// ─── Manage / User Permissions ────────────────────────────────────────────────

export type PermissionRole = "Admin" | "Manager" | "Staff" | "Viewer";

export interface ModulePermission {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
}

export interface UserPermission {
    id: number;
    name: string;
    email: string;
    avatar: string;
    role: PermissionRole;
    permissions: Record<string, ModulePermission>;
}

const defaultAdmin: Record<string, ModulePermission> = {
    Dashboard: { view: true, create: true, update: true, delete: true },
    Categories: { view: true, create: true, update: true, delete: true },
    Products: { view: true, create: true, update: true, delete: true },
    Orders: { view: true, create: true, update: true, delete: true },
    Coupons: { view: true, create: true, update: true, delete: true },
    Payments: { view: true, create: true, update: true, delete: true },
    Members: { view: true, create: true, update: true, delete: true },
    Users: { view: true, create: true, update: true, delete: true },
    Analytics: { view: true, create: false, update: false, delete: false },
};

const defaultManager: Record<string, ModulePermission> = {
    Dashboard: { view: true, create: false, update: false, delete: false },
    Categories: { view: true, create: true, update: true, delete: false },
    Products: { view: true, create: true, update: true, delete: false },
    Orders: { view: true, create: true, update: true, delete: false },
    Coupons: { view: true, create: true, update: true, delete: false },
    Payments: { view: true, create: false, update: false, delete: false },
    Members: { view: true, create: false, update: true, delete: false },
    Users: { view: true, create: false, update: false, delete: false },
    Analytics: { view: true, create: false, update: false, delete: false },
};

const defaultStaff: Record<string, ModulePermission> = {
    Dashboard: { view: true, create: false, update: false, delete: false },
    Categories: { view: true, create: false, update: false, delete: false },
    Products: { view: true, create: false, update: true, delete: false },
    Orders: { view: true, create: false, update: true, delete: false },
    Coupons: { view: true, create: false, update: false, delete: false },
    Payments: { view: true, create: false, update: false, delete: false },
    Members: { view: true, create: false, update: false, delete: false },
    Users: { view: false, create: false, update: false, delete: false },
    Analytics: { view: false, create: false, update: false, delete: false },
};

const defaultViewer: Record<string, ModulePermission> = {
    Dashboard: { view: true, create: false, update: false, delete: false },
    Categories: { view: true, create: false, update: false, delete: false },
    Products: { view: true, create: false, update: false, delete: false },
    Orders: { view: true, create: false, update: false, delete: false },
    Coupons: { view: true, create: false, update: false, delete: false },
    Payments: { view: true, create: false, update: false, delete: false },
    Members: { view: false, create: false, update: false, delete: false },
    Users: { view: false, create: false, update: false, delete: false },
    Analytics: { view: true, create: false, update: false, delete: false },
};

export const mockUserPermissions: UserPermission[] = [
    { id: 1, name: "Arjun Sharma", email: "arjun.sharma@svasthya.in", avatar: "AS", role: "Admin", permissions: { ...defaultAdmin } },
    { id: 2, name: "Priya Patel", email: "priya.patel@svasthya.in", avatar: "PP", role: "Manager", permissions: { ...defaultManager } },
    { id: 3, name: "Rahul Kumar", email: "rahul.kumar@svasthya.in", avatar: "RK", role: "Staff", permissions: { ...defaultStaff } },
    { id: 4, name: "Sneha Reddy", email: "sneha.reddy@svasthya.in", avatar: "SR", role: "Viewer", permissions: { ...defaultViewer } },
    { id: 5, name: "Vikram Singh", email: "vikram.singh@svasthya.in", avatar: "VS", role: "Manager", permissions: { ...defaultManager } },
    { id: 6, name: "Anita Desai", email: "anita.desai@svasthya.in", avatar: "AD", role: "Staff", permissions: { ...defaultStaff } },
    { id: 7, name: "Karan Mehta", email: "karan.mehta@svasthya.in", avatar: "KM", role: "Viewer", permissions: { ...defaultViewer } },
    { id: 8, name: "Nisha Gupta", email: "nisha.gupta@svasthya.in", avatar: "NG", role: "Admin", permissions: { ...defaultAdmin } },
];

// ─── Support Center ────────────────────────────────────────────────────────────

export type TicketStatus = "Open" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export interface TicketReply {
    id: string;
    ticket_id: string;
    sender: "Customer" | "Admin";
    sender_name: string;
    message: string;
    created_at: string;
}

export interface SupportTicket {
    id: string;
    ticket_id: string;
    order_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    subject: string;
    message: string;
    status: TicketStatus;
    priority: TicketPriority;
    created_at: string;
    updated_at: string;
    replies: TicketReply[];
}

export const mockSupportTickets: SupportTicket[] = [
    {
        id: "1", ticket_id: "TKT-1001", order_id: "SV-659435",
        customer_name: "Rahul Sharma", customer_email: "rahul.sharma@gmail.com", customer_phone: "+91 9876543210",
        subject: "Order arrived damaged",
        message: "My order arrived with a cracked jar. The almond butter is completely spilled inside the box. This is unacceptable. Please arrange a replacement immediately.",
        status: "Open", priority: "High",
        created_at: "2026-03-10T09:15:00Z", updated_at: "2026-03-10T09:15:00Z",
        replies: [
            { id: "r1", ticket_id: "TKT-1001", sender: "Customer", sender_name: "Rahul Sharma", message: "My order arrived with a cracked jar. The almond butter is completely spilled inside the box. This is unacceptable. Please arrange a replacement immediately.", created_at: "2026-03-10T09:15:00Z" },
        ],
    },
    {
        id: "2", ticket_id: "TKT-1002", order_id: "SV-659410",
        customer_name: "Priya Mehta", customer_email: "priya.mehta@gmail.com", customer_phone: "+91 9812345678",
        subject: "Wrong item delivered",
        message: "I ordered cold-pressed sesame oil (500ml) but received coconut oil instead. Please send the correct product.",
        status: "In Progress", priority: "High",
        created_at: "2026-03-09T11:30:00Z", updated_at: "2026-03-09T15:00:00Z",
        replies: [
            { id: "r2", ticket_id: "TKT-1002", sender: "Customer", sender_name: "Priya Mehta", message: "I ordered cold-pressed sesame oil (500ml) but received coconut oil instead. Please send the correct product.", created_at: "2026-03-09T11:30:00Z" },
            { id: "r3", ticket_id: "TKT-1002", sender: "Admin", sender_name: "Support Team", message: "Dear Priya, we sincerely apologise for the mix-up. We have raised a re-shipment request for the correct item. It will be dispatched within 24 hours and you can keep the coconut oil as a courtesy.", created_at: "2026-03-09T15:00:00Z" },
        ],
    },
    {
        id: "3", ticket_id: "TKT-1003", order_id: "SV-659388",
        customer_name: "Arjun Verma", customer_email: "arjun.v@outlook.com", customer_phone: "+91 9001234567",
        subject: "Delivery not received after 10 days",
        message: "My order was placed 10 days ago and the tracking shows it is still in transit. I have not received any update from the courier.",
        status: "In Progress", priority: "Urgent",
        created_at: "2026-03-08T08:45:00Z", updated_at: "2026-03-09T10:00:00Z",
        replies: [
            { id: "r4", ticket_id: "TKT-1003", sender: "Customer", sender_name: "Arjun Verma", message: "My order was placed 10 days ago and the tracking shows it is still in transit. I have not received any update from the courier.", created_at: "2026-03-08T08:45:00Z" },
            { id: "r5", ticket_id: "TKT-1003", sender: "Admin", sender_name: "Admin", message: "Hi Arjun, we have escalated this with the courier partner and raised a complaint. We will have an update for you within 48 hours. We apologise for the inconvenience.", created_at: "2026-03-09T10:00:00Z" },
        ],
    },
    {
        id: "4", ticket_id: "TKT-1004", order_id: "SV-659370",
        customer_name: "Sneha Kapoor", customer_email: "sneha.kapoor@yahoo.com", customer_phone: "+91 9988776655",
        subject: "Requesting refund for cancelled order",
        message: "I cancelled my order two days ago but the refund has not been credited yet. My order total was ₹1,240. Please process this urgently.",
        status: "Waiting for Customer", priority: "Medium",
        created_at: "2026-03-07T13:20:00Z", updated_at: "2026-03-08T11:00:00Z",
        replies: [
            { id: "r6", ticket_id: "TKT-1004", sender: "Customer", sender_name: "Sneha Kapoor", message: "I cancelled my order two days ago but the refund has not been credited yet. My order total was ₹1,240. Please process this urgently.", created_at: "2026-03-07T13:20:00Z" },
            { id: "r7", ticket_id: "TKT-1004", sender: "Admin", sender_name: "Finance Team", message: "Hi Sneha, the refund of ₹1,240 has been initiated and will reflect in your account within 5–7 business days depending on your bank. Could you confirm the payment method you used?", created_at: "2026-03-08T11:00:00Z" },
        ],
    },
    {
        id: "5", ticket_id: "TKT-1005", order_id: "SV-659355",
        customer_name: "Vikram Singh", customer_email: "vikram.singh@svasthya.in", customer_phone: "+91 9123456780",
        subject: "Product has unusual smell",
        message: "The turmeric powder I received has a very unusual and strong chemical smell. Is it safe to use? I am concerned about product quality.",
        status: "Resolved", priority: "Medium",
        created_at: "2026-03-06T07:10:00Z", updated_at: "2026-03-07T14:00:00Z",
        replies: [
            { id: "r8", ticket_id: "TKT-1005", sender: "Customer", sender_name: "Vikram Singh", message: "The turmeric powder I received has a very unusual and strong chemical smell. Is it safe to use? I am concerned about product quality.", created_at: "2026-03-06T07:10:00Z" },
            { id: "r9", ticket_id: "TKT-1005", sender: "Admin", sender_name: "Quality Team", message: "Hi Vikram, thank you for flagging this. We have retrieved the batch details from your order. This occasional earthy scent is natural with high-curcumin organic batches. However, as a precaution we are sending a replacement batch free of charge.", created_at: "2026-03-06T16:00:00Z" },
            { id: "r10", ticket_id: "TKT-1005", sender: "Customer", sender_name: "Vikram Singh", message: "Thank you so much! The replacement arrived and it smells perfectly fine. I really appreciate the quick response.", created_at: "2026-03-07T14:00:00Z" },
        ],
    },
    {
        id: "6", ticket_id: "TKT-1006", order_id: "SV-659340",
        customer_name: "Meera Nair", customer_email: "meera.nair@gmail.com", customer_phone: "+91 9456781230",
        subject: "Promo code not working at checkout",
        message: "I have a promo code SAVE15 that I received via email but it shows 'Invalid Code' at checkout. Please help.",
        status: "Resolved", priority: "Low",
        created_at: "2026-03-05T16:00:00Z", updated_at: "2026-03-06T10:00:00Z",
        replies: [
            { id: "r11", ticket_id: "TKT-1006", sender: "Customer", sender_name: "Meera Nair", message: "I have a promo code SAVE15 that I received via email but it shows 'Invalid Code' at checkout. Please help.", created_at: "2026-03-05T16:00:00Z" },
            { id: "r12", ticket_id: "TKT-1006", sender: "Admin", sender_name: "Admin", message: "Hi Meera, we have checked and found the code SAVE15 expired on 4 March. As a goodwill gesture we have issued you a new code MEERA10 which gives you 10% off with no expiry until end of March. Apologies for the confusion!", created_at: "2026-03-06T10:00:00Z" },
        ],
    },
    {
        id: "7", ticket_id: "TKT-1007", order_id: "SV-659320",
        customer_name: "Ankit Gupta", customer_email: "ankit.g@hotmail.com", customer_phone: "+91 9321456780",
        subject: "App crashing after update",
        message: "Since the latest app update my order history is not loading and the app crashes whenever I try to open a past order. Using Android 13.",
        status: "In Progress", priority: "High",
        created_at: "2026-03-04T10:45:00Z", updated_at: "2026-03-05T09:00:00Z",
        replies: [
            { id: "r13", ticket_id: "TKT-1007", sender: "Customer", sender_name: "Ankit Gupta", message: "Since the latest app update my order history is not loading and the app crashes whenever I try to open a past order. Using Android 13.", created_at: "2026-03-04T10:45:00Z" },
            { id: "r14", ticket_id: "TKT-1007", sender: "Admin", sender_name: "Tech Support", message: "Hi Ankit, thank you for the detailed report. Our engineering team has identified this issue on Android 13 and is working on a patch. Expected release: 7 March. In the meantime please use our website to view order history. Sorry for the inconvenience.", created_at: "2026-03-05T09:00:00Z" },
        ],
    },
    {
        id: "8", ticket_id: "TKT-1008", order_id: "SV-659300",
        customer_name: "Divya Reddy", customer_email: "divya.reddy@gmail.com", customer_phone: "+91 9678901234",
        subject: "Missing item from order",
        message: "I ordered 3 items but only 2 were in the delivery. The missing item is Organic Raw Honey 500g. The packing slip shows all 3 items but only 2 were packed.",
        status: "Open", priority: "High",
        created_at: "2026-03-03T14:30:00Z", updated_at: "2026-03-03T14:30:00Z",
        replies: [
            { id: "r15", ticket_id: "TKT-1008", sender: "Customer", sender_name: "Divya Reddy", message: "I ordered 3 items but only 2 were in the delivery. The missing item is Organic Raw Honey 500g. The packing slip shows all 3 items but only 2 were packed.", created_at: "2026-03-03T14:30:00Z" },
        ],
    },
    {
        id: "9", ticket_id: "TKT-1009", order_id: "SV-659280",
        customer_name: "Karthik Iyer", customer_email: "karthik.i@gmail.com", customer_phone: "+91 9045678123",
        subject: "Request to change delivery address",
        message: "I placed an order 2 hours ago and realised I entered the wrong pin code. The correct pin code is 560001 not 560011. Please update before dispatch.",
        status: "Closed", priority: "Medium",
        created_at: "2026-03-02T09:00:00Z", updated_at: "2026-03-02T11:30:00Z",
        replies: [
            { id: "r16", ticket_id: "TKT-1009", sender: "Customer", sender_name: "Karthik Iyer", message: "I placed an order 2 hours ago and realised I entered the wrong pin code. The correct pin code is 560001 not 560011. Please update before dispatch.", created_at: "2026-03-02T09:00:00Z" },
            { id: "r17", ticket_id: "TKT-1009", sender: "Admin", sender_name: "Logistics Team", message: "Hi Karthik, we have updated the pin code to 560001 before dispatch. Your order is scheduled to ship tomorrow. You will receive a tracking link via SMS.", created_at: "2026-03-02T11:30:00Z" },
        ],
    },
    {
        id: "10", ticket_id: "TKT-1010", order_id: "SV-659260",
        customer_name: "Pooja Joshi", customer_email: "pooja.j@gmail.com", customer_phone: "+91 9234567801",
        subject: "Expired product received",
        message: "The ghee I received expired in January 2026. I purchased it on 1 March 2026. This is a serious health concern. I want a full refund.",
        status: "Resolved", priority: "Urgent",
        created_at: "2026-03-01T15:20:00Z", updated_at: "2026-03-03T09:00:00Z",
        replies: [
            { id: "r18", ticket_id: "TKT-1010", sender: "Customer", sender_name: "Pooja Joshi", message: "The ghee I received expired in January 2026. I purchased it on 1 March 2026. This is a serious health concern. I want a full refund.", created_at: "2026-03-01T15:20:00Z" },
            { id: "r19", ticket_id: "TKT-1010", sender: "Admin", sender_name: "Quality Team", message: "Dear Pooja, we sincerely apologise. This should never have happened. We have immediately flagged this batch for a quality audit. A full refund of ₹680 has been processed and will reach you in 3–5 days.", created_at: "2026-03-02T10:00:00Z" },
            { id: "r20", ticket_id: "TKT-1010", sender: "Admin", sender_name: "Quality Team", message: "Hi Pooja, confirming that the refund has been successfully processed. We have also added 200 loyalty points to your account as compensation. Thank you for bringing this to our attention.", created_at: "2026-03-03T09:00:00Z" },
        ],
    },
    // February tickets
    {
        id: "11", ticket_id: "TKT-1011", order_id: "SV-659100",
        customer_name: "Suresh Babu", customer_email: "suresh.b@gmail.com", customer_phone: "+91 9765432109",
        subject: "Subscription order not triggered",
        message: "My monthly subscription should have renewed on 25 Feb but no order was created and no charge was made. Please check.",
        status: "Resolved", priority: "Medium",
        created_at: "2026-02-26T11:00:00Z", updated_at: "2026-02-27T14:00:00Z",
        replies: [
            { id: "r21", ticket_id: "TKT-1011", sender: "Customer", sender_name: "Suresh Babu", message: "My monthly subscription should have renewed on 25 Feb but no order was created and no charge was made. Please check.", created_at: "2026-02-26T11:00:00Z" },
            { id: "r22", ticket_id: "TKT-1011", sender: "Admin", sender_name: "Support Team", message: "Hi Suresh, we identified a brief billing system issue on 25 Feb that affected a small number of subscriptions. Your subscription has been manually triggered and the order will be dispatched today. Apologies for the disruption.", created_at: "2026-02-27T14:00:00Z" },
        ],
    },
    {
        id: "12", ticket_id: "TKT-1012", order_id: "SV-659080",
        customer_name: "Kavya Sharma", customer_email: "kavya.s@outlook.com", customer_phone: "+91 9876012345",
        subject: "Payment deducted but order not placed",
        message: "₹860 was deducted from my account at 9:45 AM today but the app shows no order in 'My Orders'. Please verify and either confirm the order or refund.",
        status: "Resolved", priority: "Urgent",
        created_at: "2026-02-22T10:15:00Z", updated_at: "2026-02-22T16:00:00Z",
        replies: [
            { id: "r23", ticket_id: "TKT-1012", sender: "Customer", sender_name: "Kavya Sharma", message: "₹860 was deducted from my account at 9:45 AM today but the app shows no order in 'My Orders'. Please verify and either confirm the order or refund.", created_at: "2026-02-22T10:15:00Z" },
            { id: "r24", ticket_id: "TKT-1012", sender: "Admin", sender_name: "Finance Team", message: "Hi Kavya, we found the transaction in our payment gateway as a pending capture. The order was created on our backend but not synced to the app due to a timeout. We have now synced it — please check 'My Orders'. Your order ID is SV-659080.", created_at: "2026-02-22T16:00:00Z" },
        ],
    },
    {
        id: "13", ticket_id: "TKT-1013", order_id: "SV-659060",
        customer_name: "Arun Pillai", customer_email: "arun.pillai@gmail.com", customer_phone: "+91 9012345678",
        subject: "Loyalty points not credited",
        message: "I made a purchase of ₹1,500 on 15 Feb but my loyalty points still show the old balance. Points should have been added by now.",
        status: "Closed", priority: "Low",
        created_at: "2026-02-20T13:15:00Z", updated_at: "2026-02-21T10:00:00Z",
        replies: [
            { id: "r25", ticket_id: "TKT-1013", sender: "Customer", sender_name: "Arun Pillai", message: "I made a purchase of ₹1,500 on 15 Feb but my loyalty points still show the old balance. Points should have been added by now.", created_at: "2026-02-20T13:15:00Z" },
            { id: "r26", ticket_id: "TKT-1013", sender: "Admin", sender_name: "Admin", message: "Hi Arun, we have manually credited 150 points to your account for the February 15th purchase. There was a sync delay in the rewards engine which has now been fixed. Your current balance should be correct.", created_at: "2026-02-21T10:00:00Z" },
        ],
    },
    {
        id: "14", ticket_id: "TKT-1014", order_id: "SV-659040",
        customer_name: "Ritu Agarwal", customer_email: "ritu.a@yahoo.com", customer_phone: "+91 9345678012",
        subject: "GST invoice not received",
        message: "I need the GST invoice for my order for office reimbursement. The app only shows a basic receipt without GST details.",
        status: "Closed", priority: "Low",
        created_at: "2026-02-18T08:00:00Z", updated_at: "2026-02-18T15:00:00Z",
        replies: [
            { id: "r27", ticket_id: "TKT-1014", sender: "Customer", sender_name: "Ritu Agarwal", message: "I need the GST invoice for my order for office reimbursement. The app only shows a basic receipt without GST details.", created_at: "2026-02-18T08:00:00Z" },
            { id: "r28", ticket_id: "TKT-1014", sender: "Admin", sender_name: "Finance Team", message: "Dear Ritu, the GST invoice for order SV-659040 has been emailed to ritu.a@yahoo.com. Please check your inbox and spam folder. You can also download it from Orders > View Order > Download Invoice in the app.", created_at: "2026-02-18T15:00:00Z" },
        ],
    },
    {
        id: "15", ticket_id: "TKT-1015", order_id: "SV-659020",
        customer_name: "Tarun Khanna", customer_email: "tarun.k@gmail.com", customer_phone: "+91 9567801234",
        subject: "Delivery person asked for extra charges",
        message: "The delivery person asked me to pay ₹50 extra for 'handling'. I refused and he left without delivering. This behaviour is unacceptable. Please investigate.",
        status: "Resolved", priority: "High",
        created_at: "2026-02-15T14:00:00Z", updated_at: "2026-02-16T11:00:00Z",
        replies: [
            { id: "r29", ticket_id: "TKT-1015", sender: "Customer", sender_name: "Tarun Khanna", message: "The delivery person asked me to pay ₹50 extra for 'handling'. I refused and he left without delivering. This behaviour is unacceptable. Please investigate.", created_at: "2026-02-15T14:00:00Z" },
            { id: "r30", ticket_id: "TKT-1015", sender: "Admin", sender_name: "Logistics Head", message: "Dear Tarun, we take this extremely seriously. No extra charges should ever be demanded. We have reported this incident to our courier partner and a complaint has been filed. Your order has been re-dispatched with a different courier at no charge.", created_at: "2026-02-16T11:00:00Z" },
        ],
    },
    // January tickets
    {
        id: "16", ticket_id: "TKT-1016", order_id: "SV-658900",
        customer_name: "Neha Trivedi", customer_email: "neha.t@gmail.com", customer_phone: "+91 9678123450",
        subject: "Unable to apply wallet balance",
        message: "I have ₹200 in my wallet but at checkout it says 'Wallet balance unavailable'. Other payment methods work fine.",
        status: "Closed", priority: "Medium",
        created_at: "2026-01-28T10:30:00Z", updated_at: "2026-01-29T09:00:00Z",
        replies: [
            { id: "r31", ticket_id: "TKT-1016", sender: "Customer", sender_name: "Neha Trivedi", message: "I have ₹200 in my wallet but at checkout it says 'Wallet balance unavailable'. Other payment methods work fine.", created_at: "2026-01-28T10:30:00Z" },
            { id: "r32", ticket_id: "TKT-1016", sender: "Admin", sender_name: "Tech Support", message: "Hi Neha, this was caused by a session token issue with wallet authentication. We have refreshed your wallet session — please log out and log back in. The wallet balance should now be usable at checkout.", created_at: "2026-01-29T09:00:00Z" },
        ],
    },
    {
        id: "17", ticket_id: "TKT-1017", order_id: "SV-658880",
        customer_name: "Manish Dubey", customer_email: "manish.d@hotmail.com", customer_phone: "+91 9789012345",
        subject: "Order placed twice by mistake",
        message: "I accidentally placed the same order twice because the first payment did not load. Can you cancel one of the orders (SV-658880)?",
        status: "Closed", priority: "Medium",
        created_at: "2026-01-22T16:45:00Z", updated_at: "2026-01-23T10:00:00Z",
        replies: [
            { id: "r33", ticket_id: "TKT-1017", sender: "Customer", sender_name: "Manish Dubey", message: "I accidentally placed the same order twice because the first payment did not load. Can you cancel one of the orders (SV-658880)?", created_at: "2026-01-22T16:45:00Z" },
            { id: "r34", ticket_id: "TKT-1017", sender: "Admin", sender_name: "Admin", message: "Hi Manish, we have cancelled order SV-658880 as requested. The refund of ₹940 will be credited within 5–7 business days. Order SV-658882 will proceed as normal. Apologies for the checkout experience.", created_at: "2026-01-23T10:00:00Z" },
        ],
    },
    {
        id: "18", ticket_id: "TKT-1018", order_id: "SV-658860",
        customer_name: "Swati Bansal", customer_email: "swati.b@gmail.com", customer_phone: "+91 9890123456",
        subject: "Product packaging feedback",
        message: "The new packaging is very hard to open and I cut my finger trying to open the ghee jar seal. Please consider a more user-friendly design.",
        status: "Closed", priority: "Low",
        created_at: "2026-01-18T11:20:00Z", updated_at: "2026-01-19T10:30:00Z",
        replies: [
            { id: "r35", ticket_id: "TKT-1018", sender: "Customer", sender_name: "Swati Bansal", message: "The new packaging is very hard to open and I cut my finger trying to open the ghee jar seal. Please consider a more user-friendly design.", created_at: "2026-01-18T11:20:00Z" },
            { id: "r36", ticket_id: "TKT-1018", sender: "Admin", sender_name: "Product Team", message: "Dear Swati, we are very sorry to hear this. Your safety is our priority. We have escalated this feedback directly to our packaging team. This will be addressed in the next packaging revision. Thank you for the valuable feedback.", created_at: "2026-01-19T10:30:00Z" },
        ],
    },
    {
        id: "19", ticket_id: "TKT-1019", order_id: "SV-658840",
        customer_name: "Deepak Rao", customer_email: "deepak.r@gmail.com", customer_phone: "+91 9456012378",
        subject: "Referral bonus not credited",
        message: "I referred my colleague and she placed an order using my code. It has been 2 weeks and my referral bonus still has not appeared.",
        status: "Open", priority: "Low",
        created_at: "2026-01-10T09:15:00Z", updated_at: "2026-01-10T09:15:00Z",
        replies: [
            { id: "r37", ticket_id: "TKT-1019", sender: "Customer", sender_name: "Deepak Rao", message: "I referred my colleague and she placed an order using my code. It has been 2 weeks and my referral bonus still has not appeared.", created_at: "2026-01-10T09:15:00Z" },
        ],
    },
    {
        id: "20", ticket_id: "TKT-1020", order_id: "SV-658820",
        customer_name: "Anjali Mishra", customer_email: "anjali.m@yahoo.com", customer_phone: "+91 9001234578",
        subject: "Bulk order discount not applied",
        message: "I placed a bulk order of 20 units as per your website's bulk pricing offer but the cart total shows the regular price. The discount should be 15%.",
        status: "Waiting for Customer", priority: "Medium",
        created_at: "2026-01-05T15:00:00Z", updated_at: "2026-01-07T09:00:00Z",
        replies: [
            { id: "r38", ticket_id: "TKT-1020", sender: "Customer", sender_name: "Anjali Mishra", message: "I placed a bulk order of 20 units as per your website's bulk pricing offer but the cart total shows the regular price. The discount should be 15%.", created_at: "2026-01-05T15:00:00Z" },
            { id: "r39", ticket_id: "TKT-1020", sender: "Admin", sender_name: "Sales Team", message: "Hi Anjali, the bulk pricing applies from 25 units as stated in the terms. However as a goodwill gesture we are happy to manually apply a 10% discount to this order. Could you confirm you would like us to proceed with this adjustment?", created_at: "2026-01-07T09:00:00Z" },
        ],
    },
];

export interface ContactQuery {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string; // Optional, for order-related queries
  email: string;
  phone: string;
  queryType: string; // e.g. "Replacement", "Damaged", "Refund", "General"
  message: string;
  images?: string[]; // Array of image URLs/paths
  status: "Open" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
  createdAt: string;
  updatedAt: string;
}

