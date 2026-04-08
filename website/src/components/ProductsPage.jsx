import React, { useState } from "react";
import { Search, Star, Heart, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";

// Determine if a product should be treated as completely out of stock
const isProductOutOfStock = (product) => {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const isVariantAvailable = (v) => {
    const qty = typeof v.stockQuantity === "number" ? v.stockQuantity : null;
    if (v.availabilityStatus === "OUT_OF_STOCK") return false;
    if (qty !== null && qty <= 0) return false;
    return true;
  };

  if (variants.length > 0) {
    // Only mark product as out of stock if *all* variants are unavailable
    return !variants.some(isVariantAvailable);
  }

  const v = product.selectedVariant || {};
  const qty = typeof v.stockQuantity === "number" ? v.stockQuantity : null;

  if (v.availabilityStatus === "OUT_OF_STOCK") return true;
  if (qty !== null && qty <= 0) return true;

  const productQty = typeof product.stockQuantity === "number" ? product.stockQuantity : null;
  if (product.availabilityStatus === "OUT_OF_STOCK") return true;
  if (productQty !== null && productQty <= 0) return true;

  return false;
};

// IMPORTANT: This component must be top-level (not nested inside ProductsPage).
// If it's nested, React remounts it on every ProductsPage render, which resets scrollLeft.
const CategorySection = ({ title, products, onViewProduct, onToggleWishlist, wishlist, cart, onAddToCart, onUpdateQuantity }) => {
  const scrollRef = React.useRef(null);

  // Determine if arrows should be shown
  const showArrows = products.length > 3;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="category-section">
      <h2 className="category-section-title">{title}</h2>
      <div className="products-slider-container">
        {showArrows && (
          <button className="slider-arrow left" onClick={() => scroll('left')}>
            <ChevronLeft size={24} />
          </button>
        )}
        <div className={`products-page-grid ${!showArrows ? 'left-aligned' : ''}`} ref={scrollRef}>
          {products.map((product) => {
            const hasSingleVariant = Array.isArray(product.variants) && product.variants.length === 1;
            const singleVariant = hasSingleVariant ? product.variants[0] : null;
            const singleVariantId = singleVariant ? (singleVariant.id || singleVariant.variantId || singleVariant.variant_id) : null;

            const cartItem = singleVariantId && Array.isArray(cart)
              ? cart.find((item) => {
                  const itemVariantId = item.variantId || item.id || item.cartItemId;
                  return String(itemVariantId) === String(singleVariantId);
                })
              : null;

            return (
            <div className="p-card-vertical" key={product.id}>
              <div className="p-card-image" onClick={() => onViewProduct(product)} style={{ cursor: 'pointer' }}>
                <img src={product.img} alt={product.name} />
                {product.badgeLeft && (
                  <span className="p-badge left-badge">{product.badgeLeft}</span>
                )}
                {product.badgeRight && (
                  <span
                    className={`p-badge right-badge ${product.badgeRight === "PREMIUM" ? "premium" : ""}`}
                  >
                    {product.badgeRight}
                  </span>
                )}
                <button
                  className={`p-wishlist-btn ${wishlist?.some(item => item.id === product.id) ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                >
                  <Heart
                    size={18}
                    fill={wishlist?.some(item => item.id === product.id) ? "#7C3225" : "none"}
                    color={wishlist?.some(item => item.id === product.id) ? "#7C3225" : "#4A4A4A"}
                  />
                </button>
                {product.isActive === false && (
                  <div className="p-out-of-stock-label">
                    Not Available
                  </div>
                )}
                {product.isActive !== false && isProductOutOfStock(product) && (
                  <div className="p-out-of-stock-label">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="p-card-info">
                <div className="p-card-meta">
                  <span className="p-cat">{(typeof product.category === 'string' ? product.category : (product.category?.name || 'Product')).toUpperCase()}</span>
                  <span className="p-rating">
                    <Star size={12} fill="#FFC107" color="#FFC107" />{" "}
                    {product.rating}
                  </span>
                </div>
                <h3 className="p-title">{product.name}</h3>
                <p className="p-desc">{product.desc}</p>
                
                <div className="p-card-footer">
                  <div className="p-price-block">
                    <div className="p-price-row">
                      <span className="p-mrp">₹{Math.round(product.mrp || product.price * 1.2)}</span>
                      <span className="p-price">₹{product.price}</span>
                    </div>
                    {(!isProductOutOfStock(product) && product.selectedVariant?.stockQuantity > 0 && product.selectedVariant?.stockQuantity <= 10) && (
                      <div className="p-stock-warning">
                        <small>Only {product.selectedVariant.stockQuantity} left!</small>
                      </div>
                    )}
                  </div>
                  <div className="p-card-buttons">
                    {/* Inactive products: show Not Available button */}
                    {product.isActive === false ? (
                      <button className="p-view-btn" disabled style={{ backgroundColor: '#888', cursor: 'not-allowed' }}>
                        Not Available
                      </button>
                    ) : (
                      /* Single-variant products: show Add to Cart, then quantity controls once added */
                      hasSingleVariant && !isProductOutOfStock(product) ? (
                        cartItem && onUpdateQuantity ? (
                          <div className="p-qty-controls">
                            <button
                              className="quantity-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1);
                              }}
                              disabled={cartItem.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="quantity">{cartItem.quantity}</span>
                            <button
                              className="quantity-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="p-view-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product, singleVariant, 1);
                            }}
                            style={{ backgroundColor: '#1AA60B', color: '#fff' }}
                          >
                            Add to Cart
                          </button>
                        )
                      ) : (
                        <button className="p-view-btn" onClick={() => onViewProduct(product)}>
                          View Details
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
          })}
        </div>
        {showArrows && (
          <button className="slider-arrow right" onClick={() => scroll('right')}>
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

// Products are now fetched from API and passed via props.
const ProductsPage = ({ activeCategory, setActiveCategory, onViewProduct, searchQuery, setSearchQuery, wishlist, onToggleWishlist, products = ["All"], categories = ["All"], cart = [], onAddToCart, onUpdateQuantity }) => {

  const groupedProducts = categories.filter(c => c !== "All").reduce((acc, cat) => {
    const filtered = products.filter(p => (p.category === cat || (p.category?.name === cat)) && p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {});

  return (
    <div className="products-page">
      {/* Header Area */}
      <div className="products-page-header">
        <h1 className="products-page-title">Our Products</h1>
        <div className="title-divider">
          <span className="diamond"></span>
        </div>
        <p className="products-page-subtitle">
          Browse our collection of premium, naturally sourced products.
        </p>
      </div>

      {/* Grouped Products */}
      <div className="products-sections-wrapper">
        {activeCategory === "All" ? (
          Object.entries(groupedProducts).map(([cat, products]) => (
            <CategorySection
              key={cat}
              title={`${cat} Collection`}
              products={products}
              onViewProduct={onViewProduct}
              onToggleWishlist={onToggleWishlist}
              wishlist={wishlist}
              cart={cart}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))
        ) : (
          <CategorySection
            title={`${activeCategory} Selection`}
            products={products.filter(p => (p.category === activeCategory || p.category?.name === activeCategory) && p.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
            onViewProduct={onViewProduct}
            onToggleWishlist={onToggleWishlist}
            wishlist={wishlist}
            cart={cart}
            onAddToCart={onAddToCart}
            onUpdateQuantity={onUpdateQuantity}
          />
        )}
      </div>

      {/* Coming Soon Section */}
      <section className="coming-soon-section text-center">
        <h2 className="coming-soon-title">Coming Soon</h2>
        <div className="title-divider-white" style={{ marginBottom: '15px' }}>
          <span className="diamond-white"></span>
        </div>
        <p className="coming-soon-subtitle-new">Exciting New Products Launching Soon</p>

        <div className="coming-soon-grid-new">
          <div className="coming-card-new">
            <img src="/4a.jpg" alt="Healthy Bowls" className="coming-img-new" />
            <div className="coming-card-content">
              <h3 className="coming-title-new">Healthy Bowls</h3>
              <div className="card-divider-new"></div>
              <p className="coming-desc-new">Pure &amp; Unprocessed</p>
            </div>
            <button className="btn-product coming-btn" style={{ backgroundColor: '#2e6b27' }}>View Product &gt;</button>
          </div>
          <div className="coming-card-new">
            <img src="/4b.jpg" alt="Cold Pressed Juice" className="coming-img-new" />
            <div className="coming-card-content">
              <h3 className="coming-title-new">Cold Pressed Juice</h3>
              <div className="card-divider-new"></div>
              <p className="coming-desc-new">Crunchy &amp; Nutritious</p>
            </div>
            <button className="btn-product coming-btn" style={{ backgroundColor: '#b5580a' }}>View Product &gt;</button>
          </div>
        </div>
      </section>

      {/* Heritage Banner */}
      <section className="heritage-banner-section">
        <h2 className="heritage-banner-text">"Purity is not just a claim, it's our heritage."</h2>
      </section>
    </div>
  );
};

export default ProductsPage;
