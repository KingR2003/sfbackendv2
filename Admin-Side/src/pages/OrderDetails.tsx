import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChevronLeft, Package, User, MapPin, Calendar, CreditCard, CheckCircle2, Clock, Truck, ChevronDown, Loader2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getAdminOrders, getOrderItemsByOrderId, getProducts, getUsers, updateAdminOrderStatus, type AdminOrder, type AdminOrderStatus, type UserResponse } from "@/lib/api";

const statusConfig: Record<string, { variant: "green" | "red" | "yellow" | "blue" | "gray" }> = {
    PROCESSING: { variant: "blue" },
    PACKED: { variant: "blue" },
    ON_THE_WAY: { variant: "yellow" },
    DELIVERED: { variant: "green" },
    CANCELLED: { variant: "red" },
};

const allStatuses: AdminOrderStatus[] = ["PROCESSING", "PACKED", "ON_THE_WAY", "DELIVERED", "CANCELLED"];

const statusRank: Record<AdminOrderStatus, number> = {
    PROCESSING: 0,
    PACKED: 1,
    ON_THE_WAY: 2,
    DELIVERED: 3,
    CANCELLED: 4,
};

function enrichOrderWithCatalog(order: AdminOrder, products: any[]): AdminOrder {
    const resolvedItems = order.items.map((item) => {
        const productId = Number(item.productId);
        const variantId = Number(item.variantId);
        const product = Number.isFinite(productId)
            ? products.find((entry: any) => Number(entry?.id) === productId)
            : undefined;

        const variant = Array.isArray(product?.variants)
            ? product.variants.find((entry: any) => Number(entry?.id) === variantId) ?? product.variants[0]
            : undefined;

        const productName = (!item.productName || item.productName === "Unknown Product")
            ? (product?.name || item.productName)
            : item.productName;

        const variantName = (!item.variantName || item.variantName === "Standard")
            ? (variant?.variant_name || variant?.variantName || variant?.name || item.variantName)
            : item.variantName;

        const image = item.image || variant?.image || product?.image;
        const price = item.price || variant?.price || 0;

        return {
            ...item,
            productName: productName || "Unknown Product",
            variantName: variantName || "Standard",
            image,
            price,
        };
    });

    return {
        ...order,
        items: resolvedItems,
    };
}

function enrichOrderWithCustomer(order: AdminOrder, users: UserResponse[]): AdminOrder {
    const matchedUser = users.find((user) => Number(user.id) === Number(order.userId));
    if (!matchedUser) return order;

    const normalizedCustomer = order.customer && order.customer !== "Unknown Customer" ? order.customer : matchedUser.name;
    const normalizedEmail = order.customerEmail || matchedUser.email;
    const normalizedPhone = order.customerPhone || matchedUser.mobile;

    return {
        ...order,
        customer: normalizedCustomer || order.customer,
        customerEmail: normalizedEmail,
        customerPhone: normalizedPhone,
    };
}

const OrderDetails = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [order, setOrder] = useState<AdminOrder | null>(null);
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
    const [currentStatus, setCurrentStatus] = useState<string>("PROCESSING");

    useEffect(() => {
        const fetchOrder = async () => {
            setIsLoading(true);
            try {
                const [orders, products, users] = await Promise.all([
                    getAdminOrders(),
                    getProducts().catch(() => []),
                    getUsers().catch(() => []),
                ]);
                setCatalogProducts(products);
                const found = orders.find((entry) => String(entry.id) === String(orderId));
                if (found) {
                    let normalizedOrder = found;
                    if (!Array.isArray(found.items) || found.items.length === 0) {
                        const fallbackItems = await getOrderItemsByOrderId(found.id);
                        if (fallbackItems.length > 0) {
                            normalizedOrder = { ...found, items: fallbackItems };
                        }
                    }

                    const withCatalog = enrichOrderWithCatalog(normalizedOrder, products);
                    const withCustomer = enrichOrderWithCustomer(withCatalog, users);
                    setOrder(withCustomer);
                    setCurrentStatus(found.status || "PROCESSING");
                } else {
                    setOrder(null);
                }
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error?.message || "Failed to load order details",
                    variant: "destructive",
                });
                setOrder(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId, toast]);

    const timeline = useMemo(() => {
        if (!order) return [];

        const baseDate = order.date ? new Date(order.date) : new Date();
        const formatDate = (d: Date) => d.toISOString().split("T")[0];

        const packedDate = new Date(baseDate);
        packedDate.setDate(baseDate.getDate() + 1);

        const onWayDate = new Date(baseDate);
        onWayDate.setDate(baseDate.getDate() + 2);

        const deliveredDate = new Date(baseDate);
        deliveredDate.setDate(baseDate.getDate() + 3);

        const current = (currentStatus as AdminOrderStatus) in statusRank ? statusRank[currentStatus as AdminOrderStatus] : 0;
        const cancelled = currentStatus === "CANCELLED";

        return [
            {
                status: "Processing",
                date: order.date || formatDate(baseDate),
                completed: cancelled ? false : current >= statusRank.PROCESSING,
                icon: CheckCircle2,
            },
            {
                status: "Packed",
                date: formatDate(packedDate),
                completed: cancelled ? false : current >= statusRank.PACKED,
                icon: Package,
            },
            {
                status: "On The Way",
                date: formatDate(onWayDate),
                completed: cancelled ? false : current >= statusRank.ON_THE_WAY,
                icon: Truck,
            },
            {
                status: "Delivered",
                date: formatDate(deliveredDate),
                completed: !cancelled && current >= statusRank.DELIVERED,
                icon: CheckCircle2,
            },
        ];
    }, [currentStatus, order]);

    const handleStatusUpdate = async (status: AdminOrderStatus) => {
        if (!order || !allStatuses.includes(status)) return;
        if (status === currentStatus) return;

        setIsUpdating(true);
        try {
            const updated = await updateAdminOrderStatus(order.id, status);
            setCurrentStatus(status);
            if (updated && typeof updated === "object" && "status" in updated) {
                const updatedOrder = enrichOrderWithCatalog(updated as AdminOrder, catalogProducts);
                setOrder({
                    ...updatedOrder,
                    id: updatedOrder.id || order.id,
                    items: updatedOrder.items?.length > 0 ? updatedOrder.items : order.items,
                    customer: updatedOrder.customer || order.customer,
                    customerEmail: updatedOrder.customerEmail || order.customerEmail,
                    customerPhone: updatedOrder.customerPhone || order.customerPhone,
                });
            }
            toast({
                title: "Status updated",
                description: `Order ${order.id} moved to ${status.replace(/_/g, " ")}.`,
            });
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error?.message || "Unable to update order status",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading order details...
                </div>
            </DashboardLayout>
        );
    }

    if (!order) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
                    <Link to="/orders" className="text-primary hover:underline">Back to Orders</Link>
                </div>
            </DashboardLayout>
        );
    }

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalAmount = order.totalAmount || subtotal;
    const discountAmount = order.discountAmount || 0;
    const finalAmount = order.finalAmount ?? Math.max(0, totalAmount - discountAmount);
    const paymentVariant =
        order.payment.toLowerCase() === "paid" ? "green" : order.payment.toLowerCase() === "pending" ? "yellow" : "red";

    return (
        <DashboardLayout>
            <div className="mb-6">
                <Link to="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Orders
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-foreground">Order #{order.id}</h1>
                            <StatusBadge status={currentStatus.replace(/_/g, " ")} variant={statusConfig[currentStatus]?.variant || "gray"} />
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" /> Placed on {order.date || "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4" /> Order Items
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-muted-foreground border-b border-border/50">
                                        <th className="p-4 font-medium">Product</th>
                                        <th className="p-4 font-medium text-right">Price</th>
                                        <th className="p-4 font-medium text-center">Quantity</th>
                                        <th className="p-4 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-muted-foreground">No item details available.</td>
                                        </tr>
                                    )}
                                    {order.items.map((item, idx) => (
                                        <tr key={item.id ?? idx} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-muted" />}
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.productName}</p>
                                                        <p className="text-xs text-muted-foreground">{item.variantName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">Rs.{item.price}</td>
                                            <td className="p-4 text-center">{item.quantity}</td>
                                            <td className="p-4 text-right font-medium">Rs.{item.price * item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/20">
                                    <tr className="border-t border-border/50">
                                        <td colSpan={3} className="pt-4 px-4 pb-1 text-right text-sm font-medium text-muted-foreground">Subtotal</td>
                                        <td className="pt-4 px-4 pb-1 text-right text-sm font-semibold text-foreground">Rs.{subtotal.toLocaleString("en-IN")}</td>
                                    </tr>
                                    {discountAmount > 0 && (
                                        <tr>
                                            <td colSpan={3} className="pt-1 px-4 pb-1 text-right text-sm font-medium text-emerald-600">
                                                Discount {order.couponApplied ? <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1 font-bold">Code: {order.couponApplied}</span> : ""}
                                            </td>
                                            <td className="pt-1 px-4 pb-1 text-right text-sm font-semibold text-emerald-600">
                                                -Rs.{discountAmount.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td colSpan={3} className="pt-1 px-4 pb-4 text-right font-bold text-foreground">Total Amount</td>
                                        <td className="pt-1 px-4 pb-4 text-right font-bold text-foreground text-xl">Rs.{finalAmount.toLocaleString("en-IN")}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 mt-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-6 text-foreground">
                            <Clock className="w-4 h-4" /> Order Timeline
                        </h3>
                        <div className="relative flex items-start justify-between w-full mt-4 mb-2 pb-6">
                            <div className="absolute top-3 left-4 right-4 h-px bg-border/60" />

                            {timeline.map((step, idx) => (
                                <div key={idx} className="relative flex flex-col items-center flex-1 text-center">
                                    <div className={cn(
                                        "relative w-6 h-6 rounded-full flex items-center justify-center bg-card border-2 z-10 mb-2",
                                        step.completed ? "border-primary bg-primary text-primary-foreground shadow-glow-sm" : "border-border bg-muted/30 text-muted-foreground"
                                    )}>
                                        {step.completed ? <step.icon className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                                    </div>
                                    <div className="px-2">
                                        <p className={cn("text-sm font-bold", currentStatus.replace(/_/g, " ").toLowerCase() === step.status.toLowerCase() ? "text-primary" : "text-foreground")}>
                                            {step.status}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap mt-0.5">{step.completed ? step.date : "Pending"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <User className="w-4 h-4" /> Customer Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Name</p>
                                <p className="font-medium">{order.customer}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Contact</p>
                                <p className="text-sm">{order.customerPhone || "Not available"}</p>
                                <p className="text-sm text-primary break-all">{order.customerEmail || "Not available"}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4" /> Shipping Address
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground mb-4">{order.shippingAddress}</p>

                        <div className="pt-4 border-t border-border/50">
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Update Order Status</label>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-sm font-medium text-foreground outline-none hover:bg-muted/60 transition-all group" disabled={isUpdating}>
                                        <div className="flex items-center gap-2.5">
                                            <StatusBadge status={currentStatus.replace(/_/g, " ")} variant={statusConfig[currentStatus]?.variant || "gray"} />
                                        </div>
                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[calc(var(--radix-dropdown-menu-trigger-width)-2px)] p-1.5 rounded-2xl shadow-elevated border-border/50 backdrop-blur-xl">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">Change Status to</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    {allStatuses.map(status => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => handleStatusUpdate(status)}
                                            className={cn(
                                                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer transition-colors mb-0.5 last:mb-0",
                                                currentStatus === status ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                status === "DELIVERED" ? "bg-green-500" :
                                                    status === "CANCELLED" ? "bg-red-500" :
                                                        status === "ON_THE_WAY" ? "bg-blue-400" :
                                                            status === "PACKED" ? "bg-indigo-500" : "bg-amber-500"
                                            )} />
                                            <span className="text-sm font-semibold">{status.replace(/_/g, " ")}</span>
                                            {currentStatus === status && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <CreditCard className="w-4 h-4" /> Payment Status
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <StatusBadge status={order.payment} variant={paymentVariant as "green" | "yellow" | "red"} />
                        </div>
                    </GlassCard>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OrderDetails;
