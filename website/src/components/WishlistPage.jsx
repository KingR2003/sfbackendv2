import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, Trash2, ArrowRight, ChevronLeft } from "lucide-react";

const WishlistPage = ({ wishlist, onAddToCart, onRemove, onViewProduct, onContinueShopping, onGoToCart = () => {}, onClearWishlist = null }) => {
    const [addedIds, setAddedIds] = useState([]);
    
    // Initialize selectedVariants from localStorage
    const [selectedVariants, setSelectedVariants] = useState(() => {
        try {
            const saved = localStorage.getItem("wishlist_selected_variants");
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Failed to load selected variants from localStorage:", e);
            return {};
        }
    });

    // Persist selectedVariants to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem("wishlist_selected_variants", JSON.stringify(selectedVariants));
        } catch (e) {
            console.error("Failed to save selected variants to localStorage:", e);
        }
    }, [selectedVariants]);

    const handleAddToCart = (product) => {
        // Get the currently selected variant for this wishlist item
        const currentVariantId = selectedVariants[product.wishlistItemId] || product.selectedVariantId;
        
        // Find the full variant object from the product's variants array
        const selectedVariantObj = product.variants?.find(v => 
            (v.id === currentVariantId || v.variantId === currentVariantId)
        ) || product.variants?.[0];

        const key = `${product.id || product.productId}-${currentVariantId}`;
        const alreadyAdded = addedIds.includes(key);

        if (!alreadyAdded) {
            // Pass the explicitly selected variant to ensure correct variant is added to cart
            onAddToCart(product, selectedVariantObj);
            setAddedIds(prev => prev.includes(key) ? prev : [...prev, key]);
        } else {
            onGoToCart();
        }
    };

    const handleVariantChange = (wishlistItemId, variantId) => {
        setSelectedVariants(prev => ({
            ...prev,
            [wishlistItemId]: variantId
        }));
    };

    const handleRemove = (product) => {
        // Pass product with the currently selected variant ID
        const currentVariantId = selectedVariants[product.wishlistItemId] || product.selectedVariantId;
        const productToRemove = { ...product, selectedVariantId: currentVariantId };
        console.log("[WishlistPage] Removing product with variant:", { productId: product.id, variantId: currentVariantId });
        onRemove(productToRemove);
    };

    if (wishlist.length === 0) {
        return (
            <div style={{ backgroundColor: '#FEF8F0', width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', padding: '60px 0 40px', minHeight: '100vh', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
                    <div className="empty-cart-container fade-in" style={{ padding: '0', textAlign: 'center' }}>
                        <div className="empty-cart-icon" style={{ background: '#FEF8F0', padding: '30px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
                            <Heart size={64} color="#7C3225" />
                        </div>
                        <h2 style={{ color: '#7C3225', fontSize: '2rem', marginBottom: '16px' }}>Your wishlist is empty</h2>
                        <p style={{ color: '#868889', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                            Save items you love to find them easily and purchase them later.
                        </p>
                        <button
                            className="btn-product"
                            onClick={onContinueShopping}
                            style={{ minWidth: '200px' }}
                        >
                            Start Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#FEF8F0', width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', padding: '60px 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }} className="wishlist-page fade-in">
                <div className="pd-breadcrumb" style={{ marginBottom: '30px' }}>
                    <button onClick={onContinueShopping} className="back-btn">
                        <ChevronLeft size={18} /> Back to Shopping
                    </button>
                </div>

                <h1 style={{ color: '#7C3225', fontSize: '2.5rem', marginBottom: '40px', fontWeight: '700' }}>My Wishlist</h1>

                {onClearWishlist && (
                    <button
                        className="cp-add-more-btn cp-remove-all-btn"
                        onClick={onClearWishlist}
                        title="Clear all wishlist data"
                    >
                        Remove all
                    </button>
                )}

                <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                    {wishlist.map((product, index) => {
                        const currentVariantId = selectedVariants[product.wishlistItemId] || product.selectedVariantId;
                        const currentVariant = product.variants?.find(v => v.id === currentVariantId);
                        const displayPrice = currentVariant?.price || product.price;
                        const displayName = currentVariant?.variantName;
                        // Use wishlistItemId if available, otherwise create unique key from product + index
                        const uniqueKey = product.wishlistItemId ? String(product.wishlistItemId) : `${product.id}-${currentVariantId || index}`;

                        return (
                            <div key={uniqueKey} className="p-card" style={{ cursor: 'default' }}>
                                <div className="p-card-image" onClick={() => onViewProduct(product)} style={{ cursor: 'pointer' }}>
                                    <img src={product.images?.[0]?.imageUrl || product.img} alt={product.productName || product.name} />
                                    {/* Delete Option (Trash) - Newly Added near product */}
                                    <button
                                        className="p-delete-btn"
                                        onClick={(e) => { e.stopPropagation(); handleRemove(product); }}
                                        style={{
                                            position: 'absolute',
                                            top: '15px',
                                            left: '15px',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            zIndex: 15
                                        }}
                                        title="Delete from wishlist"
                                    >
                                        <Trash2 size={16} color="#7C3225" />
                                    </button>
                                </div>
                                <div className="p-card-info">
                                    <h3 onClick={() => onViewProduct(product)} style={{ cursor: 'pointer' }}>{product.productName || product.name}</h3>
                                    {(product.productDescription || product.desc) && (
                                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px', marginBottom: '12px', lineHeight: '1.4' }}>
                                            {product.productDescription || product.desc}
                                        </p>
                                    )}
                                    
                                    {/* Variant Selector */}
                                    {product.variants && product.variants.length > 1 && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>
                                                Variant:
                                            </label>
                                            <select
                                                value={currentVariantId}
                                                onChange={(e) => handleVariantChange(product.wishlistItemId, parseInt(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    fontSize: '0.85rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    color: '#333',
                                                    backgroundColor: '#fff',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {product.variants.map(variant => (
                                                    <option key={variant.id} value={variant.id}>
                                                        {variant.variantName} - ₹{Math.round(variant.price)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {product.variants && product.variants.length === 1 && (
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
                                            <span>{product.variants[0].variantName}</span>
                                        </div>
                                    )}

                                    <div className="p-card-footer" style={{ marginTop: 'auto' }}>
                                        <div className="p-price-block">
                                            <div className="p-price-row">
                                                <span className="p-mrp">₹{Math.round((displayPrice || product.mrp || product.price * 1.2))}</span>
                                                <span className="p-price">₹{Math.round(displayPrice || product.price)}</span>
                                            </div>
                                        </div>
                                        <button
                                            className={`p-view-btn btn-product ${addedIds.includes(`${product.productId || product.id}-${currentVariantId}`) ? 'is-added' : ''}`}
                                            onClick={() => handleAddToCart(product)}
                                            style={{ display: 'flex', gap: '8px' }}
                                        >
                                            <ShoppingCart size={16} /> {addedIds.includes(`${product.productId || product.id}-${currentVariantId}`) ? 'VIEW CART' : 'ADD TO CART'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;
