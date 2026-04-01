import React, { useState } from "react";
import { 
  Package, 
  PackageCheck, 
  Truck, 
  Home, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock,
  Phone,
  Mail,
  ChevronLeft
} from "lucide-react";

const OrderTracking = ({ order, onBack, onContactSupport }) => {
  // Transform the incoming order into the tracking format
  const generateTrackingData = (orderData) => {
    if (!orderData) return null;
    
    // Create timeline based on order status
    const statusMap = {
      "Delivered": "delivered",
      "Out for Delivery": "out-for-delivery",
      "In Transit": "shipped",
      "Processing": "packed",
      "Confirmed": "ordered"
    };
    
    const currentStatus = statusMap[orderData.status] || "ordered";
    const statusOrder = ["ordered", "packed", "shipped", "out-for-delivery", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // Generate timeline
    const now = new Date();
    const orderDate = new Date(orderData.date || now);
    
    const timeline = [
      {
        status: "ordered",
        label: "Order Placed",
        date: orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: orderData.time || "10:30 AM",
        completed: currentIndex >= 0,
        description: "Your order has been confirmed"
      },
      {
        status: "packed",
        label: "Packed",
        date: new Date(orderDate.getTime() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: "02:15 PM",
        completed: currentIndex >= 1,
        description: "Your order has been packed and ready to ship"
      },
      {
        status: "shipped",
        label: "Shipped",
        date: new Date(orderDate.getTime() + 172800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: "09:00 AM",
        completed: currentIndex >= 2,
        description: "Your order is on the way"
      },
      {
        status: "out-for-delivery",
        label: "Out for Delivery",
        date: new Date(orderDate.getTime() + 259200000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: "02:30 PM",
        completed: currentIndex >= 3,
        description: "Your order is out for delivery"
      },
      {
        status: "delivered",
        label: "Delivered",
        date: currentIndex >= 4 
          ? new Date(orderDate.getTime() + 259200000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : "Expected by 6:00 PM",
        time: currentIndex >= 4 ? "5:45 PM" : "",
        completed: currentIndex >= 4,
        description: currentIndex >= 4 ? "Your order has been delivered" : "Your order will be delivered soon"
      }
    ];
    
    return {
      id: orderData.id || "ORD-UNKNOWN",
      date: orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: orderData.time || "10:30 AM",
      total: orderData.total || "0",
      expectedDelivery: new Date(orderDate.getTime() + 345600000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      trackingNumber: `TRK${orderData.id?.replace(/[^0-9]/g, '') || Math.floor(Math.random() * 1000000000)}`,
      customerName: orderData.customerName || "Valued Customer",
      address: orderData.address || "Delivery address not specified",
      phone: orderData.phone || "+91 XXXXX XXXXX",
      email: orderData.email || "email@example.com",
      paymentMethod: orderData.paymentMethod || "Not Specified",
      currentStatus: currentStatus,
      items: orderData.items?.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        image: item.img || item.image || "https://images.unsplash.com/photo-1586201375761-83865001e31c"
      })) || [],
      timeline: timeline
    };
  };

  const orderData = order ? generateTrackingData(order) : generateTrackingData({
    id: "ORD123456",
    date: "2026-03-08",
    time: "10:30 AM",
    total: "1,299",
    status: "Out for Delivery",
    customerName: "John Doe",
    address: "123 Green Valley, Apartment 4B, Mumbai - 400001",
    phone: "+91 98765 43210",
    email: "john.doe@example.com",
    paymentMethod: "UPI",
    items: [
      {
        name: "Organic Brown Rice",
        quantity: 2,
        price: "299",
        img: "https://images.unsplash.com/photo-1586201375761-83865001e31c"
      }
    ]
  });
  
  const getStatusIcon = (status) => {
    switch(status) {
      case "ordered":
        return <Package size={24} />;
      case "packed":
        return <PackageCheck size={24} />;
      case "shipped":
        return <Truck size={24} />;
      case "out-for-delivery":
        return <Truck size={24} />;
      case "delivered":
        return <CheckCircle2 size={24} />;
      default:
        return <Package size={24} />;
    }
  };

  return (
    <div className="order-tracking-page fade-in" style={{
      minHeight: '100vh',
      background: 'var(--bg-color)',
      padding: '20px 20px 60px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        {onBack && (
          <button 
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#7C3225',
              background: 'transparent',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '10px 0',
              marginBottom: '20px',
              transition: 'gap 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.gap = '12px'}
            onMouseLeave={(e) => e.currentTarget.style.gap = '8px'}
          >
            <ChevronLeft size={20} />
            Back to Orders
          </button>
        )}

        {/* Header Section */}
        <div style={{
          background: '#FFF',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                color: '#7C3225',
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Track Your Order
              </h1>
              <p style={{ color: '#868889', fontSize: '0.95rem' }}>
                Order ID: <span style={{ fontWeight: '600', color: '#7C3225' }}>{orderData.id}</span>
              </p>
            </div>
            <div style={{
              background: '#F4F9F4',
              padding: '16px 24px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#868889',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Expected Delivery
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#1AA60B'
              }}>
                {orderData.expectedDelivery}
              </div>
            </div>
          </div>

          {/* Tracking Number */}
          <div style={{
            background: '#FEF8F0',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#868889' }}>Tracking Number: </span>
            <span style={{ fontWeight: '700', color: '#7C3225', fontSize: '0.9rem' }}>
              {orderData.trackingNumber}
            </span>
          </div>
        </div>

        {/* Horizontal Timeline */}
        <div style={{
          background: '#FFF',
          borderRadius: '20px',
          padding: '40px 32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          overflowX: 'auto'
        }}>
          <h2 style={{
            color: '#7C3225',
            fontSize: '1.3rem',
            fontWeight: '700',
            marginBottom: '32px'
          }}>
            Order Status
          </h2>

          {/* Timeline Container */}
          <div style={{
            position: 'relative',
            minWidth: '900px'
          }}>
            {/* Progress Line */}
            <div style={{
              position: 'absolute',
              top: '32px',
              left: '32px',
              right: '32px',
              height: '4px',
              background: '#E0E0E0',
              borderRadius: '2px',
              zIndex: 1
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #1AA60B 0%, #2E7D32 100%)',
                borderRadius: '2px',
                width: `${(orderData.timeline.filter(s => s.completed).length - 1) * 25}%`,
                transition: 'width 0.5s ease'
              }} />
            </div>

            {/* Timeline Steps */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2
            }}>
              {orderData.timeline.map((step, index) => (
                <div 
                  key={step.status}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Icon Circle */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: step.completed ? 'linear-gradient(135deg, #1AA60B 0%, #2E7D32 100%)' : '#E0E0E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.completed ? '#FFF' : '#868889',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: step.completed ? '0 4px 12px rgba(26, 166, 11, 0.3)' : 'none',
                    transform: step.completed && orderData.currentStatus === step.status ? 'scale(1.1)' : 'scale(1)',
                    animation: step.completed && orderData.currentStatus === step.status ? 'pulse 2s infinite' : 'none'
                  }}>
                    {getStatusIcon(step.status)}
                  </div>

                  {/* Label */}
                  <div style={{
                    textAlign: 'center',
                    maxWidth: '150px'
                  }}>
                    <div style={{
                      fontWeight: '700',
                      color: step.completed ? '#1AA60B' : '#868889',
                      marginBottom: '8px',
                      fontSize: '0.95rem'
                    }}>
                      {step.label}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#868889',
                      marginBottom: '4px'
                    }}>
                      {step.date}
                    </div>
                    {step.time && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#868889'
                      }}>
                        {step.time}
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#4A4A4A',
                      marginTop: '8px',
                      fontStyle: 'italic'
                    }}>
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Delivery Address */}
          <div style={{
            background: '#FFF',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FEF8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={20} color="#7C3225" />
              </div>
              <h3 style={{
                color: '#7C3225',
                fontSize: '1.1rem',
                fontWeight: '700'
              }}>
                Delivery Address
              </h3>
            </div>
            <div style={{ color: '#4A4A4A', lineHeight: '1.8' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: '#7C3225' }}>
                {orderData.customerName}
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                {orderData.address}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                fontSize: '0.9rem'
              }}>
                <Phone size={16} color="#868889" />
                {orderData.phone}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                fontSize: '0.9rem'
              }}>
                <Mail size={16} color="#868889" />
                {orderData.email}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{
            background: '#FFF',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#F4F9F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={20} color="#1AA60B" />
              </div>
              <h3 style={{
                color: '#7C3225',
                fontSize: '1.1rem',
                fontWeight: '700'
              }}>
                Order Summary
              </h3>
            </div>
            <div style={{ color: '#4A4A4A', lineHeight: '1.8' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                <span style={{ color: '#868889' }}>Order Date:</span>
                <span style={{ fontWeight: '600' }}>{orderData.date} {orderData.time}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                <span style={{ color: '#868889' }}>Payment Method:</span>
                <span style={{ fontWeight: '600' }}>{orderData.paymentMethod}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                <span style={{ color: '#868889' }}>Total Items:</span>
                <span style={{ fontWeight: '600' }}>{orderData.items.length}</span>
              </div>
              <div style={{
                height: '1px',
                background: '#E0E0E0',
                margin: '16px 0'
              }} />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem'
              }}>
                <span style={{ fontWeight: '700', color: '#7C3225' }}>Total Amount:</span>
                <span style={{ fontWeight: '700', color: '#1AA60B' }}>₹{orderData.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div style={{
          background: '#FFF',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{
            color: '#7C3225',
            fontSize: '1.2rem',
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            Items in This Order
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {orderData.items.map((item, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '16px',
                  background: '#FDFCFB',
                  borderRadius: '12px',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '10px',
                  background: '#FEF8F0',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#4A4A4A',
                    marginBottom: '6px',
                    fontSize: '1rem'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    color: '#868889',
                    fontSize: '0.9rem'
                  }}>
                    Quantity: {item.quantity}
                  </div>
                </div>
                <div style={{
                  fontWeight: '700',
                  color: '#1AA60B',
                  fontSize: '1.1rem'
                }}>
                  ₹{item.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center',
          color: '#868889',
          fontSize: '0.9rem'
        }}>
          <p style={{ marginBottom: '8px' }}>
            Need help with your order?
          </p>
          <button style={{
            background: 'transparent',
            border: '2px solid #7C3225',
            color: '#7C3225',
            padding: '12px 32px',
            fontSize: '0.95rem',
            fontWeight: '600',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onClick={() => onContactSupport && onContactSupport()}
          onMouseEnter={(e) => {
            e.target.style.background = '#7C3225';
            e.target.style.color = '#FFF';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#7C3225';
          }}
          >
            Contact Support
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(26, 166, 11, 0.3);
          }
          50% {
            box-shadow: 0 4px 24px rgba(26, 166, 11, 0.6);
          }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .order-tracking-page > div {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTracking;
