import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, ChevronRight, Package, Send, CheckCircle2, Upload, X, ChevronDown } from "lucide-react";
import { submitSupport, getUserProfile } from "../api";

const SupportCenter = ({ orders, products = [], onContinueShopping, onGoToContactMessage = () => { }, initialOrder, apiToken, onShowToast = () => { } }) => {
    const [selectedType, setSelectedType] = useState(initialOrder ? 'order' : null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState({ name: '', email: '' });
    const [imagePreviews, setImagePreviews] = useState([]);
    const [formData, setFormData] = useState({
        subject: "",
        customSubject: "",
        message: "",
        orderId: initialOrder?.id || "",
        orderIdDisplay: initialOrder?.id ? `Order #${initialOrder.id}` : "",
        images: []
    });
    
    // Dropdown states
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
    const subjectDropdownRef = useRef(null);
    const orderDropdownRef = useRef(null);

    // Get all unique products from orders (removed - no longer needed)
    
    const subjectOptions = [
        "Product Quality Issue",
        "Delivery Delay",
        "Custom Subject"
    ];
    
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
                setIsSubjectDropdownOpen(false);
            }
            if (orderDropdownRef.current && !orderDropdownRef.current.contains(event.target)) {
                setIsOrderDropdownOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch user profile data on component mount
    useEffect(() => {
        if (apiToken) {
            const fetchProfile = async () => {
                try {
                    const response = await getUserProfile(apiToken);
                    const data = await response.json();
                    setUserProfile({
                        name: data.name || data.firstName || '',
                        email: data.email || ''
                    });
                } catch (err) {
                    console.error('Failed to fetch user profile:', err);
                }
            };
            fetchProfile();
        }
    }, [apiToken]);

    // Create thumbnail previews for attached images
    useEffect(() => {
        const previews = (formData.images || []).map((file) => ({
            file,
            url: URL.createObjectURL(file)
        }));

        setImagePreviews(previews);

        return () => {
            previews.forEach((p) => URL.revokeObjectURL(p.url));
        };
    }, [formData.images]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || []);
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file
        const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total
        const validFiles = [];
        let totalSize = formData.images.reduce((sum, file) => sum + (file.size || 0), 0);
        
        for (const file of files) {
            if (!file?.type || !file.type.startsWith('image/')) {
                onShowToast(`File '${file.name}' is not a supported image.`, 'error');
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                onShowToast(`File '${file.name}' is too large. Max 2MB per image.`, 'error');
                continue;
            }
            
            totalSize += file.size;
            if (totalSize > MAX_TOTAL_SIZE) {
                onShowToast('Total file size exceeds 5MB limit. Please remove some images.', 'error');
                break;
            }
            
            validFiles.push(file);
        }
        
        if (validFiles.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...validFiles]
            }));
        }

        // Allow selecting the same file again if needed
        if (e.target) e.target.value = '';
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!apiToken) {
            onShowToast('Please login to submit a support request', 'error');
            return;
        }
        
        // Validate Order ID is selected
        if (!formData.orderId || formData.orderId.trim() === "") {
            onShowToast('Please select an Order ID', 'error');
            return;
        }
        
        // Determine final subject
        const finalSubject = formData.subject === "Custom Subject" 
            ? formData.customSubject 
            : formData.subject;
        
        if (!finalSubject || finalSubject.trim() === "") {
            onShowToast('Please provide a subject for your request', 'error');
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            const payload = {
                name: userProfile.name,
                email: userProfile.email,
                subject: finalSubject,
                message: formData.message,
                type: selectedType, // 'order' or 'general'
                orderId: formData.orderId || null,
                images: formData.images
            };
            
            await submitSupport(payload, apiToken);
            
            setIsSubmitted(true);
            if (onShowToast) {
                onShowToast('Support request submitted successfully! We\'ll get back to you soon.', 'success');
            }
        } catch (err) {
            console.error('Support submission failed:', err);
            const errorMsg = (err && err.response && err.response.data && err.response.data.message) 
                ? err.response.data.message 
                : 'Failed to submit support request. Please try again.';
            if (onShowToast) {
                onShowToast(errorMsg, 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="support-success fade-in" style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
                <div style={{ background: '#F4F9F4', padding: '30px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
                    <CheckCircle2 size={64} color="#2E7D32" />
                </div>
                <h2 style={{ color: '#7C3225', fontSize: '2.5rem', marginBottom: '16px' }}>Request Received</h2>
                <p style={{ color: '#868889', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
                    Our support team has received your query. We'll get back to you within 24 hours.
                </p>
                <button className="btn-product" onClick={() => { 
                    setIsSubmitted(false); 
                    setSelectedType(null); 
                    setFormData({ subject: "", customSubject: "", message: "", orderId: "", orderIdDisplay: "", images: [] });
                    onContinueShopping();
                }}>Back to Shopping</button>
            </div>
        );
    }

    return (
        <div className="support-center fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={{ color: '#7C3225', fontSize: '2.8rem', fontWeight: '800', marginBottom: '15px' }}>Help & Support</h1>
                <p style={{ color: '#868889', fontSize: '1.1rem' }}>How can we assist you today?</p>
            </div>

            {!selectedType ? (
                <div className="support-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    <div className="support-card" onClick={() => setSelectedType('order')} style={cardStyle}>
                        <Package size={32} color="#7C3225" style={{ marginBottom: '15px' }} />
                        <h3>Order Related</h3>
                        <p>Issues with delivery, missing items, or status updates.</p>
                        <ChevronRight size={20} className="arrow" />
                    </div>
                    <div className="support-card" onClick={onGoToContactMessage} style={cardStyle}>
                        <MessageSquare size={32} color="#7C3225" style={{ marginBottom: '15px' }} />
                        <h3>General Support</h3>
                        <p>Feedback, account issues, or other questions.</p>
                        <ChevronRight size={20} className="arrow" />
                    </div>
                </div>
            ) : (
                <div className="support-form-container fade-in">
                    <button
                        onClick={() => { 
                            setSelectedType(null); 
                            setFormData({ subject: "", customSubject: "", message: "", orderId: "", orderIdDisplay: "", images: [] });
                            setIsSubjectDropdownOpen(false);
                            setIsOrderDropdownOpen(false);
                        }}
                        style={{ color: '#7C3225', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        &larr; Back to Options
                    </button>

                    <div style={{ background: '#FFF', borderRadius: '20px', padding: '35px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' }}>
                        <h2 style={{ color: '#7C3225', marginBottom: '30px' }}>Order Related Issue</h2>

                        <form onSubmit={handleSubmit}>
                            {/* Custom Order ID Dropdown */}
                            <div className="form-group-refined" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A4A4A' }}>Order ID <span style={{ color: '#D32F2F' }}>*</span></label>
                                <div ref={orderDropdownRef} style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                                        style={{
                                            ...inputStyle,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            color: formData.orderIdDisplay ? '#4A4A4A' : '#999'
                                        }}
                                    >
                                        <span>{formData.orderIdDisplay || '-- Select an order --'}</span>
                                        <ChevronDown size={20} style={{ 
                                            transition: 'transform 0.3s ease',
                                            transform: isOrderDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }} />
                                    </div>
                                    
                                    {isOrderDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '5px',
                                            background: '#FFF',
                                            border: '1px solid #EBEBEB',
                                            borderRadius: '10px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            zIndex: 1000
                                        }}>
                                            <div
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, orderId: '', orderIdDisplay: '' }));
                                                    setIsOrderDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: '12px 15px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s ease',
                                                    color: '#999',
                                                    borderBottom: '1px solid #F5F5F5'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#FEF8F0'}
                                                onMouseLeave={(e) => e.target.style.background = '#FFF'}
                                            >
                                                -- Select an order --
                                            </div>
                                            {orders && Array.isArray(orders) && orders.map((order) => (
                                                <div
                                                    key={order.id}
                                                    onClick={() => {
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            orderId: order.id,
                                                            orderIdDisplay: `Order #${order.id}`
                                                        }));
                                                        setIsOrderDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        padding: '12px 15px',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s ease',
                                                        borderBottom: '1px solid #F5F5F5',
                                                        background: formData.orderId === order.id ? '#FEF8F0' : '#FFF',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#FEF8F0'}
                                                    onMouseLeave={(e) => {
                                                        if (formData.orderId !== order.id) {
                                                            e.currentTarget.style.background = '#FFF';
                                                        }
                                                    }}
                                                >
                                                    <span style={{ fontWeight: '600' }}>Order #{order.id}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#868889' }}>{order.date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Custom Subject Dropdown */}
                            <div className="form-group-refined" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A4A4A' }}>Subject <span style={{ color: '#D32F2F' }}>*</span></label>
                                <div ref={subjectDropdownRef} style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                        style={{
                                            ...inputStyle,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            color: formData.subject ? '#4A4A4A' : '#999'
                                        }}
                                    >
                                        <span>{formData.subject || '-- Select a subject --'}</span>
                                        <ChevronDown size={20} style={{ 
                                            transition: 'transform 0.3s ease',
                                            transform: isSubjectDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }} />
                                    </div>
                                    
                                    {isSubjectDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '5px',
                                            background: '#FFF',
                                            border: '1px solid #EBEBEB',
                                            borderRadius: '10px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            zIndex: 1000
                                        }}>
                                            <div
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, subject: '' }));
                                                    setIsSubjectDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: '12px 15px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s ease',
                                                    color: '#999',
                                                    borderBottom: '1px solid #F5F5F5'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#FEF8F0'}
                                                onMouseLeave={(e) => e.target.style.background = '#FFF'}
                                            >
                                                -- Select a subject --
                                            </div>
                                            {subjectOptions.map((option) => (
                                                <div
                                                    key={option}
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, subject: option }));
                                                        setIsSubjectDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        padding: '12px 15px',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s ease',
                                                        borderBottom: option === subjectOptions[subjectOptions.length - 1] ? 'none' : '1px solid #F5F5F5',
                                                        background: formData.subject === option ? '#FEF8F0' : '#FFF'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#FEF8F0'}
                                                    onMouseLeave={(e) => {
                                                        if (formData.subject !== option) {
                                                            e.target.style.background = '#FFF';
                                                        }
                                                    }}
                                                >
                                                    {option}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Custom Subject Input (shown when "Custom Subject" is selected) */}
                            {formData.subject === "Custom Subject" && (
                                <div className="form-group-refined" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A4A4A' }}>Enter Custom Subject <span style={{ color: '#D32F2F' }}>*</span></label>
                                    <input
                                        type="text"
                                        name="customSubject"
                                        value={formData.customSubject}
                                        onChange={handleInputChange}
                                        placeholder="Type your custom subject here"
                                        required
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            {/* Message Field */}
                            <div className="form-group-refined" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A4A4A' }}>Message <span style={{ color: '#D32F2F' }}>*</span></label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Please describe your issue in detail..."
                                    required
                                    style={textareaStyle}
                                    rows="5"
                                />
                            </div>

                            {/* Image Upload Field */}
                            <div className="form-group-refined" style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A4A4A' }}>Attach Images <span style={{ color: '#868889', fontSize: '0.9rem' }}>(Optional)</span></label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '30px',
                                    borderRadius: '12px',
                                    border: '2px dashed #EBEBEB',
                                    cursor: 'pointer',
                                    background: '#FDFCFB',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Upload size={20} color="#7C3225" />
                                    <span style={{ color: '#4A4A4A', fontWeight: '500' }}>Click to upload or drag images</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>

                                {/* Image Preview */}
                                {formData.images.length > 0 && (
                                    <div style={{ marginTop: '15px' }}>
                                        <p style={{ fontSize: '0.9rem', color: '#868889', marginBottom: '10px' }}>{formData.images.length} file(s) selected</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {imagePreviews.map((p, idx) => (
                                                <div
                                                    key={`${p.file?.name || 'image'}-${p.file?.lastModified || idx}-${p.file?.size || 0}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px 12px',
                                                        background: '#F0F0F0',
                                                        borderRadius: '10px',
                                                        fontSize: '0.9rem',
                                                        maxWidth: '100%'
                                                    }}
                                                >
                                                    <img
                                                        src={p.url}
                                                        alt={p.file?.name || 'Attached image'}
                                                        style={{
                                                            width: '64px',
                                                            height: '64px',
                                                            borderRadius: '10px',
                                                            objectFit: 'cover',
                                                            background: '#FFF',
                                                            flex: '0 0 auto'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: '#4A4A4A',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '260px'
                                                    }}>
                                                        {p.file?.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginLeft: 'auto' }}
                                                        aria-label={`Remove ${p.file?.name || 'image'}`}
                                                    >
                                                        <X size={16} color="#D32F2F" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn-product" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', padding: '12px' }} disabled={isSubmitting}>
                                <Send size={20} /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const cardStyle = {
    background: '#FFF',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    border: '1px solid #F0F0F0',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s ease'
};

const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '1px solid #EBEBEB',
    fontSize: '1rem',
    color: '#4A4A4A',
    outline: 'none',
    background: '#FDFCFB',
    boxSizing: 'border-box'
};

const textareaStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    border: '1px solid #EBEBEB',
    fontSize: '1rem',
    color: '#4A4A4A',
    outline: 'none',
    resize: 'vertical',
    background: '#FDFCFB',
    boxSizing: 'border-box'
};

export default SupportCenter;
