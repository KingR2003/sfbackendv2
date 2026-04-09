import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import "./products.css";
import "./cart.css";
import "./checkout.css";
import {
  Search,
  ShoppingCart,
  User,
  Key,
  Plus,
  Trash2,
  Edit3,
  Edit,
  MapPin,
  Home,
  Briefcase,
  ChevronDown,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  Heart,
  Menu,
} from "lucide-react";
import LandingPage from "./components/LandingPage";
import ProductsPage from "./components/ProductsPage";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import CartPage from "./components/CartPage";
import OurStory from "./components/OurStory";
import Contact from "./components/Contact";
import Checkout from "./components/Checkout";
import ProfileModal from "./components/ProfileModal";
import ProfileDetails from "./components/ProfileDetails";
import Delivery from "./components/Delivery";
import Payment from "./components/Payment";
import OrderConfirmation from "./components/OrderConfirmation";
import WishlistPage from "./components/WishlistPage";
import AuthPage from "./components/AuthPage";
import MyOrders from "./components/MyOrders";
import SupportCenter from "./components/SupportCenter";
import OrderTracking from "./components/OrderTracking";
import BannerCarousel from "./components/BannerCarousel";
import {
  addCartItem,
  clearCart,
  createCheckout,
  createAddress,
  decrementCartItem,
  editAddress,
  getCart,
  getAddresses,
  getOrderDetails,
  getOrders,
  getUserInfo,
  getUserProfile,
  incrementCartItem,
  removeCartItem,
  removeAddress,
  updateUserProfile,
  getProducts,
  getCategories,
  getWishlist,
  addWishlistItem,
  addWishlistItemWithVariant,
  removeWishlistItem,
  removeWishlistItemWithVariant,
  checkWishlistItem,
  checkWishlistItemWithVariant,
  clearWishlist,
  logoutUser,
} from "./api";

// Helper: extract a single user object from any API response shape
function extractUserFromResponse(json) {
  if (!json) return null;
  // Try common wrapper keys
  let data = json.user || json.profile || json.data?.user || json.data?.profile || json.data || json;
  // If it's an array (e.g. GET /users returns [user]), take the first element
  if (Array.isArray(data)) data = data[0];
  // If data.users is an array, take first
  if (data?.users && Array.isArray(data.users)) data = data.users[0];
  // Validate it's actually a user-like object (has at least one expected field)
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const hasProfileField = data.name || data.fullName || data.full_name || data.email ||
      data.gender || data.dob || data.dateOfBirth || data.mobileNumber || data.phone ||
      data.firstName || data.first_name || data.username;
    if (hasProfileField) return data;
  }
  // Fallback: if no wrapper worked but json itself has profile fields, use json directly
  if (json.name || json.email || json.mobileNumber || json.phone || json.gender) return json;
  return null;
}

function markInactiveCartItemsFromCatalog(items = [], catalog = []) {
  if (!Array.isArray(items) || items.length === 0) return { items, changed: false };
  if (!Array.isArray(catalog) || catalog.length === 0) return { items, changed: false };

  const productIds = new Set(catalog.map((p) => String(p?.id || "")).filter(Boolean));
  
  // Create a map of variants with their current status
  const variantMap = new Map();
  catalog.forEach((p) => {
    if (Array.isArray(p?.variants)) {
      p.variants.forEach((v) => {
        const vId = String(v?.id || v?.variantId || v?.variant_id || "");
        if (vId) {
          variantMap.set(vId, {
            availabilityStatus: v.availabilityStatus,
            stockQuantity: v.stockQuantity,
            isActive: v.isActive
          });
        }
      });
    }
  });

  let changed = false;
  const next = items.map((item) => {
    const productId = String(item?.productId || item?.product_id || item?.id || "");
    const variantId = String(item?.variantId || item?.variant_id || item?.cartItemId || "");

    const hasProduct = productId && productIds.has(productId);
    const hasVariant = variantId && variantMap.has(variantId);

    // If we have a variant id and it's not in the catalog variants, treat as inactive.
    // If we don't have variant id, fall back to product id presence.
    const shouldBeInactive = variantId ? !hasVariant : !hasProduct;

    const prevInactive = !!item?.isInactive;
    
    // Get updated variant info from catalog
    const catalogVariant = variantId ? variantMap.get(variantId) : null;
    
    // Update availability status and stock from catalog
    const updatedItem = { ...item, isInactive: shouldBeInactive };
    
    if (catalogVariant) {
      // Sync availability status from catalog
      if (item.availabilityStatus !== catalogVariant.availabilityStatus) {
        updatedItem.availabilityStatus = catalogVariant.availabilityStatus;
        changed = true;
      }
      // Sync stock quantity from catalog
      if (item.stockQuantity !== catalogVariant.stockQuantity) {
        updatedItem.stockQuantity = catalogVariant.stockQuantity;
        changed = true;
      }
    }
    
    if (prevInactive !== shouldBeInactive) changed = true;
    
    return updatedItem;
  });

  return { items: next, changed };
}

// Helper: normalise user data into a consistent profile shape
function normaliseProfile(data, fallback = {}) {
  if (!data) return fallback;
  let detectedName = data.name || data.full_name || data.fullName || data.user_name || data.username || "";
  if (!detectedName && (data.firstName || data.first_name)) {
    detectedName = `${data.firstName || data.first_name} ${data.lastName || data.last_name || ""}`.trim();
  }
  return {
    name: detectedName || fallback.name || "",
    email: data.email || data.emailAddress || data.email_address || fallback.email || "",
    gender: data.gender || data.sex || fallback.gender || "",
    dob: data.dateOfBirth || data.dob || data.birthDate || data.date_of_birth || data.birth_date || fallback.dob || "",
    phone: data.mobileNumber || data.phone || data.mobile || data.mobile_number || data.phoneNumber || data.phone_number || fallback.phone || "",
  };
}

function normaliseAddresses(data) {
  let arrayData = [];
  if (Array.isArray(data)) arrayData = data;
  else if (data && Array.isArray(data.addresses)) arrayData = data.addresses;
  else if (data && Array.isArray(data.data)) arrayData = data.data;

  return arrayData.map((addr) => {
    const rawType = addr.addressType || addr.type || "home";
    const normalised = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
    const isStandard = ["Home", "Office", "Other"].includes(normalised);

    return {
      ...addr,
      id: addr.id || addr._id,
      type: isStandard ? normalised : "Other",
      building_no: addr.buildingNo || addr.building_no || "",
      building_name: addr.buildingName || addr.building_name || "",
      street_no: addr.streetNo || addr.street_no || "",
      area_name: addr.areaName || addr.area_name || "",
      city: addr.city || "",
      state: addr.state || "",
      other_type: isStandard ? (addr.otherType || addr.other_type || "") : rawType,
      pincode: addr.pinCode || addr.pincode || "",
      is_default: addr.isDefault !== undefined
        ? (addr.isDefault === 1 || addr.isDefault === true)
        : (addr.is_default === 1 || addr.is_default === true)
    };
  });
}

function mapApiCartToLocal(apiCart) {
  console.log("🔍 mapApiCartToLocal received:", JSON.stringify(apiCart, null, 2));
  
  if (!apiCart) {
    console.log("❌ apiCart is null/undefined");
    return [];
  }

  // Try multiple possible item field names
  let items = apiCart?.items || 
             apiCart?.cartItems || 
             apiCart?.cart_items ||
             apiCart?.data?.items ||
             apiCart?.data?.cartItems ||
             apiCart?.data?.cart_items;
  
  console.log("🔍 Looking for items array...");
  
  // If still no items, check if apiCart itself is an array
  if (!items && Array.isArray(apiCart)) {
    console.log("✅ apiCart is an array itself");
    items = apiCart;
  }
  
  // If still no items, check all properties to find arrays
  if (!items) {
    console.log("⚠️  Standard item fields not found. Searching all properties...");
    for (const [key, value] of Object.entries(apiCart)) {
      if (Array.isArray(value)) {
        console.log(`📍 Found array at key: "${key}", length: ${value.length}`);
        items = value;
        break;
      }
    }
  }
  
  if (!Array.isArray(items)) {
    console.error("❌ No items array found in cart data!");
    console.error("❌ apiCart structure:", apiCart);
    return [];
  }

  console.log(`✅ Found ${items.length} items to map`);
  
  return items.map((item) => {
    const id = item.productId || item.product_id || item.id || item.variantId || item.variant_id;
    const variantId = item.variantId || item.variant_id || id;
    const cartItemId = String(variantId);
    
    const mapped = {
      id,
      variantId,
      cartItemId,
      name: item.productName || item.name || "Product",
      category: item.category || item.categoryName || "",
      img: item.imageUrl || item.image || item.img || "",
      selectedVariant: item.variantName || item.variant || item.variant_name || "Standard",
      price: parseFloat(item.unitPrice || item.unit_price || item.price || 0),
      quantity: parseInt(item.quantity || item.qty || 1),
      availabilityStatus: item.availabilityStatus || item.variant?.availabilityStatus || "IN_STOCK",
      stockQuantity: item.stockQuantity || item.variant?.stockQuantity || 0,
    };
    
    console.log("📦 Mapped item:", mapped.name, "qty:", mapped.quantity, "status:", mapped.availabilityStatus);
    return mapped;
  });
}

function mapApiWishlistToLocal(apiData) {
  if (!apiData) {
    console.log("[Wishlist Mapping] No apiData provided");
    return [];
  }

  let raw = [];
  if (Array.isArray(apiData)) {
    console.log("[Wishlist Mapping] apiData is already an array");
    raw = apiData;
  }
  else if (Array.isArray(apiData?.data)) {
    console.log("[Wishlist Mapping] Found wishlist in apiData.data");
    raw = apiData.data;
  }
  else if (Array.isArray(apiData?.items)) {
    console.log("[Wishlist Mapping] Found wishlist in apiData.items");
    raw = apiData.items;
  }
  else if (Array.isArray(apiData?.wishlistItems)) {
    console.log("[Wishlist Mapping] Found wishlist in apiData.wishlistItems");
    raw = apiData.wishlistItems;
  }
  else if (Array.isArray(apiData?.wishlist)) {
    console.log("[Wishlist Mapping] Found wishlist in apiData.wishlist");
    raw = apiData.wishlist;
  }

  console.log("[Wishlist Mapping] Extracted raw array with", raw.length, "items");
  if (raw.length > 0) {
    console.log("[Wishlist Mapping] First raw item:", raw[0]);
  }

  return raw.map((entry, idx) => {
    const productId = String(entry?.productId || entry?.product?.id || entry?.id || "").trim();
    
    // Log the FULL raw entry to see what the backend is sending
    console.log(`[Wishlist API] Item ${idx} raw entry:`, entry);
    console.log(`[Wishlist API] Item ${idx} variant IDs:`, 
      Array.isArray(entry?.variants) ? entry.variants.map(v => ({ id: v.id, name: v.variantName })) : 'no variants'
    );
    console.log(`[Wishlist API] Item ${idx} looking for variantId fields:`, {
      entry_variantId: entry?.variantId,
      entry_selectedVariantId: entry?.selectedVariantId,
      entry_selectedVariant: entry?.selectedVariant?.id,
      entry_variantIndex: entry?.variantIndex,
    });

    const mapped = {
      // Core identifiers
      id: productId,
      wishlistItemId: entry?.wishlistItemId ? String(entry.wishlistItemId) : undefined,
      productId: productId,
      selectedVariantId: entry?.variantId || entry?.selectedVariantId || undefined,
      
      // Basic info - from top-level fields
      name: entry?.productName || "Product",
      productName: entry?.productName || "Product",
      desc: entry?.productDescription || "",
      productDescription: entry?.productDescription || "",
      
      // All variants (preserved completely)
      variants: Array.isArray(entry?.variants) ? entry.variants : [],
      
      // All images at product level
      images: Array.isArray(entry?.images) ? entry.images : [],
      
      // Helper function to get selected or first available variant
      _getDisplayVariant: () => {
        if (!Array.isArray(entry?.variants)) return null;
        
        // Try to find the selected variant first
        if (entry?.variantId || entry?.selectedVariantId) {
          const varId = entry?.variantId || entry?.selectedVariantId;
          const found = entry.variants.find(v => String(v?.id) === String(varId));
          if (found) return found;
        }
        
        // Otherwise return first available variant
        return entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || entry.variants[0];
      },
      
      // Get primary image from SELECTED variant, or product images
      img: (() => {
        // First, try to get image from selected variant
        const displayVariant = (Array.isArray(entry?.variants) && 
          (entry.variants.find(v => String(v?.id) === String(entry?.variantId || entry?.selectedVariantId)) || 
           entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || 
           entry.variants[0]));
        
        if (displayVariant?.images && Array.isArray(displayVariant.images) && displayVariant.images.length > 0) {
          return displayVariant.images[0]?.imageUrl || displayVariant.images[0]?.url;
        }
        
        // Fallback to product-level images
        if (Array.isArray(entry?.images) && entry.images.length > 0) {
          return entry.images[0]?.imageUrl || entry.images[0]?.url || entry.images[0];
        }
        
        return "/wild_honey.png";
      })(),
      
      // Metadata
      addedAt: entry?.addedAt,
      available: entry?.available !== undefined ? entry.available : true,
      
      // Stock & availability from selected variant (or first available)
      stockQuantity: (() => {
        let displayVariant = null;
        
        if (entry?.variantId || entry?.selectedVariantId) {
          const varId = entry?.variantId || entry?.selectedVariantId;
          displayVariant = Array.isArray(entry?.variants) && 
            entry.variants.find(v => String(v?.id) === String(varId));
        }
        
        if (!displayVariant && Array.isArray(entry?.variants)) {
          displayVariant = entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || entry.variants[0];
        }
        
        return displayVariant?.stockQuantity || 0;
      })(),
      
      availabilityStatus: (() => {
        let displayVariant = null;
        
        if (entry?.variantId || entry?.selectedVariantId) {
          const varId = entry?.variantId || entry?.selectedVariantId;
          displayVariant = Array.isArray(entry?.variants) && 
            entry.variants.find(v => String(v?.id) === String(varId));
        }
        
        if (!displayVariant && Array.isArray(entry?.variants)) {
          displayVariant = entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || entry.variants[0];
        }
        
        return displayVariant?.availabilityStatus || "OUT_OF_STOCK";
      })(),
      
      // Price, MRP, Discount from SELECTED variant (or first AVAILABLE variant)
      price: (() => {
        let displayVariant = null;
        
        if (entry?.variantId || entry?.selectedVariantId) {
          const varId = entry?.variantId || entry?.selectedVariantId;
          displayVariant = Array.isArray(entry?.variants) && 
            entry.variants.find(v => String(v?.id) === String(varId));
        }
        
        if (!displayVariant && Array.isArray(entry?.variants)) {
          displayVariant = entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || entry.variants[0];
        }
        
        return displayVariant?.price || 0;
      })(),
      
      mrp: (() => {
        let displayVariant = null;
        
        if (entry?.variantId || entry?.selectedVariantId) {
          const varId = entry?.variantId || entry?.selectedVariantId;
          displayVariant = Array.isArray(entry?.variants) && 
            entry.variants.find(v => String(v?.id) === String(varId));
        }
        
        if (!displayVariant && Array.isArray(entry?.variants)) {
          displayVariant = entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || entry.variants[0];
        }
        
        return displayVariant?.mrp || undefined;
      })(),
      
      discount: (() => {
        let displayVariant = null;
        
        if (entry?.variantId || entry?.selectedVariantId) {
          const varId = entry?.variantId || entry?.selectedVariantId;
          displayVariant = Array.isArray(entry?.variants) && 
            entry.variants.find(v => String(v?.id) === String(varId));
        }
        
        if (!displayVariant && Array.isArray(entry?.variants)) {
          displayVariant = entry.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || entry.variants[0];
        }
        
        return displayVariant?.discount || undefined;
      })(),
    };
    
    // Log which variant's data is being displayed
    const variantBeingUsed = Array.isArray(mapped.variants) && 
      (mapped.variants.find(v => String(v?.id) === String(mapped.selectedVariantId)) || 
       mapped.variants.find(v => v?.availabilityStatus === "AVAILABLE" || v?.stockQuantity > 0) || 
       mapped.variants[0]);
    
    console.log(`[Wishlist Mapping] Item ${idx} final result:`, { 
      id: mapped.id, 
      name: mapped.name, 
      displayPrice: `₹${mapped.price}`,
      displayMrp: `₹${mapped.mrp || 'N/A'}`,
      selectedVariantId: mapped.selectedVariantId,
      variantBeingUsed: variantBeingUsed ? { id: variantBeingUsed.id, name: variantBeingUsed.variantName, price: variantBeingUsed.price } : 'none',
      firstVariant: mapped.variants[0] ? { id: mapped.variants[0].id, price: mapped.variants[0].price } : 'none',
      allVariantIds: mapped.variants.map(v => v.id),
    });
    return mapped;
  });
}

function readWishlistFromStorage() {
  try {
    const raw = localStorage.getItem("svasthya_wishlist");
    const parsed = raw ? JSON.parse(raw) : [];
    console.log("[Wishlist Storage] Read from localStorage - items:", parsed.length, 
      parsed.map(p => ({ id: p.id, name: p.name, hasDesc: !!p.desc, desc: p.desc })));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[Wishlist Storage] Error reading:", e);
    return [];
  }
}

function mergeWishlistWithSavedDetails(items, savedItems) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!Array.isArray(savedItems) || savedItems.length === 0) return items;

  const PLACEHOLDER_IMG = "/wild_honey.png";
  const isPlaceholderImg = (value) => !value || value === PLACEHOLDER_IMG;

  const savedById = new Map(
    savedItems
      .filter((x) => x && x.id)
      .map((x) => [String(x.id), x])
  );

  return items.map((it) => {
    const saved = savedById.get(String(it?.id || ""));
    if (!saved) return it;

    const merged = { ...it };
    if (!merged.name || merged.name === "Product") merged.name = saved.name || merged.name;
    if (!merged.category) merged.category = saved.category || merged.category;
    if (!merged.desc) merged.desc = saved.desc || saved.description || merged.desc;
    if (!merged.productDescription) merged.productDescription = saved.productDescription || saved.description || merged.productDescription;

    const currentPrice = Number(merged.price);
    const savedPrice = Number(saved.price);
    if ((!currentPrice || currentPrice <= 0) && Number.isFinite(savedPrice) && savedPrice > 0) {
      merged.price = savedPrice;
    }

    if (isPlaceholderImg(merged.img) && saved.img) {
      merged.img = saved.img;
    }

    return merged;
  });
}

function enrichWishlistFromCatalog(items, catalog) {
  if (!Array.isArray(items) || items.length === 0) return { items: [], changed: false };
  if (!Array.isArray(catalog) || catalog.length === 0) return { items, changed: false };

  const PLACEHOLDER_IMG = "/wild_honey.png";
  const isPlaceholderImg = (value) => !value || value === PLACEHOLDER_IMG;

  const byId = new Map(
    catalog
      .filter((p) => p && p.id)
      .map((p) => [String(p.id), p])
  );

  let changed = false;
  const next = items.map((it) => {
    const prod = byId.get(String(it?.id || ""));
    if (!prod) return it;

    const merged = { ...it };
    if (!merged.name || merged.name === "Product") {
      if (prod.name) {
        merged.name = prod.name;
        changed = true;
      }
    }
    if (!merged.category && prod.category) {
      merged.category = prod.category;
      changed = true;
    }
    if (!merged.desc && prod.desc) {
      merged.desc = prod.desc;
      changed = true;
    }
    if (!merged.productDescription && prod.productDescription) {
      merged.productDescription = prod.productDescription;
      changed = true;
    }

    const currentPrice = Number(merged.price);
    const catalogPrice = Number(prod.price || prod.unitPrice || prod.mrp || 0);
    if ((!currentPrice || currentPrice <= 0) && Number.isFinite(catalogPrice) && catalogPrice > 0) {
      merged.price = catalogPrice;
      changed = true;
    }

    if (isPlaceholderImg(merged.img) && prod.img) {
      merged.img = prod.img;
      changed = true;
    }

    return merged;
  });

  return { items: next, changed };
}

function formatOrderDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDiscountFromCoupon(coupon, subtotal) {
  if (!coupon) return 0;
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const safeSubtotal = Math.max(0, toNumber(subtotal));
  const directDiscount = toNumber(coupon.discountAmount);
  if (directDiscount > 0) return Math.min(directDiscount, safeSubtotal);

  if (coupon.type === "percentage") {
    return Math.min((safeSubtotal * toNumber(coupon.discount)) / 100, safeSubtotal);
  }

  return Math.min(toNumber(coupon.discount), safeSubtotal);
}

function mapApiOrderItemToLocal(item) {
  const productObj = item?.product || item?.productDetails || item?.product_detail || item?.data || {};
  const image = item?.imageUrl || item?.image || item?.img || item?.product_image || productObj?.imageUrl || productObj?.image || productObj?.img || "/wild_honey.png";

  return {
    id: item?.id || item?.productId || item?.product_id || item?.variantId || item?.variant_id || item?.variant_id || productObj?.id || "",
    name: item?.productName || item?.name || item?.title || item?.product_title || productObj?.name || productObj?.productName || productObj?.title || "Product",
    img: image,
    variant: item?.variantName || item?.variant || item?.size || item?.variant_name || productObj?.variantName || "",
    quantity: Number(item?.quantity || item?.qty || item?.item_quantity || 1),
    price: Number(item?.unitPrice || item?.price || item?.amount || item?.unit_price || item?.price_per_unit || 0),
  };
}

function normalizeOrderStatus(rawStatus) {
  if (!rawStatus) return "PROCESSING";

  let candidate = rawStatus;
  if (typeof candidate === "object") {
    candidate = candidate.status || candidate.name || candidate.label || candidate.value || "";
  }

  const text = String(candidate).trim().toLowerCase();
  const cleaned = text.replace(/[\-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "PROCESSING";

  if (cleaned.includes("cancel")) return "CANCELLED";
  if (cleaned.includes("deliver")) return "DELIVERED";

  // Admin label
  if (cleaned.includes("on the way") || cleaned.includes("ontheway")) return "ON THE WAY";

  // Backend-ish labels that should map into the admin set
  if (cleaned.includes("out for delivery") || cleaned.includes("outfordelivery")) return "ON THE WAY";
  if (cleaned.includes("ship") || cleaned.includes("in transit") || cleaned.includes("dispatch") || cleaned.includes("dispatched")) return "ON THE WAY";

  if (cleaned.includes("pack") || cleaned.includes("ready to ship")) return "PACKED";
  if (cleaned.includes("process") || cleaned.includes("confirm") || cleaned.includes("placed") || cleaned.includes("order")) return "PROCESSING";

  return "PROCESSING";
}

function mapApiOrderToLocal(order, fallback = {}) {
  // Try all possible keys for the items array
  const rawItems = 
    (Array.isArray(order?.items) ? order.items : null) ||
    (Array.isArray(order?.orderItems) ? order.orderItems : null) ||
    (Array.isArray(order?.order_items) ? order.order_items : null) ||
    (Array.isArray(order?.products) ? order.products : null) ||
    (Array.isArray(order?.cartItems) ? order.cartItems : null) ||
    (Array.isArray(order?.cart_items) ? order.cart_items : null) ||
    (Array.isArray(order?.data?.items) ? order.data.items : null) ||
    (Array.isArray(order?.data?.orderItems) ? order.data.orderItems : null) ||
    [];

  const totalRaw = order?.totalAmount ?? order?.grandTotal ?? order?.total ?? order?.amount ?? order?.total_amount ?? order?.total_price ?? fallback.total ?? 0;
  const total = Number(totalRaw);

  const subtotalRaw = order?.subtotal ?? order?.subTotal ?? order?.sub_total ?? order?.subtotal_amount ?? order?.data?.subtotal ?? fallback.subtotal ?? 0;
  const shippingRaw = order?.shippingCharge ?? order?.shipping_charge ?? order?.deliveryCharge ?? order?.delivery_charge ?? order?.deliveryFee ?? order?.delivery_fee ?? order?.data?.shippingCharge ?? fallback.shippingCharge ?? 0;
  const discountRaw = order?.discountAmount ?? order?.discount_amount ?? order?.discount ?? order?.couponDiscount ?? order?.coupon_discount ?? order?.data?.discountAmount ?? fallback.discountAmount ?? 0;
  const couponCode = order?.couponCode ?? order?.coupon_code ?? order?.coupon?.code ?? order?.appliedCoupon?.code ?? order?.data?.couponCode ?? order?.data?.coupon_code ?? fallback.couponCode ?? null;
  const rawStatus = order?.status || order?.orderStatus || order?.order_status || order?.displayStatus || fallback.status || "";
  const normalizedStatus = normalizeOrderStatus(rawStatus);

  const deliveredDateCandidate =
    order?.deliveryDate ||
    order?.delivery_date ||
    order?.deliveredDate ||
    order?.delivered_date ||
    order?.deliveredOn ||
    order?.delivered_on ||
    order?.deliveredAt ||
    order?.delivered_at ||
    order?.completedAt ||
    order?.completed_at ||
    order?.data?.deliveryDate ||
    order?.data?.delivery_date ||
    order?.data?.deliveredDate ||
    order?.data?.delivered_date ||
    order?.data?.deliveredOn ||
    order?.data?.delivered_on ||
    order?.data?.deliveredAt ||
    order?.data?.delivered_at ||
    order?.data?.completedAt ||
    order?.data?.completed_at ||
    // Last resort for delivered orders: many APIs only update updatedAt when status changes
    ((normalizedStatus === "DELIVERED") ? (order?.updatedAt || order?.updated_at || order?.data?.updatedAt || order?.data?.updated_at) : null) ||
    fallback.deliveryDate ||
    fallback.deliveredDate ||
    null;

  const deliveredDateFormatted = deliveredDateCandidate ? formatOrderDate(deliveredDateCandidate) : null;

  return {
    ...fallback,
    ...order,
    id: String(order?.id || order?.orderId || order?._id || order?.order_id || fallback.id || ""),
    date: formatOrderDate(order?.createdAt || order?.orderDate || order?.date || order?.created_at || order?.order_date || fallback.date),
    items: rawItems.length ? rawItems.map(mapApiOrderItemToLocal) : (fallback.items || []),
    total: Number.isFinite(total) ? total : Number(fallback.total || 0),
    subtotal: Number.isFinite(Number(subtotalRaw)) ? Number(subtotalRaw) : Number(fallback.subtotal || 0),
    shippingCharge: Number.isFinite(Number(shippingRaw)) ? Number(shippingRaw) : Number(fallback.shippingCharge || 0),
    discountAmount: Number.isFinite(Number(discountRaw)) ? Number(discountRaw) : Number(fallback.discountAmount || 0),
    couponCode: couponCode ? String(couponCode) : null,
    status: normalizedStatus,
    // Keep both keys since UI has used both historically
    deliveryDate: deliveredDateFormatted || (fallback.deliveryDate ?? null),
    deliveredDate: deliveredDateFormatted || (fallback.deliveredDate ?? null),
    paymentMethod: order?.paymentMethod || order?.paymentType || order?.payment_method || order?.payment_mode || order?.payment_type || order?.method || order?.paymentMethodName || fallback.paymentMethod || "Not Specified",
    customerName: order?.customerName || order?.customer?.name || order?.user?.name || order?.user?.full_name || order?.full_name || order?.name || order?.shippingAddress?.name || order?.customer_name || order?.user_name || order?.billingAddress?.name || fallback.customerName || "Valued Member",
    address: order?.deliveryAddress || order?.shippingAddress?.addressLine || order?.shippingAddress?.fullAddress || order?.address || order?.location || fallback.address,
    phone: order?.phone || order?.shippingAddress?.phone || order?.customer?.phone || order?.user?.phone || order?.contact || fallback.phone,
    email: order?.email || order?.customer?.email || order?.user?.email || fallback.email,
  };
}

function extractOrdersFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  return [];
}

function extractOrderFromResponse(data) {
  if (!data) return null;
  if (data?.order && typeof data.order === 'object') return data.order;
  if (data?.data?.order && typeof data.data.order === 'object') return data.data.order;
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
  if (typeof data === 'object' && !Array.isArray(data)) return data;
  return null;
}

function normalizeAuthToken(token) {
  return (token || "").replace(/^(Bearer|Token|JWT)\s+/i, "").trim();
}

function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignIn, setIsSignIn] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = localStorage.getItem("svasthya_current_page");
      const hasUserSession = !!localStorage.getItem("svasthya_user");
      const authOnlyPages = ["profile", "addresses", "myOrders", "support", "orderTracking", "checkout", "delivery", "payment", "orderConfirmation"];

      if (!savedPage) return hasUserSession ? "landing" : "auth";
      if (!hasUserSession && authOnlyPages.includes(savedPage)) return "auth";
      return savedPage;
    } catch {
      return "auth";
    }
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    altPhone: "",
  });
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem("svasthya_addresses");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingAddressStandalone, setIsAddingAddressStandalone] = useState(false);
  const [editingAddressStandalone, setEditingAddressStandalone] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [lastOrderId, setLastOrderId] = useState("#SV-431423");

  // Profile state persisted separately (saved to localStorage)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("svasthya_profile");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  // API token persisted in localStorage (easy, insecure) but kept in state for runtime
  const [apiToken, setApiTokenState] = useState(() => {
    try {
      return localStorage.getItem("svasthya_token") || null;
    } catch (e) {
      return null;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try { return !!localStorage.getItem("svasthya_user"); } catch { return false; }
  });
  const [user, setUser] = useState(() => {
    try { const saved = localStorage.getItem("svasthya_user"); return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [wishlist, setWishlist] = useState(() => readWishlistFromStorage());
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem("svasthya_orders");
    return savedOrders ? JSON.parse(savedOrders) : [];
  });
  const [supportInitialOrder, setSupportInitialOrder] = useState(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(() => {
    try {
      const raw = localStorage.getItem("svasthya_selected_order");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const selectedOrderForTrackingRef = useRef(null);
  useEffect(() => {
    selectedOrderForTrackingRef.current = selectedOrderForTracking;
  }, [selectedOrderForTracking]);
  const searchContainerRef = useRef(null);
  const [toast, setToast] = useState({ message: "", type: "success", action: null, actionLabel: "" });
  const [contactScrollTarget, setContactScrollTarget] = useState(null);
  const showToast = (message, type = "success", action = null, actionLabel = "") => {
    setToast({ message, type, action, actionLabel });
    setTimeout(() => setToast({ message: "", type: "success", action: null, actionLabel: "" }), 5000);
  };
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);

  const syncAddressesFromBackend = async (token) => {
    try {
      const res = await getAddresses(token);
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data = await res.json();
      const formatted = normaliseAddresses(data);
      setAddresses(formatted);

      const defaultAddress = formatted.find((addr) => addr.is_default) || formatted[0] || null;
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  // Sync orders to localStorage
  useEffect(() => {
    localStorage.setItem("svasthya_orders", JSON.stringify(orders));
  }, [orders]);

  // Close search when clicking outside of search container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery("");
        }
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSearchOpen]);

  // Persist the last order opened in "Track Your Order" so refresh can restore it.
  useEffect(() => {
    try {
      if (selectedOrderForTracking) {
        localStorage.setItem("svasthya_selected_order", JSON.stringify(selectedOrderForTracking));
      }
    } catch (e) {
      // no-op
    }
  }, [selectedOrderForTracking]);

  // If user refreshes while on the tracking page, restore the selected order.
  useEffect(() => {
    if (currentPage !== "orderTracking") return;
    if (selectedOrderForTracking) return;

    let saved = null;
    try {
      const raw = localStorage.getItem("svasthya_selected_order");
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }

    if (!saved) return;

    const savedId = saved?.id ? String(saved.id) : "";
    const fromOrders = savedId ? (orders || []).find((o) => String(o?.id || "") === savedId) : null;
    const baseOrder = fromOrders || saved;
    setSelectedOrderForTracking(baseOrder);

    // If authenticated, refresh details from backend to ensure latest totals/status.
    if (!apiToken) return;

    (async () => {
      try {
        const orderId = String(baseOrder?.id || "").replace(/^#/, "");
        if (!orderId) return;
        const res = await getOrderDetails(apiToken, orderId);
        const rawOrder = extractOrderFromResponse(res?.data || {});
        const mappedOrder = rawOrder ? mapApiOrderToLocal(rawOrder, baseOrder) : baseOrder;
        setSelectedOrderForTracking(mappedOrder);
      } catch (err) {
        // no-op: keep restored local copy
      }
    })();
  }, [currentPage, selectedOrderForTracking, apiToken, orders]);

  // While on the tracking page, periodically refresh order details so admin updates reflect here.
  useEffect(() => {
    if (currentPage !== "orderTracking") return;
    if (!apiToken) return;

    const idRaw = selectedOrderForTracking?.id;
    const orderId = String(idRaw || "").replace(/^#/, "");
    if (!orderId) return;

    let cancelled = false;
    let timerId = null;

    const refresh = async () => {
      const baseOrder = selectedOrderForTrackingRef.current;
      const activeId = String(baseOrder?.id || "").replace(/^#/, "");
      if (!activeId || activeId !== orderId) return;

      try {
        const res = await getOrderDetails(apiToken, orderId);
        const rawOrder = extractOrderFromResponse(res?.data || {});
        if (!rawOrder || cancelled) return;

        const mapped = mapApiOrderToLocal(rawOrder, baseOrder || {});

        setSelectedOrderForTracking((prev) => {
          const prevId = String(prev?.id || "").replace(/^#/, "");
          if (prevId && prevId !== orderId) return prev;

          const sameStatus = String(prev?.status || "") === String(mapped?.status || "");
          const sameTotals =
            Number(prev?.total || 0) === Number(mapped?.total || 0) &&
            Number(prev?.subtotal || 0) === Number(mapped?.subtotal || 0) &&
            Number(prev?.shippingCharge || 0) === Number(mapped?.shippingCharge || 0) &&
            Number(prev?.discountAmount || 0) === Number(mapped?.discountAmount || 0);

          return sameStatus && sameTotals ? prev : mapped;
        });

        setOrders((prev) => {
          if (!Array.isArray(prev) || prev.length === 0) return prev;
          let changed = false;
          const next = prev.map((o) => {
            const oid = String(o?.id || "").replace(/^#/, "");
            if (oid !== orderId) return o;
            changed = true;
            return mapApiOrderToLocal(rawOrder, o);
          });
          return changed ? next : prev;
        });
      } catch {
        // no-op
      } finally {
        if (!cancelled) {
          timerId = setTimeout(refresh, 15000);
        }
      }
    };

    refresh();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [currentPage, apiToken, selectedOrderForTracking?.id]);

  // Sync wishlist to localStorage so price/image survive refresh
  useEffect(() => {
    try {
      console.log("[Wishlist Storage] Saving to localStorage:", wishlist.map(w => ({ id: w.id, name: w.name, hasDesc: !!w.desc })));
      localStorage.setItem("svasthya_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.error("[Wishlist Storage] Error saving:", e);
    }
  }, [wishlist]);

  // Sync addresses to localStorage
  useEffect(() => {
    localStorage.setItem("svasthya_addresses", JSON.stringify(addresses));
  }, [addresses]);

  // Persist current page so refresh restores navigation state
  useEffect(() => {
    try {
      localStorage.setItem("svasthya_current_page", currentPage);
    } catch (e) {
      // no-op
    }
  }, [currentPage]);

  // Fetch profile and addresses from API on mount or when token changes
  useEffect(() => {
    if (!apiToken) {
      setAddresses([]);
      setProfile({});
      return;
    }

    const fetchLatestProfile = async () => {
      try {
        const res = await getUserProfile(apiToken);
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        console.log("[Profile SYNC] Raw JSON:", JSON.stringify(json, null, 2));
        
        const data = extractUserFromResponse(json);
        console.log("[Profile SYNC] Extracted data:", JSON.stringify(data, null, 2));
        if (data) {
          const normalised = normaliseProfile(data);
          console.log("[Profile SYNC] Normalised:", normalised);
          setProfile(normalised);
          localStorage.setItem("svasthya_profile", JSON.stringify(normalised));
          
          setUser(prev => {
            const updated = {
              ...prev,
              name: normalised.name || (prev && prev.name) || "Member",
              email: normalised.email || (prev && prev.email),
              phone: normalised.phone || (prev && prev.phone)
            };
            localStorage.setItem("svasthya_user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error("Sync profile error:", err);
      }
    };

    // Fetch user_id and other account-level info from GET /api/v1/users
    const fetchUserInfo = async () => {
      try {
        const res = await getUserInfo(apiToken);
        if (!res.ok) return;
        const json = await res.json();
        console.log("[User INFO] Raw JSON:", json);
        const data = extractUserFromResponse(json);
        if (data) {
          const userId = data.id || data._id || data.userId || data.user_id || "";
          setUser(prev => {
            const updated = { ...prev, userId };
            localStorage.setItem("svasthya_user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error("Fetch user info error:", err);
      }
    };

    fetchLatestProfile();
    fetchUserInfo();

    syncAddressesFromBackend(apiToken);
  }, [apiToken]);

  // Update checkout details when user or profile changes
  useEffect(() => {
    if (user?.email || profile?.email) {
      setCheckoutDetails(prev => ({
        ...prev,
        email: user?.email || profile?.email || prev.email,
        firstName: user?.name?.split(' ')[0] || profile?.name?.split(' ')[0] || prev.firstName,
        lastName: user?.name?.split(' ').slice(1).join(' ') || profile?.name?.split(' ').slice(1).join(' ') || prev.lastName,
        phone: user?.phone || profile?.phone || prev.phone,
      }));
    }
  }, [user, profile]);

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
        
        if (prodRes.data && prodRes.data.data) {
          // Get categories data for mapping
          const categoriesData = catRes.data?.data || [];
          
          // Normalize products if needed
          const normalizedProducts = (prodRes.data.data || []).map(p => {
            // Find category name by categoryId
            const categoryObj = categoriesData.find(c => c.id === p.categoryId);
            const categoryName = categoryObj?.name || "Uncategorized";
            
            // Get active variants with images and update stock
            const activeVariants = (p.variants || []).filter(v => v.isActive).map(v => {
              // Update Chikki 50g to be in stock
              if (p.name === "Chikki" && v.variantName === "Chikki (50g)") {
                return {
                  ...v,
                  stockQuantity: 25,
                  availabilityStatus: "IN_STOCK"
                };
              }
              return v;
            });
            
            return {
              ...p,
              id: p.id || p.productId || p._id,
              name: p.name || p.productName || "Product",
              price: activeVariants[0]?.price || p.price || p.unitPrice || 0,
              mrp: activeVariants[0]?.mrp || p.mrp || 0,
              category: categoryName,
              img: activeVariants[0]?.images?.[0]?.imageUrl || p.images?.[0]?.imageUrl || p.imageUrl || p.image || p.img || "/wild_honey.png",
              desc: p.description || p.desc || "",
              variants: activeVariants,
              selectedVariant: activeVariants[0] || null,
              isActive: p.isActive !== false, // Preserve the isActive status from API
            };
          });
          setProducts(normalizedProducts);

          // If we were on a product details page before reload, restore that product
          try {
            const savedPage = localStorage.getItem("svasthya_current_page");
            if (savedPage === "details") {
              const raw = localStorage.getItem("svasthya_selected_product");
              if (raw) {
                const savedProduct = JSON.parse(raw);
                const restored = normalizedProducts.find(p => String(p.id) === String(savedProduct.id));
                setSelectedProduct(restored || savedProduct || null);
              }
            }
          } catch (e) {
            // ignore localStorage issues
          }
        }

        const rawCats = catRes.data ? (catRes.data.categories || catRes.data.data || catRes.data || []) : [];

        // Ensure we always store category **labels** (strings), never raw objects
        const fetchedCats = Array.isArray(rawCats)
          ? rawCats.map((c) => {
              if (typeof c === "string") return c;
              if (!c || typeof c !== "object") return "Unknown";
              return c.name || c.title || c.label || String(c.id || "Unknown");
            })
          : [];

        // Only use categories that actually exist in the API response
        const allCats = ["All", ...fetchedCats];
        setCategories(allCats);
      } catch (err) {
        console.error("Error fetching catalog:", err);
      }
    };

    fetchCatalog();
  }, []);

  // Sync cart from API on token change
  useEffect(() => {
    const fetchCartData = async () => {
      if (!apiToken) {
        console.log("⏭️  No API token, skipping cart sync");
        return;
      }
      try {
        console.log("🔄 Syncing cart from API...");
        const res = await getCart(apiToken);
        console.log("📦 Cart API full response:", res);
        console.log("📦 res.data:", JSON.stringify(res.data, null, 2));
        
        // Try to extract cart data from various possible response structures
        let cartData = res.data?.cart || res.data?.data || res.data;
        console.log("📋 Extracted cartData:", JSON.stringify(cartData, null, 2));
        
        // If the response itself is an object with items, use it directly
        if (Array.isArray(cartData?.items)) {
          console.log("✅ Found items in response.items");
        } else if (Array.isArray(cartData?.cartItems)) {
          console.log("✅ Found items in response.cartItems");
        } else if (Array.isArray(cartData?.cart_items)) {
          console.log("✅ Found items in response.cart_items");
        } else {
          console.log("⚠️  No items found in expected fields. Checking all properties...");
          console.log("📋 cartData keys:", cartData ? Object.keys(cartData) : "cartData is null/undefined");
          console.log("📋 cartData full structure:", cartData);
        }
        
        const mapped = mapApiCartToLocal(cartData);
        console.log(`📊 Mapped ${mapped.length} items from cart`);
        
        if (mapped.length > 0) {
          console.log("✅ Setting cart with", mapped.length, "items");
          setCart(mapped);
        } else {
          console.log("⚠️  API returned 0 items, cart will appear empty");
        }
      } catch (err) {
        console.error("❌ Fetch cart error:", err.message || err);
        console.error("❌ Full error:", err);
      }
    };

    fetchCartData();
  }, [apiToken]);

  // Sync wishlist from API on token change
  useEffect(() => {
    const fetchWishlistData = async () => {
      if (!apiToken) {
        setWishlist(readWishlistFromStorage());
        return;
      }

      try {
        const res = await getWishlist(apiToken);
        console.log("[Wishlist] Full API response object:", res);
        console.log("[Wishlist] res.data:", res?.data);
        console.log("[Wishlist] res.wishlist:", res?.wishlist);
        
        // Check what structure the API returned
        const apiData = res?.data ?? res;
        console.log("[Wishlist] apiData being passed to mapping:", apiData);
        
        const mapped = mapApiWishlistToLocal(apiData);
        console.log("[Wishlist] Mapped result:", mapped);
        console.log("[Wishlist] First item from mapped:", mapped[0]);
        
        const saved = readWishlistFromStorage();
        const merged = mergeWishlistWithSavedDetails(mapped, saved);
        console.log("[Wishlist] After merge with saved details:", merged);
        console.log("[Wishlist] First item after merge:", merged[0]);
        
        setWishlist(merged);
      } catch (err) {
        console.error("❌ Fetch wishlist error:", err.message || err);
      }
    };

    fetchWishlistData();
  }, [apiToken]);

  // Once catalog loads, enrich wishlist entries that came back from API without price/image
  useEffect(() => {
    if (!products || products.length === 0) return;
    setWishlist((prev) => {
      const { items: enriched, changed } = enrichWishlistFromCatalog(prev, products);
      return changed ? enriched : prev;
    });
  }, [products]);

  // Once catalog loads, mark cart items that no longer exist as inactive and sync stock status.
  useEffect(() => {
    if (!products || products.length === 0) return;
    if (!cart || cart.length === 0) return;
    
    setCart((prev) => {
      const { items: next, changed } = markInactiveCartItemsFromCatalog(prev, products);
      return changed ? next : prev;
    });
  }, [products, cart.length]); // Re-run when products load or cart length changes

  // Sync orders from API on token change
  useEffect(() => {
    const fetchOrdersData = async () => {
      if (!apiToken) return;
      try {
        const res = await getOrders(apiToken);
        const list = extractOrdersFromResponse(res?.data || {});
        console.log("📦 Fetched orders from API:", list);
        
        // Merge API orders with locally-stored orders so that items, paymentMethod,
        // and customerName (not returned by the API list endpoint) are preserved.
        setOrders(prev => {
          console.log("📦 Previous local orders:", prev);
          const localById = {};
          prev.forEach(o => { if (o.id) localById[String(o.id)] = o; });
          const merged = list.map(apiOrder => {
            const apiId = String(apiOrder?.id || apiOrder?.orderId || apiOrder?._id || "");
            const local = localById[apiId] || {};
            console.log(`📦 Merging order ${apiId}:`, { 
              api: apiOrder, 
              local,
              apiTotal: apiOrder?.totalAmount || apiOrder?.total,
              localTotal: local.total,
              apiItems: apiOrder?.items,
              localItems: local.items
            });
            
            const mapped = mapApiOrderToLocal(apiOrder, local);
            
            // Determine which items to use based on price validity
            let finalItems = [];
            if (mapped.items && mapped.items.length > 0) {
              // Check if API items have valid prices
              const apiHasValidPrices = mapped.items.every(item => item.price && item.price > 0);
              if (apiHasValidPrices) {
                // Use API items if they all have valid prices
                finalItems = mapped.items;
              } else if (local.items && local.items.length > 0) {
                // Use local items if API items have invalid prices
                finalItems = local.items;
              } else {
                // Fallback to API items even if prices are 0
                finalItems = mapped.items;
              }
            } else {
              // No API items, use local items
              finalItems = local.items || [];
            }
            
            const finalOrder = {
              ...mapped,
              items: finalItems,
              paymentMethod: (mapped.paymentMethod && mapped.paymentMethod !== 'Not Specified') ? mapped.paymentMethod : (local.paymentMethod || 'Not Specified'),
              customerName: (mapped.customerName && mapped.customerName !== 'Valued Member') ? mapped.customerName : (local.customerName || user?.name || 'Valued Member'),
              total: (mapped.total && mapped.total > 0) ? mapped.total : (local.total || 0),
            };
            
            console.log(`📦 Final merged order ${apiId}:`, {
              ...finalOrder,
              totalSource: (mapped.total && mapped.total > 0) ? 'API' : 'LOCAL',
              itemPrices: finalOrder.items.map(i => ({ name: i.name, price: i.price }))
            });
            return finalOrder;
          });
          // Also keep any local orders that aren't on the API (e.g. offline/failed sync)
          const apiIds = new Set(merged.map(o => String(o.id)));
          const localOnly = prev.filter(o => o.id && !apiIds.has(String(o.id)));
          const finalOrders = [...merged, ...localOnly];
          console.log("📦 Final orders array:", finalOrders);
          return finalOrders;
        });
      } catch (err) {
        console.error("Fetch orders error:", err);
      }
    };

    fetchOrdersData();
  }, [apiToken, user?.name]);

  const handleTrackOrder = async (order) => {
    if (!order) return;

    if (!apiToken) {
      setSelectedOrderForTracking(order);
      setCurrentPage("orderTracking");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const orderId = String(order.id || "").replace(/^#/, "");
      if (!orderId) throw new Error("Missing order id");

      const res = await getOrderDetails(apiToken, orderId);
      const rawOrder = extractOrderFromResponse(res?.data || {});
      const mappedOrder = rawOrder ? mapApiOrderToLocal(rawOrder, order) : order;
      setSelectedOrderForTracking(mappedOrder);
    } catch (err) {
      console.error("Fetch order details error:", err);
      setSelectedOrderForTracking(order);
    }

    setCurrentPage("orderTracking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Restore session from localStorage on mount (kept intentionally simple)
  useEffect(() => {
    // Simulate a small delay for smooth entry
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Persist profile helper - syncs with remote API and localStorage
  const saveProfile = async (newProfile) => {
    // If saving from the new-user popup modal, navigate to home afterwards
    const isFromModal = showProfileModal;
    // show transient saving message
    showToast("Saving profile...");

    // require an auth token set in-memory (via header button)
    const token = apiToken;
    if (!token) {
      // No remote token — persist locally so profile isn't lost
      const mergedLocal = { ...(profile || {}), ...newProfile };
      setProfile(mergedLocal);
      try { localStorage.setItem("svasthya_profile", JSON.stringify(mergedLocal)); } catch (e) {}
      setUser(prev => {
        const updated = { ...(prev || {}), name: mergedLocal.name, email: mergedLocal.email };
        try { localStorage.setItem("svasthya_user", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      setShowProfileModal(false);
      showToast("Profile saved successfully! ✓");
      setCurrentPage("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const res = await updateUserProfile(token, { name: newProfile.name, email: newProfile.email, gender: newProfile.gender, dob: newProfile.dob });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // prefer server response when available — unwrap nested response
      let serverData = null;
      try {
        const json = await res.json();
        serverData = extractUserFromResponse(json);
      } catch (e) {
        serverData = null;
      }

      // Normalise API field names → frontend field names, fallback to what we sent
      const fallback = { ...newProfile, phone: (profile || {}).phone };
      const normalised = normaliseProfile(serverData, fallback);

      const merged = { ...(profile || {}), ...normalised };
      setProfile(merged);
      try { localStorage.setItem("svasthya_profile", JSON.stringify(merged)); } catch (e) {}
      setUser(prev => {
        const updated = { ...(prev || {}), name: merged.name, email: merged.email, phone: merged.phone };
        localStorage.setItem("svasthya_user", JSON.stringify(updated));
        return updated;
      });
      setShowProfileModal(false);
      showToast("Profile updated successfully! 🎉");
      setCurrentPage("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // show a simple error toast; keep modal open so user can retry
      showToast("Couldn't save your profile. Please check your details and try again.", "error");
      throw err; // rethrow so callers can handle
    }
  };

  // Refresh profile from backend (called when opening profile page)
  const refreshProfile = async () => {
    if (!apiToken) return;
    try {
      const res = await getUserProfile(apiToken);
      if (!res.ok) return;
      const json = await res.json();
      console.log("[Profile REFRESH] Raw JSON:", json);
      const data = extractUserFromResponse(json);
      if (data) {
        const normalised = normaliseProfile(data);
        console.log("[Profile REFRESH] Normalised:", normalised);
        setProfile(normalised);
        localStorage.setItem("svasthya_profile", JSON.stringify(normalised));
        setUser(prev => {
          const updated = {
            ...prev,
            name: normalised.name || (prev && prev.name) || "Member",
            email: normalised.email || (prev && prev.email),
            phone: normalised.phone || (prev && prev.phone)
          };
          localStorage.setItem("svasthya_user", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("Refresh profile error:", err);
    }
  };

  const setApiToken = () => {
    const existing = apiToken || "";
    const token = window.prompt("Enter API Bearer token:", existing);
    if (token === null) return; // cancelled
    const trimmed = token.trim();
    if (trimmed === "") {
      setApiTokenState(null);
      try { localStorage.removeItem("svasthya_token"); } catch (e) { }
      showToast("API token removed.");
      return;
    }
    setApiTokenState(trimmed);
    try { localStorage.setItem("svasthya_token", trimmed); } catch (e) { }
    showToast("API token saved. ✓");
  };

  const handleLogout = async () => {
    const token = apiToken;

    if (token) {
      try {
        await logoutUser(token);
      } catch (err) {
        console.error("Logout API error:", err);
      }
    }

    // Clear all user-specific data from localStorage EXCEPT orders
    // Orders should be preserved so they can be shown when user logs back in
    localStorage.removeItem("svasthya_user");
    localStorage.removeItem("svasthya_token");
    localStorage.removeItem("svasthya_profile");
    localStorage.removeItem("svasthya_addresses");
    // DO NOT remove svasthya_orders - keep them for when user logs back in
    // localStorage.removeItem("svasthya_orders");
    localStorage.removeItem("svasthya_current_page");
    // Reset all in-memory user state
    setIsAuthenticated(false);
    setUser(null);
    setApiTokenState(null);
    setProfile({});
    setAddresses([]);
    // DO NOT clear orders state - keep them in memory
    // setOrders([]);
    setSelectedAddressId(null);
    setCart([]);
    if (token) {
      clearCart(token).catch(() => { });
    }
    setCurrentPage("auth");
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    const formData = new FormData(e.target);
    const name = formData.get("fullname") || "Guest User";
    const email = formData.get("email") || "user@example.com";

    const mockUser = {
      name: isSignIn ? "Valued Member" : name,
      email: email
    };

    // detect whether a saved profile already exists — if not, treat as new user
    let hadSavedProfile = false;
    try { hadSavedProfile = !!localStorage.getItem("svasthya_profile"); } catch (e) { hadSavedProfile = false; }

    localStorage.setItem("svasthya_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsLoggingIn(false);
    window.scrollTo(0, 0);
    setCurrentPage("landing");

    // Merge into profile storage if missing
    const merged = { ...(profile || {}), ...mockUser };
    setProfile(merged);
    try { localStorage.setItem("svasthya_profile", JSON.stringify(merged)); } catch (e) {}
    
    // Show modal for new users. Existing users won't see the popup.
    if (!isSignIn) {
      setShowProfileModal(true);
    } else {
      setShowProfileModal(false);
    }
  };

  const handleOTPVerified = async (phone, fullName, token, isSignInAction, responseData) => {
    console.log("[handleOTPVerified] token received:", token ? token.substring(0, 20) + "..." : "NONE");
    console.log("[handleOTPVerified] isSignInAction:", isSignInAction);
    console.log("[handleOTPVerified] responseData:", JSON.stringify(responseData, null, 2));

    // Fallback: try to extract token from responseData if not passed directly
    let authToken = token;
    if (!authToken && responseData) {
      authToken = responseData.token
        || responseData.data?.token
        || responseData.authToken
        || responseData.jwtToken
        || responseData.user?.token
        || responseData.data?.user?.token
        || responseData.accessToken
        || responseData.data?.accessToken
        || responseData.access_token
        || responseData.data?.access_token
        || responseData.jwt
        || responseData.data?.jwt
        || responseData.data?.jwtToken
        || null;
      if (authToken) console.log("[handleOTPVerified] Token found via fallback extraction");
    }

    authToken = normalizeAuthToken(authToken);

    if (authToken) {
      setApiTokenState(authToken);
      localStorage.setItem("svasthya_token", authToken);
    } else {
      console.warn("[handleOTPVerified] No JWT token found — profile fetch will be skipped!");
    }
    
    // Initial user object from verification step
    let mockUser = {
      name: fullName || "Valued Member",
      phone: phone
    };

    localStorage.setItem("svasthya_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAuthenticated(true);
    setCurrentPage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!isSignInAction) {
      // New user registration flow
      const merged = { name: mockUser.name, phone: mockUser.phone, email: "", gender: "", dob: "" };
      setProfile(merged);
      try { localStorage.setItem("svasthya_profile", JSON.stringify(merged)); } catch (e) {}
      setShowProfileModal(true);
    } else {
      // Existing user sign-in: extract user data from verify-otp response first
      const userData = responseData?.user || responseData?.data?.user || responseData?.data || {};
      const initialProfile = {
        name: userData.name || userData.fullName || userData.full_name || fullName || "Valued Member",
        email: userData.email || "",
        gender: userData.gender || "",
        dob: userData.dateOfBirth || userData.dob || userData.birthDate || "",
        phone: userData.mobileNumber || userData.phone || userData.mobile || phone,
      };
      setProfile(initialProfile);
      localStorage.setItem("svasthya_profile", JSON.stringify(initialProfile));
      setUser({ name: initialProfile.name, email: initialProfile.email, phone: initialProfile.phone });
      localStorage.setItem("svasthya_user", JSON.stringify({ name: initialProfile.name, email: initialProfile.email, phone: initialProfile.phone }));

      // Fetch full profile from backend API for complete/updated data
      if (authToken) {
        try {
          const res = await getUserProfile(authToken);
          console.log("[Auth] Profile fetch status:", res.status);
          if (res.ok) {
            const json = await res.json();
            console.log("[Auth] Profile Fetch JSON:", JSON.stringify(json, null, 2));
            const data = extractUserFromResponse(json);
            console.log("[Auth] Extracted data:", JSON.stringify(data, null, 2));
            if (data) {
              const normalised = normaliseProfile(data, initialProfile);
              console.log("[Auth] Normalised Profile:", JSON.stringify(normalised, null, 2));
              setProfile(normalised);
              localStorage.setItem("svasthya_profile", JSON.stringify(normalised));
              const updatedUser = {
                name: normalised.name || "Valued Member",
                email: normalised.email || "",
                phone: normalised.phone || phone,
              };
              setUser(updatedUser);
              localStorage.setItem("svasthya_user", JSON.stringify(updatedUser));
            }
          } else {
            const errText = await res.text();
            console.error("[Auth] Profile fetch failed with status:", res.status, errText);
          }
        } catch (err) {
          console.error("[Auth] Profile fetch failed:", err);
        }

        // Also fetch user_id from GET /api/v1/users
        try {
          const userRes = await getUserInfo(authToken);
          if (userRes.ok) {
            const userJson = await userRes.json();
            console.log("[Auth] User Info JSON:", JSON.stringify(userJson, null, 2));
            const userData2 = extractUserFromResponse(userJson);
            if (userData2) {
              const userId = userData2.id || userData2._id || userData2.userId || userData2.user_id || "";
              setUser(prev => {
                const updated = { ...prev, userId };
                localStorage.setItem("svasthya_user", JSON.stringify(updated));
                return updated;
              });
            }
          }
        } catch (err) {
          console.error("[Auth] User info fetch failed:", err);
        }

        await syncAddressesFromBackend(authToken);
      }
      setShowProfileModal(false);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavigateToProducts = (category = "All") => {
    setActiveCategory(category);
    setCurrentPage("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewProduct = (product) => {
    // Enrich product with latest data from catalog to ensure stock info is current
    let enrichedProduct = product;
    
    if (products && Array.isArray(products)) {
      const catalogProduct = products.find(p => String(p?.id) === String(product?.id));
      if (catalogProduct) {
        console.log("[ProductView] Found product in catalog, enriching with latest data");
        // Merge catalog data into product, prioritizing catalog for stock/availability
        enrichedProduct = {
          ...product,
          ...catalogProduct,
          // Keep wishlist-specific fields if present
          wishlistItemId: product?.wishlistItemId,
          addedAt: product?.addedAt,
        };
      }
    }
    
    setSelectedProduct(enrichedProduct);
    try {
      localStorage.setItem("svasthya_selected_product", JSON.stringify(enrichedProduct));
    } catch (e) {
      // ignore storage errors
    }
    setCurrentPage("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = async (product, selectedVariant = null, quantity = 1) => {
    // Use the provided selectedVariant or the product's selectedVariant
    const variant = selectedVariant || product.selectedVariant || (product.variants && product.variants[0]);
    const variantLabel = variant?.variantName || variant?.name || variant?.label || 'Standard';
    const variantId = String(variant?.id || variant?.variantId || variant?.variant_id || product?.id || product?.productId || "");
    const productId = String(product?.id || product?.productId || "");
    const cartItemId = variantId;

    console.log("Adding to cart:", { 
      productName: product.name,
      productId,
      variantId, 
      variantLabel,
      price: variant?.price || product.price,
      quantity
    });

    // Local optimistic behavior (kept as fallback)
    const applyLocalAdd = () => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
        if (existingItem) {
          console.log("Item exists, updating quantity by", quantity);
          return prevCart.map(item =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        console.log("Adding new item to local cart");
        return [...prevCart, {
          ...product,
          variantId,
          cartItemId,
          selectedVariant: variantLabel,
          price: variant?.price || product.price,
          quantity: quantity,
          availabilityStatus: variant?.availabilityStatus || "IN_STOCK",
          stockQuantity: variant?.stockQuantity || product?.stockQuantity || 999,
        }];
      });
    };

    // Redirect to sign in if not authenticated
    if (!isAuthenticated) {
      setIsSignIn(true);
      setCurrentPage("auth");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // If no auth token or variantId, use local cart only
    if (!apiToken) {
      console.log("No API token, using local cart only");
      applyLocalAdd();
      return;
    }

    if (!variantId || !productId) {
      console.warn("Missing variantId or productId, using local cart only", { variantId, productId });
      applyLocalAdd();
      return;
    }

    // Apply locally first for instant UI feedback
    applyLocalAdd();
    
    // Show toast with "Go to Cart" button
    showToast(
      `${product.name} added to cart`,
      "success",
      () => {
        setCurrentPage("cartPage");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      "VIEW CART"
    );

    try {
      // Send minimal, clean payload
      const payload = {
        variantId: String(variantId),
        quantity: quantity,
      };
      
      console.log("📤 CART ADD Request payload:", JSON.stringify(payload));
      const res = await addCartItem(apiToken, payload);
      console.log("✅ CART ADD Response status:", res?.status);
      console.log("✅ CART ADD Response data:", JSON.stringify(res?.data));

      // Only do a lightweight backend check to confirm save — don't overwrite local cart
      const cartRes = await getCart(apiToken);
      const cartData = cartRes.data?.cart || cartRes.data?.data || cartRes.data;
      const backendItems = cartData?.items || cartData?.cartItems || [];

      if (backendItems.length === 0) {
        console.error("⚠️  Backend cart is still empty after add — local state kept");
      } else {
        console.log(`✅ Backend confirmed ${backendItems.length} item(s) in cart`);
        // Merge backend data into local cart to pick up backend-assigned IDs/metadata,
        // but PRESERVE local quantities which the user explicitly chose.
        setCart(prevCart => {
          const backendMapped = mapApiCartToLocal(cartData);
          // For each backend item, if a local item already exists with the same cartItemId/variantId,
          // keep the local quantity; otherwise add the backend item.
          const merged = [...prevCart];
          backendMapped.forEach(backendItem => {
            const localIdx = merged.findIndex(l => l.cartItemId === backendItem.cartItemId || l.variantId === backendItem.variantId);
            if (localIdx === -1) {
              // Entirely new item from backend (edge case), add it
              merged.push(backendItem);
            }
            // else: local item already exists with user's chosen quantity — keep it
          });
          return merged;
        });
      }
    } catch (err) {
      console.error("❌ Add to cart API failed:", err.message);
      if (err?.response?.data) {
        console.error("❌ Backend error response:", JSON.stringify(err.response.data));
      }
      // Local state already updated by applyLocalAdd() above — no extra action needed
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    const variantId = item?.variantId;
    const maxStock = (item?.stockQuantity > 0) ? item.stockQuantity : 999;

    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    // Enforce stock cap
    if (newQuantity > maxStock) {
      showToast(`Out of stock! This product only has ${maxStock} units available. You cannot add more.`, "error");
      return;
    }

    // Local optimistic behavior
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );

    if (!apiToken || !variantId) return;

    try {
      const isIncrement = newQuantity > (item?.quantity || 0);
      isIncrement
        ? await incrementCartItem(apiToken, variantId)
        : await decrementCartItem(apiToken, variantId);
    } catch (err) {
      console.error("Update cart quantity error:", err);
      // rollback optimistic update
      setCart(prevCart =>
        prevCart.map(it =>
          it.cartItemId === cartItemId
            ? { ...it, quantity: item.quantity }
            : it
        )
      );
    }
  };

  const removeFromCart = async (cartItemId) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    const variantId = item?.variantId;
    const previous = [...cart];

    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));

    if (!apiToken || !variantId) return;

    try {
      await removeCartItem(apiToken, variantId);
    } catch (err) {
      console.error("Remove cart item error:", err);
      setCart(previous);
    }
  };

  const clearAllCartItems = async () => {
    if (cart.length === 0) return;

    const previous = [...cart];
    setCart([]);

    if (!apiToken) return;

    try {
      await clearCart(apiToken);
    } catch (err) {
      console.error("Clear cart error:", err);
      setCart(previous);
    }
  };

  const toggleWishlist = (product) => {
    // Extract variant ID - prioritize selectedVariantId (passed from WishlistPage), 
    // then use first variant, then default to product ID
    let variantId = product.id;
    
    if (product.selectedVariantId) {
      variantId = product.selectedVariantId;
    } else if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      variantId = product.variants[0].id || product.variants[0].variantId || product.id;
    }

    // Normalize IDs to strings for consistent comparison
    const normalizeId = (id) => String(id || "").trim();
    const productIdNorm = normalizeId(product.id) || normalizeId(product.productId);
    const variantIdNorm = normalizeId(variantId);

    console.log("[Wishlist] Toggle starting - Product:", productIdNorm, "Variant:", variantIdNorm, "Wish ID:", product.wishlistItemId);

    // Check if item is already in wishlist using consistent string comparisons
    const isAlreadyWishlisted = wishlist.some((item) => {
      // First try wishlistItemId (most unique identifier)
      if (product.wishlistItemId && item.wishlistItemId) {
        if (normalizeId(product.wishlistItemId) === normalizeId(item.wishlistItemId)) {
          console.log("[Wishlist] Found match by wishlistItemId:", product.wishlistItemId);
          return true;
        }
      }
      
      // Fall back to product ID + variant ID matching
      const itemProdId = normalizeId(item.id) || normalizeId(item.productId);
      const itemVarId = normalizeId(item.selectedVariantId) || normalizeId(item.variantId) || normalizeId(item.variant_id);
      
      const prodMatch = itemProdId === productIdNorm;
      const varMatch = itemVarId === variantIdNorm;
      
      if (prodMatch && varMatch) {
        console.log("[Wishlist] Found match by productId+variantId:", { itemProd: itemProdId, itemVar: itemVarId });
        return true;
      }
      
      return false;
    });

    console.log("[Wishlist] Toggle check - IsWishlisted:", isAlreadyWishlisted);

    // Local-only behaviour when not authenticated
    if (!apiToken) {
      setWishlist((prev) =>
        isAlreadyWishlisted
          ? prev.filter((item) => {
              // Keep items that don't match this product+variant
              if (product.wishlistItemId && item.wishlistItemId) {
                if (normalizeId(product.wishlistItemId) === normalizeId(item.wishlistItemId)) {
                  return false; // Remove this item
                }
              }
              const itemProdId = normalizeId(item.id) || normalizeId(item.productId);
              const itemVarId = normalizeId(item.selectedVariantId) || normalizeId(item.variantId) || normalizeId(item.variant_id);
              const prodMatch = itemProdId === productIdNorm;
              const varMatch = itemVarId === variantIdNorm;
              return !(prodMatch && varMatch);
            })
          : [...prev, product]
      );
      
      if (isAlreadyWishlisted) {
        showToast(`${product.name || product.productName || "Item"} removed from wishlist`, "success");
      } else {
        showToast(
          `${product.name || product.productName || "Item"} added to wishlist`,
          "success",
          () => {
            setCurrentPage("wishlist");
            window.scrollTo({ top: 0, behavior: "smooth" });
          },
          "VIEW WISHLIST"
        );
      }
      return;
    }

    // Optimistic update - remove only the specific variant combination
    setWishlist((prev) =>
      isAlreadyWishlisted
        ? prev.filter((item) => {
            // Keep items that don't match this product+variant
            if (product.wishlistItemId && item.wishlistItemId) {
              if (normalizeId(product.wishlistItemId) === normalizeId(item.wishlistItemId)) {
                return false; // Remove this item
              }
            }
            const itemProdId = normalizeId(item.id) || normalizeId(item.productId);
            const itemVarId = normalizeId(item.selectedVariantId) || normalizeId(item.variantId) || normalizeId(item.variant_id);
            const prodMatch = itemProdId === productIdNorm;
            const varMatch = itemVarId === variantIdNorm;
            return !(prodMatch && varMatch);
          })
        : [...prev, product]
    );
    
    // Show toast message
    if (isAlreadyWishlisted) {
      showToast(`${product.name || product.productName || "Item"} removed from wishlist`, "success");
    } else {
      showToast(
        `${product.name || product.productName || "Item"} added to wishlist`,
        "success",
        () => {
          setCurrentPage("wishlist");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        "VIEW WISHLIST"
      );
    }

    // Extract productId with multiple fallbacks
    let productId = String(product.id || product.productId || "").trim();
    if (!productId) {
      console.error("[Wishlist] ERROR: No productId found in product object:", product);
      showToast("Error: Product ID not found", "error");
      return;
    }

    (async () => {
      try {
        console.log("[Wishlist] Attempting operation:", {
          operation: isAlreadyWishlisted ? "DELETE" : "ADD",
          productId,
          variantId,
          wishlistItemId: product.wishlistItemId,
          productObject: { id: product.id, productId: product.productId, selectedVariantId: product.selectedVariantId }
        });
        
        if (isAlreadyWishlisted) {
          // Ensure we have valid IDs before calling delete
          if (!productId) {
            throw new Error("Product ID is required for deletion");
          }
          
          // Use variant-aware delete endpoint
          console.log("[Wishlist] Calling DELETE endpoint - productId:", productId, "variantId:", variantId);
          const deleteResult = await removeWishlistItemWithVariant(apiToken, productId, variantId);
          console.log("[Wishlist] DELETE successful. Result:", deleteResult);
          showToast(`${product.name || product.productName || "Item"} removed from wishlist`, "success");
          return; // Keep optimistic deletion - it succeeded
        } else {
          // Pre-check if item already exists on backend before adding
          try {
            const checkResult = await checkWishlistItemWithVariant(apiToken, productId, variantId);
            if (checkResult.exists || checkResult.inWishlist) {
              console.log("Item already exists in backend wishlist. Keeping local state.");
              showToast(`${product.name} is already in your wishlist`, "info");
              return;
            }
          } catch (checkErr) {
            console.log("Check endpoint returned error (expected if not in wishlist):", checkErr.message);
            // Continue with add operation if check fails
          }
          
          // Use variant-aware add endpoint
          await addWishlistItemWithVariant(apiToken, productId, variantId);
        }
      } catch (err) {
        console.error("Wishlist toggle error:", err);
        const errorStatus = err.response?.status;
        const errorMessage = err.response?.data?.message || err.message || "";
        
        console.log(`[Wishlist] Error during ${isAlreadyWishlisted ? "DELETE" : "ADD"}: ${errorStatus} - ${errorMessage}`);
        
        // Handle 409 Conflict (product already in wishlist) - treat as success for ADD operations
        if (errorStatus === 409 && !isAlreadyWishlisted) {
          console.log("Product already in wishlist (409 conflict). Item exists in backend.");
          showToast(`${product.name} is already in your wishlist`, "info");
          return;
        }
        
        // Handle 404 Not Found - for DELETE, treat as already deleted (success)
        if (errorStatus === 404 && isAlreadyWishlisted) {
          console.log("Wishlist item not found (404). Already removed from backend.");
          return; // Keep optimistic deletion - item was already gone
        }
        
        // Handle duplicate key errors on ADD - item already exists on backend
        const isDuplicateError = errorMessage.includes("Duplicate entry") || errorMessage.includes("duplicate");
        if (isDuplicateError && !isAlreadyWishlisted) {
          console.log("Duplicate entry - item already in backend wishlist");
          showToast(`${product.name} is already in your wishlist`, "info");
          return; // Keep optimistic add (state is already correct)
        }
        
        // For DELETE operations that fail, REVERT the optimistic deletion so item comes back
        if (isAlreadyWishlisted) {
          console.log("Delete operation failed on backend. Status:", errorStatus, "Message:", errorMessage);
          console.log("Reverting to restore item.");
          
          // Revert: add the product back to wishlist
          setWishlist((prev) => {
            // Check if item is already back (from API response)
            const itemExists = prev.some((item) => {
              if (product.wishlistItemId && item.wishlistItemId) {
                if (normalizeId(product.wishlistItemId) === normalizeId(item.wishlistItemId)) {
                  return true;
                }
              }
              const itemProdId = normalizeId(item.id) || normalizeId(item.productId);
              const itemVarId = normalizeId(item.selectedVariantId) || normalizeId(item.variantId) || normalizeId(item.variant_id);
              const prodMatch = itemProdId === productIdNorm;
              const varMatch = itemVarId === variantIdNorm;
              return prodMatch && varMatch;
            });
            if (!itemExists) {
              console.log("[Wishlist] Re-adding product to state after failed delete");
              return [...prev, product];
            }
            return prev;
          });
          
          // Fetch fresh wishlist from backend to sync state
          try {
            console.log("[Wishlist] Fetching fresh wishlist to sync after delete failure");
            const res = await getWishlist(apiToken);
            const mapped = mapApiWishlistToLocal(res?.data ?? res);
            const saved = readWishlistFromStorage();
            const merged = mergeWishlistWithSavedDetails(mapped, saved);
            setWishlist(merged);
            console.log("[Wishlist] Synced with backend after delete failure");
          } catch (syncErr) {
            console.error("[Wishlist] Failed to sync with backend:", syncErr.message);
          }
          
          showToast(`Failed to remove item: ${errorMessage || "Please try again"}`, "error");
          return;
        }
        
        // For ADD operations that fail (not 409/duplicate), revert the optimistic update
        console.log("Add operation failed. Reverting optimistic update.");
        setWishlist((prev) =>
          prev.filter((item) => {
            const itemProdId = normalizeId(item.id) || normalizeId(item.productId);
            const itemVarId = normalizeId(item.selectedVariantId) || normalizeId(item.variantId) || normalizeId(item.variant_id);
            const prodMatch = itemProdId === productIdNorm;
            const varMatch = itemVarId === variantIdNorm;
            return !(prodMatch && varMatch);
          })
        );
        
        showToast(errorMessage || "Failed to update wishlist", "error");
      }
    })();
  };

  const handleClearWishlist = async () => {
    if (!apiToken) {
      showToast("Please log in to clear wishlist", "error");
      return;
    }

    try {
      console.log("[Wishlist] Clearing all wishlist data...");
      showToast("Your wishlist is being cleared...", "info");
      await clearWishlist(apiToken);
      console.log("[Wishlist] Wishlist cleared successfully!");
      setWishlist([]);
      showToast("Wishlist cleared successfully!", "success");
    } catch (err) {
      console.error("[Wishlist] Error clearing wishlist:", err);
      showToast(`Failed to clear wishlist: ${err.message}`, "error");
    }
  };

  const handleDetailsChange = (field, value) => {
    setCheckoutDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async (address) => {
    try {
      let finalAddress = { ...address };
      if (apiToken) {
        showToast("Saving address...");
        
        const payload = {
          addressType: address.type === 'Other' && address.other_type ? address.other_type : address.type,
          address_type: address.type === 'Other' && address.other_type ? address.other_type : address.type,
          type: address.type,
          buildingNo: address.building_no,
          building_no: address.building_no,
          buildingName: address.building_name,
          building_name: address.building_name,
          streetNo: address.street_no,
          street_no: address.street_no,
          areaName: address.area_name,
          area_name: address.area_name,
          city: address.city,
          state: address.state,
          otherType: address.other_type,
          other_type: address.other_type,
          pinCode: address.pincode ? Number(address.pincode) : null,
          pincode: address.pincode ? Number(address.pincode) : null,
          isDefault: address.is_default ? 1 : 0,
          is_default: address.is_default ? 1 : 0
        };

        console.log("[Address ADD] Payload:", JSON.stringify(payload, null, 2));

        const res = await createAddress(apiToken, payload);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to add address");
        }
        const data = await res.json();
        const apiAddress = data.address || data.data || data;
        const addRawType = apiAddress.addressType || apiAddress.type || address.type || "home";
        const addNorm = addRawType.charAt(0).toUpperCase() + addRawType.slice(1).toLowerCase();
        const addIsStandard = ["Home", "Office", "Other"].includes(addNorm);
        finalAddress = {
          ...apiAddress,
          id: apiAddress.id || apiAddress._id,
          type: addIsStandard ? addNorm : "Other",
          building_no: apiAddress.buildingNo || apiAddress.building_no || address.building_no || "",
          building_name: apiAddress.buildingName || apiAddress.building_name || address.building_name || "",
          street_no: apiAddress.streetNo || apiAddress.street_no || address.street_no || "",
          area_name: apiAddress.areaName || apiAddress.area_name || address.area_name || "",
          city: apiAddress.city || address.city || "",
          state: apiAddress.state || address.state || "",
          other_type: addIsStandard ? (apiAddress.otherType || apiAddress.other_type || address.other_type || "") : addRawType,
          pincode: apiAddress.pinCode || apiAddress.pincode || address.pincode || "",
          is_default: apiAddress.isDefault === 1 || apiAddress.isDefault === true || apiAddress.is_default === true
        };
        
        showToast("Address added successfully! ✓");
      } else {
        finalAddress.id = Date.now();
      }

      setAddresses(prev => {
        const newAddresses = finalAddress.is_default
          ? prev.map(a => ({ ...a, is_default: false })).concat(finalAddress)
          : [...prev, finalAddress];

        return newAddresses;
      });
      setSelectedAddressId(finalAddress.id);
    } catch (err) {
      console.error(err);
      showToast("Couldn't save address. Please check your details and try again.", "error");
    }
  };

  const handleUpdateAddress = async (updatedAddress) => {
    try {
      let finalAddress = { ...updatedAddress };
      if (apiToken) {
        showToast("Updating address...");
        // Handle MongoDB _id if present in updatedAddress.id
        const addressId = updatedAddress._id || updatedAddress.id;
        
        const payload = {
          addressType: updatedAddress.type === 'Other' && updatedAddress.other_type ? updatedAddress.other_type : updatedAddress.type,
          address_type: updatedAddress.type === 'Other' && updatedAddress.other_type ? updatedAddress.other_type : updatedAddress.type,
          type: updatedAddress.type,
          buildingNo: updatedAddress.building_no,
          building_no: updatedAddress.building_no,
          buildingName: updatedAddress.building_name,
          building_name: updatedAddress.building_name,
          streetNo: updatedAddress.street_no,
          street_no: updatedAddress.street_no,
          areaName: updatedAddress.area_name,
          area_name: updatedAddress.area_name,
          city: updatedAddress.city,
          state: updatedAddress.state,
          otherType: updatedAddress.other_type,
          other_type: updatedAddress.other_type,
          pinCode: updatedAddress.pincode ? Number(updatedAddress.pincode) : null,
          pincode: updatedAddress.pincode ? Number(updatedAddress.pincode) : null,
          isDefault: updatedAddress.is_default ? 1 : 0,
          is_default: updatedAddress.is_default ? 1 : 0
        };

        console.log("[Address UPDATE] Payload:", JSON.stringify(payload, null, 2));

        const res = await editAddress(apiToken, addressId, payload);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to update address");
        }
        const data = await res.json();
        console.log("[Address UPDATE] Response:", JSON.stringify(data, null, 2));
        const apiAddress = data.address || data.data || data;
        const updRawType = apiAddress.addressType || apiAddress.type || updatedAddress.type || "home";
        const updNorm = updRawType.charAt(0).toUpperCase() + updRawType.slice(1).toLowerCase();
        const updIsStandard = ["Home", "Office", "Other"].includes(updNorm);
        finalAddress = {
          ...apiAddress,
          id: apiAddress.id || apiAddress._id,
          type: updIsStandard ? updNorm : "Other",
          building_no: apiAddress.buildingNo || apiAddress.building_no || updatedAddress.building_no || "",
          building_name: apiAddress.buildingName || apiAddress.building_name || updatedAddress.building_name || "",
          street_no: apiAddress.streetNo || apiAddress.street_no || updatedAddress.street_no || "",
          area_name: apiAddress.areaName || apiAddress.area_name || updatedAddress.area_name || "",
          city: apiAddress.city || updatedAddress.city || "",
          state: apiAddress.state || updatedAddress.state || "",
          other_type: updIsStandard ? (apiAddress.otherType || apiAddress.other_type || updatedAddress.other_type || "") : updRawType,
          pincode: apiAddress.pinCode || apiAddress.pincode || updatedAddress.pincode || "",
          is_default: apiAddress.isDefault === 1 || apiAddress.isDefault === true || apiAddress.is_default === true
        };
        showToast("Address updated successfully! ✓");
      } else {
        finalAddress.id = updatedAddress.id;
      }

      setAddresses(prev => prev.map(a => {
        if (finalAddress.is_default && a.id !== finalAddress.id) {
          return { ...a, is_default: false };
        }
        return a.id === finalAddress.id ? finalAddress : a;
      }));
    } catch (err) {
      console.error(err);
      showToast("Couldn't update address. Please try again.", "error");
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      if (apiToken) {
        showToast("Removing address...");
        const res = await removeAddress(apiToken, id);
        if (!res.ok) throw new Error("Failed to delete address");
        showToast("Address removed successfully! ✓");
      }

      setAddresses(prev => prev.filter(a => a.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
    } catch (err) {
      console.error(err);
      showToast("Couldn't remove address. Please try again.", "error");
    }
  };

  const goToCheckout = () => {
    if (!cart || cart.length === 0) {
      showToast("Your cart is empty. Browse products and add items before checking out.", "error");
      return;
    }
    
    // Populate checkout details with logged-in user info
    setCheckoutDetails(prev => ({
      ...prev,
      email: user?.email || profile?.email || prev.email,
      firstName: user?.name?.split(' ')[0] || profile?.name?.split(' ')[0] || prev.firstName,
      lastName: user?.name?.split(' ').slice(1).join(' ') || profile?.name?.split(' ').slice(1).join(' ') || prev.lastName,
      phone: user?.phone || profile?.phone || prev.phone,
    }));
    
    setCurrentPage("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToDelivery = () => {
    setCurrentPage("delivery");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeliveryContinue = (method) => {
    setDeliveryMethod(method);
    setCurrentPage("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateCheckoutStep = (stepNumber) => {
    const step = Number(stepNumber);
    if (step === 1) setCurrentPage("checkout");
    else if (step === 2) setCurrentPage("delivery");
    else if (step === 3) setCurrentPage("payment");
    else return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async (method) => {
    // Validate cart has items
    if (!cart || cart.length === 0) {
      showToast("Your cart is empty. Please add at least one item before placing an order.", "error");
      return;
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses.find(a => a.is_default) || addresses[0];
    
    if (!selectedAddress) {
      showToast("No delivery address found. Please add a shipping address before continuing.", "error");
      return;
    }

    let methodLabel = "Card Payment";
    if (method === "cod" || method === "Cash on Delivery") methodLabel = "Cash on Delivery";
    else if (method === "upi" || method === "UPI / Netbanking") methodLabel = "UPI / Netbanking";

    // Verify backend has the cart items - retry if needed
    console.log("🔍 Verifying items are saved in backend...");
    let backendItemsCount = 0;
    let verifyAttempts = 0;
    const maxAttempts = 3;

    while (verifyAttempts < maxAttempts && backendItemsCount === 0) {
      try {
        const verifyRes = await getCart(apiToken);
        const backendCart = verifyRes.data?.cart || verifyRes.data?.data || verifyRes.data;
        const backendItems = backendCart?.items || backendCart?.cartItems || backendCart?.cart_items || [];
        backendItemsCount = Array.isArray(backendItems) ? backendItems.length : 0;
        
        console.log(`📦 Verification attempt ${verifyAttempts + 1}: Backend has ${backendItemsCount} items`);
        
        if (backendItemsCount === 0 && verifyAttempts < maxAttempts - 1) {
          console.log("⏳ Items not found yet, retrying in 500ms...");
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        console.error("Verification failed:", err.message);
      }
      verifyAttempts++;
    }

    if (backendItemsCount === 0) {
      console.error("❌ CRITICAL: Backend cart is empty!");
      showToast("Your cart items couldn't be verified. Please re-add items to your cart and try again.", "error");
      return;
    }

    const shippingCharge = deliveryMethod === "express" ? 150 : 0;
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountAmount = getDiscountFromCoupon(appliedCoupon, subtotal);
    const couponCode = appliedCoupon?.code ? String(appliedCoupon.code) : undefined;
    const total = Math.max(0, subtotal - discountAmount) + shippingCharge;

    // Build a human-readable shipping address string for storing with the order
    let shippingAddressText = "";
    if (selectedAddress) {
      const parts = [
        selectedAddress.building_no,
        selectedAddress.building_name,
        selectedAddress.street_no,
        selectedAddress.area_name,
        selectedAddress.city,
        selectedAddress.state,
      ].filter(Boolean);
      shippingAddressText = parts.join(', ');
      if (selectedAddress.pincode) {
        shippingAddressText = shippingAddressText
          ? `${shippingAddressText} - ${selectedAddress.pincode}`
          : String(selectedAddress.pincode);
      }
    }

    const items = cart.map((item, idx) => {
      const varId = item.variantId || item.id;
      return {
        variantId: String(varId),
        quantity: parseInt(item.quantity || 1),
        unitPrice: parseFloat(item.price || 0),
      };
    });

    const payload = {
      paymentMethod: method,
      deliveryMethod: deliveryMethod || "standard",
      addressId: selectedAddress?.id,
      couponCode: couponCode,
      coupon_code: couponCode,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discount_amount: discountAmount > 0 ? discountAmount : undefined,
      shippingAddress: {
        id: selectedAddress?.id,
        type: selectedAddress?.type || selectedAddress?.address_type,
        buildingNo: selectedAddress?.building_no,
        buildingName: selectedAddress?.building_name,
        street: selectedAddress?.street_no,
        area: selectedAddress?.area_name,
        city: selectedAddress?.city,
        state: selectedAddress?.state,
        pincode: selectedAddress?.pincode,
        addressLine: shippingAddressText || undefined,
      },
      customer: {
        name: user?.name || checkoutDetails.firstName || "Valued Member",
        email: checkoutDetails.email || user?.email || "",
        phone: checkoutDetails.phone || user?.phone || "",
      },
      items,
      subtotal,
      shippingCharge,
      total,
    };

    console.log("=== 🛒 FINAL CHECKOUT ===");
    console.log("Backend has", backendItemsCount, "items");
    console.log("Sending payload:", JSON.stringify(payload, null, 2));
    console.log("=======================");

    try {
      showToast("Placing your order...");
      const res = await createCheckout(apiToken, payload);
      console.log("✅ Checkout success:", res?.data);
      
      const raw = res?.data?.data?.order || res?.data?.order || res?.data?.data || res?.data;

      const fallbackOrderId = `#SV-${Math.floor(100000 + Math.random() + 900000)}`;
      // Always build from a local fallback that preserves cart items + payment method,
      // then overlay API fields. This ensures items/paymentMethod are never lost.
      console.log("📦 Cart items being saved to order:", cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })));
      
      const localFallback = {
        id: fallbackOrderId,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        items: [...cart],
        subtotal,
        shippingCharge,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
        couponCode: couponCode || null,
        total,
        status: 'PROCESSING',
        deliveryMethod,
        paymentMethod: methodLabel,
        customerName: user?.name || 'Valued Member',
        // Persist a flattened address so My Orders can reliably show "Deliver to"
        deliveryAddress: shippingAddressText || undefined,
        address: shippingAddressText || undefined,
        // Add estimated delivery date (5 days from now)
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
      };
      const mappedOrder = raw ? { 
        ...mapApiOrderToLocal(raw, localFallback), 
        items: localFallback.items, 
        paymentMethod: localFallback.paymentMethod, 
        customerName: localFallback.customerName,
        subtotal: localFallback.subtotal,
        shippingCharge: localFallback.shippingCharge,
        discountAmount: localFallback.discountAmount,
        couponCode: localFallback.couponCode,
        total: localFallback.total  // Preserve the total from local calculation
      } : localFallback;

      const normalizedOrderId = mappedOrder?.id ? String(mappedOrder.id) : fallbackOrderId;
      setOrders(prev => [mappedOrder, ...prev]);
      setLastOrderId(normalizedOrderId.startsWith("#") ? normalizedOrderId : `#${normalizedOrderId}`);

      if (apiToken) {
        clearCart(apiToken).catch(() => { });
      }
      setCart([]);
      setAppliedCoupon(null);
      setCurrentPage("orderConfirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Order placed successfully");
    } catch (err) {
      console.error("❌ Checkout error:", err.message);
      console.error("❌ Backend response:", err?.response?.data);
      const backendMsg = (err?.response?.data?.message || err?.message || "").toLowerCase();
      let userMsg;
      if (backendMsg.includes("stock") || backendMsg.includes("quantity") || backendMsg.includes("insufficient") || backendMsg.includes("available")) {
        userMsg = "One or more items in your cart exceed the available stock. Please reduce the quantity and try again.";
      } else if (backendMsg.includes("not found") || backendMsg.includes("product")) {
        userMsg = "A product in your cart is no longer available. Please remove it and try again.";
      } else if (backendMsg.includes("address")) {
        userMsg = "There's an issue with your delivery address. Please verify it and try again.";
      } else if (backendMsg.includes("payment")) {
        userMsg = "Payment method is invalid. Please go back and select a valid payment method.";
      } else {
        userMsg = "Couldn't place your order. Please try again or contact support if the issue persists.";
      }
      showToast(userMsg, "error");
    }
  };

  const scrollToSection = (sectionId) => {
    if (currentPage !== "landing") {
      setCurrentPage("landing");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (isInitialLoading) {
    return (
      <div className="initial-loader">
        <div className="loader-content">
          <img src="/logo.png" alt="Svasthya Fresh" className="loader-logo" />
          <div className="loader-spinner"></div>
          <p>Nourishing your body...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {toast.message && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          color: '#fff',
          padding: '14px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          fontWeight: '500',
          fontSize: '15px',
          minWidth: '320px',
          maxWidth: '500px',
          lineHeight: '1.5',
          backgroundColor: toast.type === 'error' ? '#C0392B' : '#323232',
          animation: 'slideInUp 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <span style={{ flex: 1 }}>
            {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.message}
          </span>
          {toast.action && toast.actionLabel && (
            <button
              onClick={() => {
                toast.action();
                setToast({ message: "", type: "success", action: null, actionLabel: "" });
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFD700',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 215, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
      <header className="header">
        <div className="header-inner">
          <a
            href="#"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage("landing");
              closeMobileMenu();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img src="/logo.png" alt="Svasthya Fresh Logo" />
          </a>

          {/* Desktop Nav */}
          <nav className="nav-menu">
            <a
              href="#"
              className={`nav-link ${currentPage === "landing" ? "active" : ""}`}
              aria-current={currentPage === "landing" ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Home
            </a>

            <div className="nav-dropdown">
              <a
                href="#"
                className={`nav-link ${["products", "details"].includes(currentPage) ? "active" : ""}`}
                aria-current={["products", "details"].includes(currentPage) ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage("products");
                  setActiveCategory("All");
                }}
              >
                Products <ChevronDown size={14} />
              </a>
              <div className="dropdown-content">
                {categories.map((cat) => (
                  <a 
                    key={cat} 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleNavigateToProducts(cat); 
                    }}
                  >
                    {cat === "All" ? "All Products" : cat}
                  </a>
                ))}
              </div>
            </div>

            <a
              href="#"
              className={`nav-link ${currentPage === "ourStory" ? "active" : ""}`}
              aria-current={currentPage === "ourStory" ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage("ourStory");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Our Story
            </a>

            <a
              href="#"
              className={`nav-link ${currentPage === "contact" ? "active" : ""}`}
              aria-current={currentPage === "contact" ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage("contact");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Contact
            </a>
          </nav>

          <div className="header-actions">
            <div className={`global-search-container ${isSearchOpen ? 'open' : ''}`} ref={searchContainerRef}>
              {isSearchOpen && (
                <>
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="global-search-input"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (currentPage !== "products" && currentPage !== "details") {
                        setCurrentPage("products");
                      }
                    }}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <div className="search-suggestions">
                      {products.filter(p =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).slice(0, 5).map(product => (
                        <div
                          key={product.id}
                          className="suggestion-item"
                          onClick={() => {
                            handleViewProduct(product);
                            setSearchQuery("");
                            setIsSearchOpen(false);
                          }}
                        >
                          <img src={product.img} alt={product.name} className="suggestion-img" />
                          <div className="suggestion-info">
                            <span className="suggestion-name">{product.name}</span>
                            <span className="suggestion-price">₹{product.price}</span>
                          </div>
                        </div>
                      ))}
                      {products.filter(p =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                          <div className="no-suggestions">No products found</div>
                        )}
                    </div>
                  )}
                </>
              )}
              <button className="icon-btn search-trigger" onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery("");
              }}>
                <Search size={22} color="#4A4A4A" />
              </button>
            </div>

            {/* Wishlist Icon */}
            <button className="icon-btn" onClick={() => { setCurrentPage("wishlist"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <Heart size={22} color={wishlist.length > 0 ? "#7C3225" : "#4A4A4A"} fill={wishlist.length > 0 ? "#7C3225" : "none"} />
              {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
            </button>

            <button className="icon-btn cart-btn" onClick={() => { setCurrentPage("cartPage"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <ShoppingCart size={22} color="#4A4A4A" />
              <span className="cart-badge">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
            </button>
            {isAuthenticated ? (
              <div className="nav-dropdown user-dropdown">
                <button className="icon-btn">
                  <User size={22} color="#7C3225" />
                </button>
                <div className="dropdown-content user-dropdown-content">
                  <div className="user-info-header">
                    <button
                      className="user-name-label text-left w-full"
                      onClick={(e) => { e.preventDefault(); setCurrentPage("profile"); }}
                    >
                      {user?.name || "Member"}
                    </button>
                    <span className="user-email-label">{user?.email}</span>
                  </div>
                  <div className="mobile-nav-divider" style={{ margin: '8px 0' }} />
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage("myOrders"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    My Orders
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage("support"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Help & Support
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    Sign Out
                  </a>
                </div>
              </div>
            ) : (
              <button
                className="icon-btn"
                onClick={() => setCurrentPage("auth")}
                title="Sign In"
              >
                <User size={22} color="#4A4A4A" />
              </button>
            )}
            {/* Hamburger button - mobile only */}
            <button
              className="hamburger-btn"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} color="#7C3225" /> : <Menu size={24} color="#4A4A4A" />}
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic banner carousel immediately below the header (home page) */}
      {currentPage === "landing" && <BannerCarousel />}

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeMobileMenu(); }}>
          <nav className="mobile-nav-menu">
            <div className="mobile-nav-header">
              <img src="/logo.png" alt="Svasthya Fresh" className="mobile-nav-logo" />
              <button className="icon-btn" onClick={closeMobileMenu} aria-label="Close menu">
                <X size={24} color="#7C3225" />
              </button>
            </div>
            <div className="mobile-nav-links">
              <a href="#" className={`mobile-nav-link ${currentPage === "landing" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage("landing"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                Home
              </a>
              <div className="mobile-nav-divider" />
              <span className="mobile-nav-section-label">Products</span>
              {categories.map((cat) => (
                <a 
                  key={cat} 
                  href="#" 
                  className="mobile-nav-link mobile-nav-sub"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    handleNavigateToProducts(cat); 
                    closeMobileMenu(); 
                  }}
                >
                  {cat === "All" ? "All Products" : cat}
                </a>
              ))}
              <div className="mobile-nav-divider" />
              <a href="#" className={`mobile-nav-link ${currentPage === "ourStory" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage("ourStory"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                Our Story
              </a>
              <a href="#" className={`mobile-nav-link ${currentPage === "contact" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage("contact"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                Contact
              </a>
              {isAuthenticated && (
                <>
                  <div className="mobile-nav-divider" />
                  <a href="#" className={`mobile-nav-link ${currentPage === "myOrders" ? "active" : ""}`}
                    onClick={(e) => { e.preventDefault(); setCurrentPage("myOrders"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    My Orders
                  </a>
                  <a href="#" className={`mobile-nav-link ${currentPage === "support" ? "active" : ""}`}
                    onClick={(e) => { e.preventDefault(); setCurrentPage("support"); closeMobileMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Help & Support
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <main
        className={`main-content ${["landing", "ourStory", "contact", "auth", "addresses"].includes(currentPage) ? "has-landing" : ""} ${["checkout", "delivery", "payment"].includes(currentPage) ? "checkout-mode" : ""} ${currentPage === "orderConfirmation" ? "order-conf-mode" : ""} ${["cartPage", "details", "orderConfirmation"].includes(currentPage) ? "cart-details-mode" : ""} ${currentPage === "products" ? "products-mode" : ""} ${currentPage === "contact" ? "contact-mode" : ""}`}
      >
        <div className="page-transition-wrapper">

          {currentPage === "landing" && (
            <LandingPage
              onNavigateToProducts={handleNavigateToProducts}
              scrollToSection={scrollToSection}
              onNavigateToOurStory={() => { setCurrentPage("ourStory"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          )}
          {currentPage === "products" && (
            <ProductsPage
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onViewProduct={handleViewProduct}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              products={products}
              categories={categories}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
            />
          )}
          {currentPage === "details" && selectedProduct && (
            <ProductDetails
              key={selectedProduct.id}
              product={selectedProduct}
              products={products}
              cart={cart}
              wishlist={wishlist}
              onViewProduct={handleViewProduct}
              onBack={() => setCurrentPage("products")}
              onAddToCart={addToCart}
              onGoToCart={() => { setCurrentPage("cartPage"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onToggleWishlist={toggleWishlist}
              onShowToast={showToast}
            />
          )}
          {currentPage === "wishlist" && (
            <WishlistPage
              wishlist={wishlist}
              onAddToCart={addToCart}
              onRemove={toggleWishlist}
              onViewProduct={handleViewProduct}
              onContinueShopping={() => { setCurrentPage("products"); setActiveCategory("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onGoToCart={() => { setCurrentPage("cartPage"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onClearWishlist={handleClearWishlist}
            />
          )}
          {currentPage === "myOrders" && (
            <MyOrders
              orders={orders}
              user={user}
              onContinueShopping={() => { setCurrentPage("products"); setActiveCategory("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onViewProduct={handleViewProduct}
              onTrackOrder={handleTrackOrder}
              onContactSupport={(order) => {
                setSupportInitialOrder(order);
                setCurrentPage("support");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
          {currentPage === "orderTracking" && (
            <OrderTracking
              order={selectedOrderForTracking}
              user={user}
              addresses={addresses}
              onBack={() => {
                setCurrentPage("myOrders");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onContactSupport={() => {
                setSupportInitialOrder(selectedOrderForTracking);
                setCurrentPage("support");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
          {currentPage === "support" && (
            <SupportCenter
              orders={orders}
              products={products}
              initialOrder={supportInitialOrder}
              onGoToContactMessage={() => {
                setContactScrollTarget("message");
                setCurrentPage("contact");
              }}
              onContinueShopping={() => { setCurrentPage("products"); setActiveCategory("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          )}
          {currentPage === "cartPage" && (
            <CartPage
              cart={cart}
              apiToken={apiToken}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onClearCart={clearAllCartItems}
              onContinueShopping={() => { setCurrentPage("products"); setActiveCategory("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={setAppliedCoupon}
              onProceedToCheckout={goToCheckout}
              onShowToast={showToast}
            />
          )}
          {currentPage === "ourStory" && <OurStory />}
          {currentPage === "contact" && (
            <Contact
              onShowToast={showToast}
              apiToken={apiToken}
              scrollTarget={contactScrollTarget}
              onDidScrollToTarget={() => setContactScrollTarget(null)}
            />
          )}
          {currentPage === "checkout" && (
            <Checkout
              cart={cart}
              details={checkoutDetails}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              appliedCoupon={appliedCoupon}
              onSelectAddress={setSelectedAddressId}
              onAddAddress={handleAddAddress}
              onUpdateAddress={handleUpdateAddress}
              onDeleteAddress={handleDeleteAddress}
              onDetailsChange={handleDetailsChange}
              onBackToCart={() => {
                setCurrentPage("cartPage");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onContinue={goToDelivery}
              onNavigateStep={navigateCheckoutStep}
              onShowToast={showToast}
            />
          )}
          {currentPage === "delivery" && (
            <Delivery
              cart={cart}
              details={checkoutDetails}
              address={addresses.find(a => a.id === selectedAddressId) || addresses.find(a => a.is_default) || addresses[0]}
              appliedCoupon={appliedCoupon}
              selectedMethod={deliveryMethod}
              onSelectMethod={setDeliveryMethod}
              onBack={() => {
                setCurrentPage("checkout");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onContinue={handleDeliveryContinue}
              onNavigateStep={navigateCheckoutStep}
            />
          )}
          {currentPage === "payment" && (
            <Payment
              cart={cart}
              details={checkoutDetails}
              address={addresses.find(a => a.id === selectedAddressId) || addresses.find(a => a.is_default) || addresses[0]}
              appliedCoupon={appliedCoupon}
              selectedMethod={deliveryMethod}
              onBack={() => {
                setCurrentPage("delivery");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onPlaceOrder={handlePlaceOrder}
              onNavigateStep={navigateCheckoutStep}
            />
          )}
          {currentPage === "orderConfirmation" && (
            <OrderConfirmation
              orderId={lastOrderId}
              onContinueShopping={() => {
                setCurrentPage("products");
                setActiveCategory("All");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onReturnHome={() => {
                setCurrentPage("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
          {currentPage === "auth" && (
            <AuthPage
              isSignIn={isSignIn}
              setIsSignIn={setIsSignIn}
              handleAuth={handleAuth}
              isLoggingIn={isLoggingIn}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onOTPVerified={handleOTPVerified}
            />
          )}
          {currentPage === "profile" && (
            <ProfileDetails profile={profile} onSave={saveProfile} onRefresh={refreshProfile} />
          )}
          {currentPage === "addresses" && (
            <div className="max-w-4xl mx-auto p-6 address-page-standalone">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#7C3225]">My Addresses</h2>
                  <p className="text-gray-500">Manage your saved delivery locations</p>
                </div>
                <button
                  className="flex items-center gap-2 px-6 py-3 bg-[#7C3225] text-white rounded-full font-semibold shadow-lg hover:bg-[#5a241b] transition-all"
                  onClick={() => {
                    setSelectedAddressId(null);
                    // We need a local state for the form visibility here too, or handle it in App.jsx
                    // For simplicity, I'll use a hacky way since App.jsx is already huge.
                    // Actually, I'll just add a simple modal state to App.jsx for global address management
                    setIsAddingAddressStandalone(true);
                  }}
                >
                  <Plus size={20} /> Add New Address
                </button>
              </div>

              <div className="address-grid">
                {addresses.map((addr) => (
                  <div key={addr.id} className="address-card-item standalone">
                    <div className="address-card-header">
                      <div className="address-type-badge">
                        {addr.type === 'Home' && <Home size={16} />}
                        {addr.type === 'Office' && <Briefcase size={16} />}
                        {addr.type === 'Other' && <MapPin size={16} />}
                        {addr.type}
                        {addr.is_default && <span className="address-default-tag">DEFAULT</span>}
                      </div>
                      <div className="address-actions">
                        <button className="address-action-btn" onClick={() => { setEditingAddressStandalone(addr); setIsAddingAddressStandalone(true); }}>
                          <Edit3 size={16} />
                        </button>
                        <button className="address-action-btn" onClick={() => handleDeleteAddress(addr.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="address-content py-4">
                      <p className="font-semibold text-gray-800">{addr.building_no}, {addr.building_name}</p>
                      <p className="text-gray-600">{addr.street_no}, {addr.area_name}</p>
                      <p className="text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                    {!addr.is_default && (
                      <button
                        className="mt-2 text-sm font-semibold text-[#1AA60B] hover:underline"
                        onClick={() => handleUpdateAddress({ ...addr, is_default: true })}
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
                {addresses.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400">No addresses saved yet</h3>
                    <p className="text-gray-400">Add an address to speed up your checkout process</p>
                  </div>
                )}
              </div>

              {isAddingAddressStandalone && (
                <AddressForm
                  initialAddress={editingAddressStandalone || {}}
                  onSave={(addr) => {
                    if (editingAddressStandalone) handleUpdateAddress(addr);
                    else handleAddAddress(addr);
                    setIsAddingAddressStandalone(false);
                    setEditingAddressStandalone(null);
                  }}
                  onCancel={() => {
                    setIsAddingAddressStandalone(false);
                    setEditingAddressStandalone(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <footer id="contact" className="footer">
        <div className="footer-bg-wrapper">
          <img
            src="/footer_market.png"
            alt="Market Illustration"
            className="footer-illustration"
          />
        </div>
        <div className="footer-content">
          <div className="footer-left">
            <h2 className="footer-title">Svasthya Fresh</h2>
            <p className="footer-text">
              Bringing nature's finest to your doorstep. We believe in purity,
              authenticity, and health.
            </p>
            <div className="social-links">
              <span className="social-bubble">IG</span>
              <span className="social-bubble">WA</span>
            </div>
          </div>
          <div className="footer-right">
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage("landing"); window.scrollTo(0, 0); }}>Home</a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage("products"); setActiveCategory("All"); }}>Shop</a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage("ourStory"); window.scrollTo(0, 0); }}>Our Story</a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage("contact"); window.scrollTo(0, 0); }}>Contact</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Shipping Policy</a>
                </li>
                <li>
                  <a href="#">Returns</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="separator">|</span>
          <p>&copy; 2026 Svasthya Fresh. All rights reserved.</p>
        </div>
      </footer>

      {/* Profile completion modal (non-dismissible until saved) */}
      {showProfileModal && (
        <ProfileModal initialProfile={profile} onSave={saveProfile} />
      )}
    </div >
  );
}

export default App;
