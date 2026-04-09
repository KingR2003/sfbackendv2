# Wishlist API - "No Static Resource" Error Troubleshooting

## ❌ Error Messages

```
"No static resource api/v1/wishlist/add/3"
"No static resource api/v1/wishlist/2"
```

## 🔍 Root Cause Analysis

### Possible Causes (in order of likelihood):

1. **Backend Server Not Running** ⭐ MOST LIKELY
   - The backend server at `3.111.157.226` is not accessible
   - The backend hasn't started yet
   - Network connectivity issue to backend server

2. **CORS Issues**
   - Backend CORS headers not configured properly
   - Browser blocking cross-origin requests

3. **Token/Authentication Issues**
   - Invalid or expired token
   - Missing Authorization header

4. **Invalid Endpoint on Backend**
   - Backend doesn't have wishlist endpoints implemented
   - API routes not properly registered

## ✅ Step-by-Step Fix

### Step 1: Verify Backend Server is Running

Check if the backend is accessible:

```bash
# In terminal/PowerShell, test backend connectivity
curl -X GET http://3.111.157.226/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Or use Invoke-WebRequest in PowerShell
Invoke-WebRequest -Uri "http://3.111.157.226/api/v1/users/profile" \
  -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"}
```

**Expected Response:** Should return user profile data (not error)

### Step 2: Use Browser Diagnostics Script

1. Open your app in browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Copy entire contents of `WISHLIST_DIAGNOSTIC.js`
5. Paste into console and press Enter
6. Run: `runAllTests()`

**This will tell you which specific part is failing.**

### Step 3: Check Network Tab

1. Open DevTools → **Network** tab
2. Try adding a product to wishlist in the app
3. Look for the failed request (will be red)
4. Click on it and check:
   - **URL** - Should be full URL: `http://3.111.157.226/api/v1/wishlist/add/3`
   - **Method** - Should be `POST`
   - **Status** - Check what status code (5xx, 4xx, etc.)
   - **Headers** - Verify `Authorization: Bearer ...` is present
   - **Response** - Check error message from backend

### Step 4: Verify API Endpoints are Available

If backend is running, test each endpoint:

```javascript
// Test in browser console

const BASE_URL = "http://3.111.157.226";
const token = localStorage.getItem("token");

// Test 1: GET wishlist
fetch(`${BASE_URL}/api/v1/wishlist`, {
  headers: { "Authorization": `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log("✓ GET works:", d));

// Test 2: POST (add)
fetch(`${BASE_URL}/api/v1/wishlist/add/1`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({})
}).then(r => r.json()).then(d => console.log("✓ POST works:", d));

// Test 3: DELETE (remove)
fetch(`${BASE_URL}/api/v1/wishlist/1`, {
  method: "DELETE",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({})
}).then(r => r.json()).then(d => console.log("✓ DELETE works:", d));
```

## 🛠️ Common Solutions

### Solution 1: Backend Server Not Running
**If backend is DOWN:**
- SSH into the backend server
- Start the backend service/application
- Verify it's listening on correct port
- Test with curl command above

### Solution 2: CORS Issues
**If you see CORS error in console:**

The backend needs to add CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

### Solution 3: Invalid Token
**If 401 Unauthorized error:**
- User needs to login again
- Token might be expired
- Check localStorage for token: `localStorage.getItem('token')`

### Solution 4: Endpoint Not Implemented
**If 404 Not Found error:**
- Backend doesn't have wishlist endpoints
- Need to implement:
  - `POST /api/v1/wishlist/add/{productId}`
  - `DELETE /api/v1/wishlist/{productId}`
  - `GET /api/v1/wishlist`
  - `GET /api/v1/wishlist/check/{productId}`
  - Plus variant endpoints

## 📋 Checklist Before Submitting Bug Report

- [ ] Backend server is running and accessible
- [ ] Can reach backend with `curl` or Postman
- [ ] User is logged in (has valid token)
- [ ] Token is stored in localStorage
- [ ] Network tab shows full URL (with domain)
- [ ] Network response status code (not a Vite 404)
- [ ] Console shows "[API] Endpoint URL being called: http://..."
- [ ] Authorization header is present in request

## 🧪 Quick Test Command

Run this in browser console immediately:

```javascript
fetch("http://3.111.157.226/api/v1/users/profile", {
  headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
})
.then(r => console.log("Status:", r.status, r.ok ? "✓" : "✗"))
.catch(e => console.error("Error:", e.message))
```

**If THIS works:** ✓ Backend is up, auth is working  
**If THIS fails:** ✗ Backend is down or unreachable

## 📊 Expected Behavior

### Working Request (Developer Console):
```
[Wishlist] Product ID being sent: 3 Type: string
[Wishlist] Full product object: {...}
[API] addWishlistItem called with productId: 3 Type: string
[API] Endpoint URL being called: http://3.111.157.226/api/v1/wishlist/add/3
// SUCCESS - Toast message shows "added to wishlist"
```

### NOT Working Request:
```
[API] Endpoint URL being called: http://3.111.157.226/api/v1/wishlist/add/3
Wishlist toggle error: Error: No static resource api/v1/wishlist/add/3
// FAIL - Backend not responding
```

## 🆘 Still Having Issues?

Provide these details:

1. **Screenshot of Network tab** showing failed request
2. **Full error message** from console
3. **Response status code** (200, 500, 404, etc.)
4. **Response body** (right-click request → Response tab)
5. **Backend logs** if you have access
6. **Output of:** `runAllTests()` from diagnostic script

---

**Next Steps:** Run the diagnostic script and share results!
