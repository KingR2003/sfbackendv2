import React, { useState } from "react";
import { Package, Truck, ShoppingBag, MapPin, ChevronDown, X } from "lucide-react";

const MyOrders = ({ orders, user, onContinueShopping, onViewProduct, onTrackOrder, onContactSupport }) => {
    const [expandedAddress, setExpandedAddress] = useState(null);
    
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
                {orders.map((order) => {
                    const totalValue = order.total ?? order.finalAmount ?? order.totalAmount ?? order.grandTotal ?? order.amount ?? order.total_amount ?? order.total_price;
                    const discountValue = Number(order.discountAmount ?? order.discount_amount ?? order.discount ?? order.couponDiscount ?? order.coupon_discount ?? 0);
                    const rawCouponCode = order.couponCode ?? order.coupon_code ?? order.coupon?.code ?? order.appliedCoupon?.code;
                    const couponCode = (typeof rawCouponCode === 'string' || typeof rawCouponCode === 'number') ? String(rawCouponCode) : null;

                    // Use user name from order, fallback to logged-in user's name
                    const displayName = order.customerName && order.customerName !== 'Valued Member'
                        ? order.customerName
                        : (user?.name || 'Valued Member');

                    // Format payment method nicely
                    const displayPayment = order.paymentMethod && order.paymentMethod !== 'Not Specified'
                        ? order.paymentMethod
                        : 'Not Specified';

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
                                    <div className="order-items" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="order-item" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    background: '#FEF8F0',
                                                    flexShrink: 0,
                                                    cursor: 'pointer'
                                                }} onClick={() => onViewProduct && onViewProduct(item)}>
                                                    <img
                                                        src={item.img || '/wild_honey.png'}
                                                        alt={item.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={e => { e.target.src = '/wild_honey.png'; }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4
                                                        style={{ margin: '0 0 5px 0', color: '#4A4A4A', fontSize: '1.1rem', cursor: 'pointer' }}
                                                        onClick={() => onViewProduct && onViewProduct(item)}
                                                    >
                                                        {item.name || 'Product'}
                                                    </h4>
                                                    <div style={{ display: 'flex', gap: '15px', color: '#868889', fontSize: '0.9rem' }}>
                                                        {item.variant && <span>Variant: {item.variant}</span>}
                                                        <span>Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontWeight: '700', color: '#7C3225', fontSize: '1.1rem' }}>
                                                        ₹{item.price > 0 ? item.price : (order.total && order.items.length > 0 ? Math.round(order.total / order.items.length) : 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
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
                                        onClick={() => onViewProduct && onViewProduct(order.items[0])}
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
