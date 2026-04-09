// Wishlist API Diagnostic Script
// Add this to browser console to test API connectivity

const BASE_URL = "http://3.111.157.226";
const token = localStorage.getItem("token") || localStorage.getItem("authToken");

console.log("=== WISHLIST API DIAGNOSTIC ===");
console.log("Base URL:", BASE_URL);
console.log("Token present:", !!token);
console.log("Token preview:", token ? token.substring(0, 20) + "..." : "NO TOKEN");

// Test 1: Check if BASE_URL is reachable
async function testBaseUrl() {
  console.log("\n[TEST 1] Testing BASE_URL connectivity...");
  try {
    const response = await fetch(BASE_URL, { 
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("✓ BASE_URL reachable, Status:", response.status);
    return true;
  } catch (err) {
    console.error("✗ BASE_URL NOT reachable:", err.message);
    return false;
  }
}

// Test 2: Check GET_WISHLIST endpoint
async function testGetWishlist() {
  console.log("\n[TEST 2] Testing GET /api/v1/wishlist...");
  try {
    const url = `${BASE_URL}/api/v1/wishlist`;
    console.log("URL:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("✓ Response:", data);
    return true;
  } catch (err) {
    console.error("✗ Error:", err.message);
    return false;
  }
}

// Test 3: Check ADD endpoint
async function testAddWishlist(productId = 1) {
  console.log(`\n[TEST 3] Testing POST /api/v1/wishlist/add/${productId}...`);
  try {
    const url = `${BASE_URL}/api/v1/wishlist/add/${productId}`;
    console.log("URL:", url);
    console.log("Method: POST");
    console.log("Headers:", {
      "Authorization": `Bearer ${token.substring(0, 20)}...`,
      "Content-Type": "application/json"
    });
    console.log("Body:", {});
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("✓ Response:", data);
    return true;
  } catch (err) {
    console.error("✗ Error:", err.message);
    return false;
  }
}

// Test 4: Check REMOVE endpoint  
async function testRemoveWishlist(productId = 1) {
  console.log(`\n[TEST 4] Testing DELETE /api/v1/wishlist/${productId}...`);
  try {
    const url = `${BASE_URL}/api/v1/wishlist/${productId}`;
    console.log("URL:", url);
    console.log("Method: DELETE");
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("✓ Response:", data);
    return true;
  } catch (err) {
    console.error("✗ Error:", err.message);
    return false;
  }
}

// Test 5: Check variant ADD endpoint
async function testAddWishlistVariant(productId = 1, variantId = 10) {
  console.log(`\n[TEST 5] Testing POST /api/v1/wishlist/add/${productId}/variant/${variantId}...`);
  try {
    const url = `${BASE_URL}/api/v1/wishlist/add/${productId}/variant/${variantId}`;
    console.log("URL:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("✓ Response:", data);
    return true;
  } catch (err) {
    console.error("✗ Error:", err.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.clear();
  console.log("=== STARTING WISHLIST API DIAGNOSTICS ===\n");
  
  if (!token) {
    console.error("❌ NO TOKEN FOUND! Login first and try again.");
    return;
  }
  
  const test1 = await testBaseUrl();
  const test2 = await testGetWishlist();
  const test3 = await testAddWishlist(3);  // Try adding product 3
  const test4 = await testRemoveWishlist(2);  // Try removing product 2
  const test5 = await testAddWishlistVariant(3, 10);
  
  console.log("\n=== DIAGNOSTIC SUMMARY ===");
  console.log("Test 1 - Base URL:", test1 ? "✓ PASS" : "✗ FAIL");
  console.log("Test 2 - GET Wishlist:", test2 ? "✓ PASS" : "✗ FAIL");
  console.log("Test 3 - Add to Wishlist:", test3 ? "✓ PASS" : "✗ FAIL");
  console.log("Test 4 - Remove from Wishlist:", test4 ? "✓ PASS" : "✗ FAIL");
  console.log("Test 5 - Add Variant:", test5 ? "✓ PASS" : "✗ FAIL");
}

// Instructions
console.log(`
USAGE:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Copy-paste this entire script
4. Press Enter to run diagnostics
5. Report results

Or run individual tests:
- testBaseUrl()
- testGetWishlist()
- testAddWishlist(3)
- testRemoveWishlist(2)
- testAddWishlistVariant(3, 10)

Or run all at once:
- runAllTests()
`);
