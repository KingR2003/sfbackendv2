# Wishlist API Implementation Guide

## Overview
The wishlist API has been updated to support product variants. This allows users to save specific variants of products with their selected preferences.

---

## API Endpoints

### 1. **GET /api/v1/wishlist**
Fetches all wishlist items for the logged-in user with full variant information.

**Method:** GET  
**Authentication:** Required (Bearer Token)

**Response Example:**
```json
{
    "wishlist": [
        {
            "wishlistItemId": 68,
            "productId": 1,
            "selectedVariantId": 10,
            "productName": "Patanjali Honey",
            "productDescription": "Natural honey with...",
            "available": true,
            "images": [
                {
                    "id": 1,
                    "imageUrl": "https://..."
                }
            ],
            "variants": [
                {
                    "id": 10,
                    "variantName": "1kg",
                    "price": 250.00,
                    "availabilityStatus": "AVAILABLE"
                },
                {
                    "id": 11,
                    "variantName": "2kg",
                    "price": 480.00,
                    "availabilityStatus": "AVAILABLE"
                }
            ],
            "addedAt": "2026-04-08T10:01:38"
        }
    ],
    "count": 1,
    "message": "Wishlist retrieved successfully",
    "status": 200
}
```

---

### 2. **POST /api/v1/wishlist/add/{productId}/variant/{variantId}**
Adds a product with a specific variant to the wishlist.

**Method:** POST  
**Authentication:** Required (Bearer Token)  
**Path Parameters:**
- `productId` (integer) - The ID of the product
- `variantId` (integer) - The ID of the specific variant

**Request Example:**
```javascript
// Using the API function
addWishlistItemWithVariant(token, 1, 10);
```

**Response Example:**
```json
{
    "wishlistItemId": 68,
    "message": "Product variant added to wishlist",
    "status": 200
}
```

---

### 3. **DELETE /api/v1/wishlist/{productId}/variant/{variantId}**
Removes a product with a specific variant from the wishlist.

**Method:** DELETE  
**Authentication:** Required (Bearer Token)  
**Path Parameters:**
- `productId` (integer) - The ID of the product
- `variantId` (integer) - The ID of the specific variant

**Request Example:**
```javascript
// Using the API function
removeWishlistItemWithVariant(token, 1, 10);
```

**Response Example:**
```json
{
    "message": "Product variant removed from wishlist",
    "status": 200
}
```

---

### 4. **GET /api/v1/wishlist/check/{productId}/variant/{variantId}**
Checks if a specific product variant is in the user's wishlist.

**Method:** GET  
**Authentication:** Required (Bearer Token)  
**Path Parameters:**
- `productId` (integer) - The ID of the product
- `variantId` (integer) - The ID of the specific variant

**Request Example:**
```javascript
// Using the API function
checkWishlistItemWithVariant(token, 1, 10);
```

**Response Example:**
```json
{
    "inWishlist": true,
    "message": "Wishlist check completed",
    "status": 200
}
```

---

## API Functions in `api.jsx`

### Legacy Functions (Backward Compatible)
These functions continue to work with product IDs only:

```javascript
// Fetch all wishlist items
export const getWishlist = (token) => { ... }

// Add product to wishlist (without variant)
export const addWishlistItem = (token, productId) => { ... }

// Remove product from wishlist (without variant)
export const removeWishlistItem = (token, productId) => { ... }

// Check if product is in wishlist (without variant)
export const checkWishlistItem = (token, productId) => { ... }

// Clear entire wishlist
export const clearWishlist = (token) => { ... }
```

### New Variant-Aware Functions
These new functions support product variants:

```javascript
// Add product variant to wishlist
export const addWishlistItemWithVariant = (token, productId, variantId) => {
    const endpoint = API_ENDPOINTS.ADD_WISHLIST_ITEM_WITH_VARIANT(productId, variantId);
    return fetchJson(endpoint, {
        method: "POST",
        headers: authHeader(token),
    });
}

// Remove product variant from wishlist
export const removeWishlistItemWithVariant = (token, productId, variantId) => {
    const endpoint = API_ENDPOINTS.REMOVE_WISHLIST_ITEM_WITH_VARIANT(productId, variantId);
    return fetchJson(endpoint, {
        method: "DELETE",
        headers: authHeader(token),
    });
}

// Check if product variant is in wishlist
export const checkWishlistItemWithVariant = (token, productId, variantId) => {
    return fetchJson(API_ENDPOINTS.CHECK_WISHLIST_ITEM_WITH_VARIANT(productId, variantId), {
        headers: authHeader(token),
    });
}
```

---

## Updated API Endpoints in `apiConfig.js`

```javascript
// Wishlist
GET_WISHLIST: `${BASE_URL}/api/v1/wishlist`,

// Legacy endpoints (backward compatible)
ADD_WISHLIST_ITEM: (productId) => `${BASE_URL}/api/v1/wishlist/add/${productId}`,
REMOVE_WISHLIST_ITEM: (productId) => `${BASE_URL}/api/v1/wishlist/${productId}`,
CHECK_WISHLIST_ITEM: (productId) => `${BASE_URL}/api/v1/wishlist/check/${productId}`,
CLEAR_WISHLIST: `${BASE_URL}/api/v1/wishlist`,

// New variant-aware endpoints
ADD_WISHLIST_ITEM_WITH_VARIANT: (productId, variantId) => `${BASE_URL}/api/v1/wishlist/add/${productId}/variant/${variantId}`,
REMOVE_WISHLIST_ITEM_WITH_VARIANT: (productId, variantId) => `${BASE_URL}/api/v1/wishlist/${productId}/variant/${variantId}`,
CHECK_WISHLIST_ITEM_WITH_VARIANT: (productId, variantId) => `${BASE_URL}/api/v1/wishlist/check/${productId}/variant/${variantId}`,
```

---

## Frontend Integration

### WishlistPage Component Updates

The `WishlistPage.jsx` component has been updated to:

1. **Display Variants**: Show all available variants for each product
2. **Variant Selection**: Allow users to select/switch between variants
3. **Dynamic Pricing**: Update displayed price based on selected variant
4. **Variant-Aware State**: Track selected variants separately from product IDs

**Key Features:**
- Variant selector dropdown for products with multiple variants
- Dynamic price display based on selected variant
- Separate tracking of "add to cart" state per variant combination
- Support for both new (with selectedVariantId) and legacy response formats

**Usage Example:**
```jsx
<WishlistPage 
  wishlist={wishlistItems}
  onAddToCart={handleAddToCart}
  onRemove={handleRemove}
  onViewProduct={handleViewProduct}
  onContinueShopping={handleContinueShopping}
/>
```

---

## Response Data Structure

Each wishlist item now includes:

| Field | Type | Description |
|-------|------|-------------|
| `wishlistItemId` | integer | Unique ID of the wishlist item |
| `productId` | integer | Product ID |
| `selectedVariantId` | integer | ID of the selected/saved variant |
| `productName` | string | Name of the product |
| `productDescription` | string | Product description |
| `available` | boolean | Product availability |
| `images` | array | Array of product images |
| `variants` | array | Array of available variants |
| `addedAt` | string | Timestamp when added to wishlist |

### Variant Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Variant ID |
| `variantName` | string | Name/size of the variant (e.g., "1kg", "500ml") |
| `price` | number | Price of this variant |
| `availabilityStatus` | string | Availability status (AVAILABLE, UNAVAILABLE, etc.) |

---

## Usage Examples

### Adding a Product Variant to Wishlist

```javascript
import { addWishlistItemWithVariant } from './api';

// Add product ID 1, variant ID 10 to wishlist
const response = await addWishlistItemWithVariant(token, 1, 10);
console.log(response.message); // "Product variant added to wishlist"
```

### Removing a Product Variant from Wishlist

```javascript
import { removeWishlistItemWithVariant } from './api';

// Remove product ID 1, variant ID 10 from wishlist
const response = await removeWishlistItemWithVariant(token, 1, 10);
console.log(response.message); // "Product variant removed from wishlist"
```

### Checking if a Variant is in Wishlist

```javascript
import { checkWishlistItemWithVariant } from './api';

// Check if product ID 1, variant ID 10 is in wishlist
const response = await checkWishlistItemWithVariant(token, 1, 10);
console.log(response.inWishlist); // true or false
```

### Fetching All Wishlist Items

```javascript
import { getWishlist } from './api';

// Fetch all wishlist items with variant information
const response = await getWishlist(token);
const items = response.wishlist;

items.forEach(item => {
  console.log(`Product: ${item.productName}`);
  console.log(`Selected Variant: ${item.selectedVariantId}`);
  console.log(`Available Variants:`, item.variants);
});
```

---

## Migration from Legacy Endpoints

### If using the old API (without variants):

```javascript
// Old way (still works)
await addWishlistItem(token, productId);
await removeWishlistItem(token, productId);
await checkWishlistItem(token, productId);
```

### Migrate to new variant-aware API:

```javascript
// New way (with variant support)
const variantId = 10; // The specific variant user selected
await addWishlistItemWithVariant(token, productId, variantId);
await removeWishlistItemWithVariant(token, productId, variantId);
await checkWishlistItemWithVariant(token, productId, variantId);
```

---

## Error Handling

The API responds with appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 401 | Unauthorized (invalid token) |
| 404 | Not Found (product/variant doesn't exist) |
| 409 | Conflict (product already in wishlist) |
| 500 | Server Error |

### Example Error Handling:

```javascript
try {
  await addWishlistItemWithVariant(token, productId, variantId);
} catch (err) {
  if (err.response?.status === 409) {
    console.log("Product variant already in wishlist");
  } else if (err.response?.status === 404) {
    console.log("Product or variant not found");
  } else {
    console.error("Failed to add to wishlist:", err.message);
  }
}
```

---

## Files Updated

1. **`src/apiConfig.js`** - Added new endpoint URLs with variant support
2. **`src/api.jsx`** - Added new API functions for variant operations
3. **`src/components/WishlistPage.jsx`** - Enhanced UI to display and select variants

---

## Summary of Changes

✅ **New Endpoints:** Added 3 new variant-aware endpoints  
✅ **Backward Compatible:** All legacy endpoints continue to work  
✅ **Enhanced Response:** Wishlist items now include `selectedVariantId` and variant details  
✅ **Improved UI:** Users can now select variants from the wishlist page  
✅ **Better State Management:** Tracks selected variants separately per product  

