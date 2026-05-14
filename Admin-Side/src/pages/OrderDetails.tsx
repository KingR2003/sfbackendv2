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
            {
                status: "Cancelled",
                date: String(new Date().toISOString().split("T")[0]),
                completed: cancelled,
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
            <div className="mb-8">
                <Link to="/orders" className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-6 font-medium">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
                    BACK TO ORDERS
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Order #{order.id}</h1>
                            <StatusBadge status={currentStatus.replace(/_/g, " ")} variant={statusConfig[currentStatus]?.variant || "gray"} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm font-medium">
                            <Calendar className="w-4 h-4" /> Placed on {order.date || "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                                <Package className="w-4 h-4" /> Order Items
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wide">Product</th>
                                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wide text-right">Price</th>
                                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wide text-center">Quantity</th>
                                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wide text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">No item details available.</td>
                                        </tr>
                                    )}
                                    {order.items.map((item, idx) => (
                                        <tr key={item.id ?? idx} className="border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" />}
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{item.productName}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.variantName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-medium">₹{item.price.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-center text-slate-900 dark:text-white font-medium">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/30">
                                    <tr className="border-t border-slate-200 dark:border-slate-800">
                                        <td colSpan={3} className="px-6 pt-4 pb-2 text-right text-sm font-medium text-slate-600 dark:text-slate-400">Subtotal</td>
                                        <td className="px-6 pt-4 pb-2 text-right text-sm font-semibold text-slate-900 dark:text-white">₹{subtotal.toLocaleString("en-IN")}</td>
                                    </tr>
                                    {discountAmount > 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 pt-2 pb-2 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                Discount {order.couponApplied ? <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded ml-2 font-bold inline-block">Code: {order.couponApplied}</span> : ""}
                                            </td>
                                            <td className="px-6 pt-2 pb-2 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                -₹{discountAmount.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t border-slate-200 dark:border-slate-800">
                                        <td colSpan={3} className="px-6 pt-4 pb-4 text-right font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Total Amount</td>
                                        <td className="px-6 pt-4 pb-4 text-right font-bold text-slate-900 dark:text-white text-2xl">₹{finalAmount.toLocaleString("en-IN")}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-6 text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                            <Clock className="w-4 h-4" /> Order Timeline
                        </h3>
                        <div className="relative flex items-start justify-between w-full mt-4 mb-2 pb-6">
                            <div className="absolute top-3 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-700" />

                            {timeline.map((step, idx) => (
                                <div key={idx} className="relative flex flex-col items-center flex-1 text-center">
                                    <div className={cn(
                                        "relative w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 z-10 mb-3 transition-all",
                                        step.completed ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-md" : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                                    )}>
                                        {step.completed ? <step.icon className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
                                    </div>
                                    <div className="px-2">
                                        <p className={cn("text-xs font-bold tracking-wider", currentStatus.replace(/_/g, " ").toLowerCase() === step.status.toLowerCase() ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300")}>
                                            {step.status}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap mt-1">{step.completed ? step.date : "Pending"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                            <User className="w-4 h-4" /> Customer Details
                        </h3>
                        <div className="space-y-5">
                            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Name</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-base">{order.customer}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Contact</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{order.customerPhone || "Not available"}</p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 break-all font-medium mt-2">{order.customerEmail || "Not available"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                            <MapPin className="w-4 h-4" /> Shipping Address
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">{order.shippingAddress}</p>

                        <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 block uppercase tracking-wider">Update Order Status</label>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group" disabled={isUpdating}>
                                        <div className="flex items-center gap-2.5">
                                            <StatusBadge status={currentStatus.replace(/_/g, " ")} variant={statusConfig[currentStatus]?.variant || "gray"} />
                                        </div>
                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform group-hover:translate-y-0.5" />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[calc(var(--radix-dropdown-menu-trigger-width)-2px)] p-1.5 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 py-2">Change Status to</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
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
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                            <CreditCard className="w-4 h-4" /> Payment Status
                        </h3>
                        <div className="flex items-center justify-between mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Status</span>
                            <StatusBadge status={order.payment} variant={paymentVariant as "green" | "yellow" | "red"} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OrderDetails;
