import React, { useState } from "react";
import { Package, Truck, ShoppingBag, MapPin, ChevronDown, X } from "lucide-react";

const MyOrders = ({ orders, user, onContinueShopping, onViewProduct, onTrackOrder, onContactSupport, onBuyAgain }) => {
    const [expandedAddress, setExpandedAddress] = useState(null);

    const PLACEHOLDER_IMG = '/wild_honey.png';
    const isPlaceholderImg = (value) => !value || value === PLACEHOLDER_IMG;
    const norm = (v) => (v === undefined || v === null ? '' : String(v)).trim();

    const resolveItemImage = (item) => (
        item?.variantImage ||
        item?.selectedVariant?.image ||
        item?.selectedVariant?.img ||
        item?.variant?.images?.[0]?.imageUrl ||
        item?.variant?.images?.[0]?.url ||
        item?.variant?.imageUrl ||
        item?.variant?.image ||
        item?.variant?.img ||
        item?.product?.images?.[0]?.imageUrl ||
        item?.product?.images?.[0]?.url ||
        item?.product?.imageUrl ||
        item?.product?.image ||
        item?.product?.img ||
        item?.img ||
        item?.imageUrl ||
        item?.image ||
        (item?.images && item.images[0]) ||
        (Array.isArray(item?.variantImages) && item.variantImages[0]) ||
        PLACEHOLDER_IMG
    );

    const dedupeOrderItemsForThumbnails = (items) => {
        const arr = Array.isArray(items) ? items : [];
        if (arr.length <= 1) return arr;

        const byKey = new Map();

        for (const it of arr) {
            const productId = norm(it?.productId ?? it?.product_id ?? it?.product?.id ?? it?.product?.productId ?? it?.product?.product_id);
            const variantId = norm(it?.variantId ?? it?.variant_id ?? it?.variant?.id ?? it?.variant?.variantId ?? it?.variant?.variant_id);
            const key = (productId || variantId) ? `${productId}::${variantId}` : `fallback:${norm(it?.name).toLowerCase()}:${resolveItemImage(it)}`;

            const existing = byKey.get(key);
            if (!existing) {
                const qty = Number(it?.quantity || it?.qty || 1);
                byKey.set(key, { ...it, quantity: Number.isFinite(qty) && qty > 0 ? qty : 1, _thumbKey: key });
                continue;
            }

            const addQty = Number(it?.quantity || it?.qty || 1);
            existing.quantity += (Number.isFinite(addQty) && addQty > 0 ? addQty : 1);

            // Prefer a non-placeholder image when merging duplicates
            const existingImg = resolveItemImage(existing);
            const nextImg = resolveItemImage(it);
            if (isPlaceholderImg(existingImg) && !isPlaceholderImg(nextImg)) {
                existing.variantImage = it?.variantImage || existing.variantImage;
                existing.img = it?.img || existing.img;
                existing.imageUrl = it?.imageUrl || existing.imageUrl;
                existing.image = it?.image || existing.image;
            }
        }

        return Array.from(byKey.values());
    };

    const normalizePaymentMethod = (value) => {
        if (value === null || value === undefined) return null;

        let candidate = value;
        if (typeof candidate === 'object') {
            candidate =
                candidate.method ||
                candidate.type ||
                candidate.mode ||
                candidate.name ||
                candidate.label ||
                candidate.value ||
                candidate.paymentMethod ||
                candidate.paymentType ||
                null;
        }

        if (candidate === null || candidate === undefined) return null;

        const text = String(candidate).trim();
        if (!text) return null;

        const lowered = text.toLowerCase();
        if (lowered === 'null' || lowered === 'undefined' || lowered === 'not specified' || lowered === 'n/a' || lowered === 'na') {
            return null;
        }

        if (lowered === 'cod' || lowered.includes('cash') || lowered.includes('delivery')) return 'Cash on Delivery';
        if (lowered === 'upi' || lowered.includes('upi') || lowered.includes('netbank') || lowered.includes('net bank')) return 'UPI / Netbanking';
        if (lowered === 'card' || lowered.includes('card') || lowered.includes('credit') || lowered.includes('debit')) return 'Card Payment';

        return text;
    };

    const getDisplayPaymentMethod = (order) => {
        const candidates = [
            order?.paymentMethod,
            order?.paymentType,
            order?.payment_method,
            order?.payment_mode,
            order?.payment_type,
            order?.method,
            order?.paymentMethodName,
            order?.payment,
            order?.paymentDetails,
            order?.payment_details,
            order?.paymentInfo,
            order?.payment_info,
            order?.transaction?.paymentMethod,
            order?.transaction?.payment_method,
            order?.transaction?.method,
            order?.data?.paymentMethod,
            order?.data?.paymentType,
            order?.data?.payment_method,
            order?.data?.payment_mode,
            order?.data?.payment_type,
        ];

        for (const candidate of candidates) {
            const normalized = normalizePaymentMethod(candidate);
            if (normalized) return normalized;
        }

        return 'Not Specified';
    };

    const toMillis = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') {
            if (value > 1e12) return value;
            if (value > 1e9) return value * 1000;
            return 0;
        }
        const text = String(value).trim();
        if (!text) return 0;
        if (/^\d+$/.test(text)) {
            const n = Number(text);
            if (Number.isFinite(n)) {
                if (n > 1e12) return n;
                if (n > 1e9) return n * 1000;
            }
        }
        const d = new Date(text);
        if (!isNaN(d.getTime())) return d.getTime();
        const m = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (m) {
            const day = Number(m[1]);
            const month = Number(m[2]) - 1;
            const year = Number(m[3]);
            const hour = Number(m[4] || 0);
            const min = Number(m[5] || 0);
            const sec = Number(m[6] || 0);
            const dd = new Date(year, month, day, hour, min, sec);
            if (!isNaN(dd.getTime())) return dd.getTime();
        }
        return 0;
    };

    const getOrderTime = (order) => {
        if (!order) return 0;
        const candidates = [
            order.createdAt,
            order.created_at,
            order.orderDate,
            order.order_date,
            order.date,
            order.updatedAt,
            order.updated_at,
            order.completedAt,
            order.completed_at,
            order.deliveredAt,
            order.delivered_at,
        ];
        for (const c of candidates) {
            const t = toMillis(c);
            if (t > 0) return t;
        }
        return 0;
    };
    
    if (orders.length === 0) {
        return (
            <div className="empty-orders-container fade-in" style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
                <div className="empty-cart-icon" style={{ background: '#FEF8F0', padding: '30px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
                    <Package size={64} color="#7C3225" />
                </div>
                <h2 style={{ color: '#7C3225', fontSize: '2rem', marginBottom: '16px' }}>No orders yet</h2>
                <p style={{ color: '#868889', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                    You haven't placed any orders yet. Start shopping to see your orders here!
                </p>
                <button
                    className="btn-product"
                    onClick={onContinueShopping}
                    style={{ minWidth: '200px' }}
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="my-orders-page fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ color: '#7C3225', fontSize: '2.5rem', marginBottom: '10px', fontWeight: '700' }}>My Orders</h1>
            <p style={{ color: '#868889', marginBottom: '40px' }}>Track and manage your recent orders.</p>

            <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {[...orders].sort((a, b) => {
                    const ta = getOrderTime(a);
                    const tb = getOrderTime(b);
                    if (ta !== tb) return tb - ta;
                    return String(b?.id || '').localeCompare(String(a?.id || ''));
                }).map((order) => {
                    const totalValue = order.total ?? order.finalAmount ?? order.totalAmount ?? order.grandTotal ?? order.amount ?? order.total_amount ?? order.total_price;
                    const discountValue = Number(order.discountAmount ?? order.discount_amount ?? order.discount ?? order.couponDiscount ?? order.coupon_discount ?? 0);
                    const rawCouponCode = order.couponCode ?? order.coupon_code ?? order.coupon?.code ?? order.appliedCoupon?.code;
                    const couponCode = (typeof rawCouponCode === 'string' || typeof rawCouponCode === 'number') ? String(rawCouponCode) : null;

                    // Use user name from order, fallback to logged-in user's name
                    const displayName = order.customerName && order.customerName !== 'Valued Member'
                        ? order.customerName
                        : (user?.name || 'Valued Member');

                    // Format payment method nicely
                    const displayPayment = getDisplayPaymentMethod(order);

                    const hasItems = Array.isArray(order.items) && order.items.length > 0;

                    // Try to derive a human-friendly shipping address string
                    const shippingAddressObj = order.shippingAddress || order.deliveryAddress;
                    let shippingAddress =
                        order.address ||
                        order.deliveryAddress ||
                        order.location ||
                        (order.shippingAddress && (order.shippingAddress.addressLine || order.shippingAddress.fullAddress)) ||
                        "";

                    if (!shippingAddress && shippingAddressObj && typeof shippingAddressObj === 'object') {
                        const {
                            building_no,
                            buildingNo,
                            building_name,
                            buildingName,
                            street_no,
                            streetNo,
                            area_name,
                            areaName,
                            city,
                            state,
                            pincode,
                            pinCode,
                        } = shippingAddressObj;

                        const parts = [
                            building_no || buildingNo,
                            building_name || buildingName,
                            street_no || streetNo,
                            area_name || areaName,
                            city,
                            state,
                        ].filter(Boolean);

                        const pin = pincode || pinCode;
                        shippingAddress = parts.join(', ');
                        if (pin) shippingAddress = shippingAddress ? `${shippingAddress} - ${pin}` : String(pin);
                    }

                    return (
                        <div key={order.id} className="order-card" style={{
                            background: '#FFF',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #F0F0F0'
                        }}>
                            {/* Order Header */}
                            <div className="order-header" style={{
                                padding: '20px 24px',
                                background: '#FDFCFB',
                                borderBottom: '1px solid #F0F0F0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#868889', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Order Placed</span>
                                        <span style={{ fontWeight: '600', color: '#4A4A4A' }}>{order.date}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#868889', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Total</span>
                                        <span style={{ fontWeight: '600', color: '#4A4A4A' }}>₹{totalValue ?? '—'}</span>
                                        {discountValue > 0 && (
                                            <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#1AA60B', fontWeight: '600' }}>
                                                Discount{couponCode ? ` (${couponCode})` : ''}: -₹{Math.round(discountValue)}
                                            </div>
                                        )}
                                    </div>
                                    <div 
                                        style={{ position: 'relative' }}
                                        onMouseEnter={() => setExpandedAddress(order.id)}
                                        onMouseLeave={() => setExpandedAddress(null)}
                                    >
                                        <span style={{ fontSize: '0.75rem', color: '#868889', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Ship To</span>
                                        <div 
                                            style={{ 
                                                fontWeight: '600', 
                                                color: '#007185', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            onClick={() => setExpandedAddress(expandedAddress === order.id ? null : order.id)}
                                        >
                                            {displayName} <ChevronDown size={14} />
                                        </div>
                                        
                                        {/* Address Dropdown */}
                                        {expandedAddress === order.id && shippingAddress && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                marginTop: '8px',
                                                background: '#FFF',
                                                border: '1px solid #DDD',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                                zIndex: 10,
                                                minWidth: '280px',
                                                maxWidth: '350px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <div style={{ fontWeight: '700', color: '#0F1111', fontSize: '0.95rem' }}>{displayName}</div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedAddress(null);
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    >
                                                        <X size={18} color="#565959" />
                                                    </button>
                                                </div>
                                                <div style={{ color: '#565959', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                                    {shippingAddress}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#868889', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Payment Method</span>
                                        <span style={{ fontWeight: '600', color: displayPayment !== 'Not Specified' ? '#1AA60B' : '#7C3225' }}>{displayPayment}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#868889', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>ORDER # {order.id}</span>
                                    <a 
                                        href="#" 
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            onTrackOrder && onTrackOrder(order); 
                                        }} 
                                        style={{ 
                                            color: '#007185', 
                                            textDecoration: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: '400'
                                        }}
                                    >
                                        View order details
                                    </a>
                                </div>
                            </div>

                            {/* Order Content */}
                            <div className="order-content" style={{ padding: '20px 24px 24px' }}>
                                {/* Delivery Status - Amazon Style */}
                                <div style={{ marginBottom: '24px' }}>
                                    {(String(order.status || '').toUpperCase() === 'DELIVERED') ? (
                                        <>
                                            {(() => {
                                                // Debug: log the order object to see what fields are available
                                                console.log('Delivered order object:', order);
                                                console.log('Available date fields:', {
                                                    deliveryDate: order.deliveryDate,
                                                    deliveredDate: order.deliveredDate,
                                                    delivered_on: order.delivered_on,
                                                    deliveredAt: order.deliveredAt,
                                                    delivered_at: order.delivered_at,
                                                    completedAt: order.completedAt,
                                                    completed_at: order.completed_at,
                                                    updatedAt: order.updatedAt,
                                                    updated_at: order.updated_at,
                                                    createdAt: order.createdAt,
                                                    created_at: order.created_at,
                                                    date: order.date
                                                });
                                                
                                                const deliveredOn =
                                                    order.deliveryDate ||
                                                    order.deliveredDate ||
                                                    order.delivered_on ||
                                                    order.deliveredAt ||
                                                    order.delivered_at ||
                                                    order.completedAt ||
                                                    order.completed_at ||
                                                    order.updatedAt ||
                                                    order.updated_at ||
                                                    '';

                                                return (
                                                    <>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'baseline',
                                                            gap: '10px',
                                                            flexWrap: 'wrap',
                                                            marginBottom: '6px'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '1.5rem',
                                                                fontWeight: '700',
                                                                color: '#007600'
                                                            }}>
                                                                Delivered
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.95rem',
                                                            color: '#565959',
                                                            fontWeight: '500',
                                                            marginBottom: '6px'
                                                        }}>
                                                            {deliveredOn ? `Delivered on: ${deliveredOn}` : 'Your order has been delivered successfully'}
                                                        </div>
                                                        <div style={{
                                                            paddingBottom: '16px',
                                                            borderBottom: '1px solid #E7E7E7'
                                                        }} />
                                                    </>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ 
                                                fontSize: '1.5rem', 
                                                fontWeight: '700', 
                                                color: '#007600',
                                                marginBottom: '6px'
                                            }}>
                                                {order.status || 'PROCESSING'}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.95rem', 
                                                color: '#565959',
                                                paddingBottom: '16px',
                                                borderBottom: '1px solid #E7E7E7'
                                            }}>
                                                
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Products */}
                                {hasItems ? (
                                    <div className="order-items" style={{ display: 'flex', flexDirection: 'row', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                                        {dedupeOrderItemsForThumbnails(order.items).map((item, idx) => {
                                            const variantImage = resolveItemImage(item);
                                            
                                            return (
                                            <div key={item._thumbKey || idx} className="order-item-grid" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{
                                                    width: '90px',
                                                    height: '90px',
                                                    borderRadius: '8px',
                                                    overflow: 'visible',
                                                    background: '#FEF8F0',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }} onClick={() => onViewProduct && onViewProduct(item)}>
                                                    <img
                                                        src={variantImage}
                                                        alt={item.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                        onError={e => { e.target.src = '/wild_honey.png'; }}
                                                    />
                                                    {item.quantity > 1 && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            top: '-6px',
                                                            right: '-6px',
                                                            background: 'rgba(124, 50, 37, 0.95)',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            fontWeight: '700',
                                                            padding: '4px 8px',
                                                            borderRadius: '10px',
                                                            border: '2px solid white',
                                                            zIndex: 10,
                                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            Qty {item.quantity}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px',
                                        background: '#FEF8F0',
                                        borderRadius: '10px',
                                        color: '#868889',
                                        fontSize: '0.9rem'
                                    }}>
                                        <ShoppingBag size={20} color="#7C3225" />
                                        <span>Product details not available for this order. The items were successfully ordered.</span>
                                    </div>
                                )}

                            </div>

                            {/* Order Actions */}
                            <div className="order-footer" style={{
                                padding: '16px 24px',
                                borderTop: '1px solid #F0F0F0',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px'
                            }}>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                                    onClick={() => onContactSupport && onContactSupport(order)}
                                >
                                    Help & Support
                                </button>
                                {hasItems && (
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                                        onClick={() => onBuyAgain && onBuyAgain(order)}
                                    >
                                        Buy it again
                                    </button>
                                )}
                                <button
                                    className="btn-product"
                                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                                    onClick={() => onTrackOrder && onTrackOrder(order)}
                                >
                                    Track Package
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyOrders;
