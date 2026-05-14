# Wishlist Duplicate Key Error - Fix Implemented

## Problem
Getting SQL error: `Duplicate entry '30-2' for key 'wishlist_items.uq_wishlist_user_product'`

When clicking delete or wishlist button, the database constraint is being violated, causing operations to fail.

## Root Cause
This happens due to **state mismatch between frontend and backend**:
1. User clicks to add/remove item
2. Frontend optimistically updates state
3. Backend operation fails or database interprets request differently
4. Frontend and backend are now out of sync
5. Next operation tries to violate the unique constraint

## Frontend Fixes Applied

### 1. **Pre-check Before Adding** 
Before attempting to add a variant to wishlist, we now call the CHECK endpoint first to verify it doesn't already exist on the backend.

```javascript
// Pre-check if item already exists on backend before adding
const checkResult = await checkWishlistItemWithVariant(apiToken, productId, variantId);
if (checkResult.exists || checkResult.inWishlist) {
  // Item already exists, don't add again
  return;
}
```

### 2. **Detect Duplicate Key Errors**
The error handler now checks for "Duplicate entry" in error messages and handles appropriately:

```javascript
const isDuplicateError = errorMessage.includes("Duplicate entry") || errorMessage.includes("duplicate");

if (isDuplicateError && !isAlreadyWishlisted) {
  // Item already exists on backend, keep it in local state
  showToast(`${product.name} is already in your wishlist`, "info");
  return; // Don't revert state
}
```

### 3. **Variant-Aware Filtering**
All wishlist operations now properly check both productId AND variantId:

```javascript
// Check if THIS SPECIFIC VARIANT is already in wishlist
const isAlreadyWishlisted = wishlist.some((item) => 
  item.id === product.id && (item.selectedVariantId === variantId || item.variantId === variantId)
);

// Delete only that specific variant
prev.filter((item) => !(
  item.id === product.id && 
  (item.selectedVariantId === variantId || item.variantId === variantId)
))
```

## Important: Backend Database Constraint Check

The issue likely stems from the database unique constraint definition. The constraint should be:

### ✅ CORRECT (Allows multiple variants of same product)
```sql
UNIQUE KEY `uq_wishlist_user_product_variant` (user_id, product_id, variant_id)
```
This allows the same product in wishlist with different variants.

### ❌ INCORRECT (Prevents multiple variants)
```sql
UNIQUE KEY `uq_wishlist_user_product` (user_id, product_id)
```
This would prevent having the same product with different variants.

## Action Items

1. **Check your backend database schema** for the `wishlist_items` table
2. **Verify the constraint** is using all three fields: `(user_id, product_id, variant_id)`
3. **If constraint is wrong**, run migration to fix:
   ```sql
   ALTER TABLE wishlist_items DROP CONSTRAINT uq_wishlist_user_product;
   ALTER TABLE wishlist_items ADD CONSTRAINT uq_wishlist_user_product_variant UNIQUE (user_id, product_id, variant_id);
   ```

## Testing After Backend Fix

1. Add product variant 1 of a product to wishlist ✓
2. Add the SAME product but variant 2 to wishlist ✓ (should work now with correct constraint)
3. Toggle (add/remove) each variant multiple times ✓
4. Refresh page and verify variant selection persists ✓
5. Verify deletion works on all variants including the first ✓

## Files Modified
- `src/App.jsx` - Enhanced `toggleWishlist()` function with pre-check and better error handling
- `src/components/WishlistPage.jsx` - Added localStorage persistence for variant selection
