# Quick 1-Minute Wishlist Status Check

## In Browser Console (F12 → Console tab) - Run This NOW:

```javascript
// COPY & PASTE THIS ENTIRE BLOCK

const BASE_URL = "http://3.111.157.226";
const token = localStorage.getItem("token");

console.log("🔍 CHECKING WISHLIST API STATUS...\n");

if (!token) {
  console.error("❌ NO TOKEN - Login first!");
} else {
  console.log("Testing endpoints...\n");

  // Test GET (simplest test)
  fetch(`${BASE_URL}/api/v1/wishlist`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(r => {
    console.log(`1. GET /api/v1/wishlist`);
    console.log(`   Status: ${r.status} ${r.ok ? "✓ WORKING" : "✗ ERROR"}`);
    return r;
  })
  .then(r => r.json().catch(() => null))
  .then(data => {
    if (data?.wishlist) console.log(`   Found ${data.wishlist.length} items`);
  })
  .catch(e => console.log(`   Error: ${e.message}`));

  // Test POST
  setTimeout(() => {
    fetch(`${BASE_URL}/api/v1/wishlist/add/1`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: "{}"
    })
    .then(r => {
      console.log(`\n2. POST /api/v1/wishlist/add/1`);
      console.log(`   Status: ${r.status} ${r.ok ? "✓ WORKING" : "✗ ERROR"}`);
      return r;
    })
    .then(r => r.json().catch(() => null))
    .then(data => {
      if (data?.wishlistItemId) console.log(`   Added with ID: ${data.wishlistItemId}`);
    })
    .catch(e => console.log(`   Error: ${e.message}`));
  }, 500);

  // Test DELETE
  setTimeout(() => {
    fetch(`${BASE_URL}/api/v1/wishlist/1`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: "{}"
    })
    .then(r => {
      console.log(`\n3. DELETE /api/v1/wishlist/1`);
      console.log(`   Status: ${r.status} ${r.ok ? "✓ WORKING" : "✗ ERROR"}`);
    })
    .catch(e => console.log(`   Status: ERROR - ${e.message}`));
  }, 1000);

  // Summary after delay
  setTimeout(() => {
    console.log(`\n${"=".repeat(50)}`);
    console.log("✅ If all show Status 200: Backend is working!");
    console.log("❌ If any show Status 500: Backend has error");
    console.log("❌ If any show ERROR: Backend is unreachable");
  }, 1500);
}
```

---

## What Each Result Means:

### ✅ Status 200 on all tests
- **Backend is working correctly**
- Wishlist endpoints are deployed and functional
- Continue using the app normally

### ❌ Status 500 on all tests
- **Backend server is running but routes not loaded**
- **FIX:** Backend has implemented the code but the server wasn't restarted
- **ACTION:** Restart backend application/service
- **Command:** `sudo systemctl restart backend` or restart Docker container

### ❌ ERROR / Connection refused
- **Backend server is DOWN**
- **ACTION:** Check if backend is running
- **Command:** `Test-NetConnection 3.111.157.226 -Port 80`

### 🔀 Mixed results (some 200, some 500)
- Check backend logs for specific endpoint errors
- Some routes might be registered, others not

---

## If Status 200 But Still Get Error in App

The backend is working, problem is in frontend or app logic:

1. Check browser F12 → Network tab
2. Look at the exact URL being called
3. Verify productId is correct (should be a number)
4. Make sure token is valid and not expired

---

## MOST LIKELY SOLUTION: Restart Backend Server

If backend endpoints were "just implemented" and you're getting 500 errors:

```bash
# SSH to your backend server and run:

# For Java/Spring Boot services:
sudo systemctl restart your-backend-service

# OR if using Docker:
docker restart backend-container

# OR manually:
ssh user@3.111.157.226
cd /path/to/backend
# Stop current process
# Start application again
```

After restart, test again with the script above.

---

## Share These Results For Help:

If the above tests show errors, copy this info:

1. Status code from each test (200, 500, ERROR, etc.)
2. Error message (if any)
3. When was backend deployed?
4. Has backend been restarted since deployment?
5. Backend logs (last 20-50 lines around the error)

