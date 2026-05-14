# Wishlist API 500 Error - Debugging & Fix Guide

## Error Summary

```
Status: 500 Internal Server Error
Message: "No static resource api/v1/wishlist/2"
```

## Root Cause Analysis

The 500 error occurred because:

1. **Missing Content-Type Header** - DELETE/POST requests weren't explicitly setting `Content-Type: application/json`
2. **Missing Request Body** - Some REST servers expect a body in DELETE/POST requests, even if empty
3. **Server Configuration** - Backend API required explicit content type and JSON body structure

## What Was Fixed

### Before (❌ Error-prone):
```javascript
return fetchJson(endpoint, {
    method: "DELETE",
    headers: authHeader(token),
});
```

### After (✅ Fixed):
```javascript
return fetchJson(endpoint, {
    method: "DELETE",
    headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
});
```

## Updated API Functions

All wishlist API functions now include proper headers and body:

### POST Requests (Add to Wishlist)
- `addWishlistItem()` - ✅ Updated
- `addWishlistItemWithVariant()` - ✅ Updated

### DELETE Requests (Remove from Wishlist)
- `removeWishlistItem()` - ✅ Updated
- `removeWishlistItemWithVariant()` - ✅ Updated
- `clearWishlist()` - ✅ Updated

### GET Requests (Check/Fetch)
- `getWishlist()` - No change needed (GET requests work fine)
- `checkWishlistItem()` - No change needed
- `checkWishlistItemWithVariant()` - No change needed

## Changes Made

**File: `src/api.jsx`**

All wishlist functions now follow this pattern:

```javascript
return fetchJson(endpoint, {
    method: "POST" | "DELETE",
    headers: {
        ...authHeader(token),           // Authorization header
        "Content-Type": "application/json"  // Explicit content type
    },
    body: JSON.stringify({}),           // Empty JSON body
});
```

## Testing the Fix

### 1. Test Adding to Wishlist
```javascript
import { addWishlistItem } from './api';

await addWishlistItem(token, 2);
// Should now work without 500 error
```

### 2. Test Removing from Wishlist
```javascript
import { removeWishlistItem } from './api';

await removeWishlistItem(token, 2);
// Should now work without 500 error
```

### 3. Browser Console Logs
You should see:
```
[API] removeWishlistItem called with productId: 2 Type: string
[API] Endpoint URL being called: http://3.111.157.226/api/v1/wishlist/2
// (No error message, success response expected)
```

## Why This Works

### Content-Type Header
- **Purpose:** Tells the server what format the request body uses
- **Value:** `application/json` indicates JSON data
- **Importance:** Many servers reject requests without explicit content type

### Empty JSON Body
- **Purpose:** Provides consistency with server expectations
- **Value:** `JSON.stringify({})` = `"{}"`
- **Importance:** Some frameworks expect a body for DELETE/POST requests

### Header Spreading
- **Purpose:** Preserves existing auth headers while adding new ones
- **Syntax:** `{...authHeader(token), "Content-Type": "..."}` prevents overwriting Authorization header

## Common REST API Best Practices Applied

✅ Explicit `Content-Type` header for all state-changing requests  
✅ Consistent request body structure (JSON)  
✅ Proper authentication header preservation  
✅ Server expectation alignment  

## If Issues Persist

If you still see 500 errors:

1. **Check Backend Logs** - Verify server is receiving requests correctly
2. **Network Tab** - Inspect the actual request being sent:
   - Headers tab: Verify `Content-Type: application/json` and `Authorization: Bearer ...`
   - Payload tab: Should show `{}`
3. **Server Configuration** - Ensure backend REST handlers are correctly mapped
4. **CORS** - If cross-origin, verify CORS headers are set correctly

## Related Files
- `src/api.jsx` - API functions (UPDATED)
- `src/apiConfig.js` - Endpoint URLs (no changes needed)
- `src/components/WishlistPage.jsx` - UI component (no changes needed)

