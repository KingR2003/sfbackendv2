// Wishlist API Integration Test - Complete Validation
// Use this to test all 7 wishlist endpoints with the backend

console.clear();
console.log("=== WISHLIST API INTEGRATION TEST ===\n");

// Configuration
const BASE_URL = "http://3.111.157.226";
const token = localStorage.getItem("token") || localStorage.getItem("authToken");

// Helper function to make requests
async function makeRequest(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n→ ${method} ${endpoint}`);
  console.log(`  URL: ${url}`);

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`  Status: ${response.status} ${response.ok ? "✓" : "✗"}`);
    console.log(`  Response:`, data);
    
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return { status: 0, data: null, ok: false, error: error.message };
  }
}

// Test Suite
const tests = [];

async function runTests() {
  if (!token) {
    console.error("❌ NO TOKEN FOUND! Please login first.\n");
    return;
  }

  console.log(`Token: ${token.substring(0, 20)}...`);
  console.log(`\nRunning 7 required tests...\n`);
  console.log("=".repeat(60));

  // TEST 1: GET /api/v1/wishlist
  console.log("\n[TEST 1] GET /api/v1/wishlist");
  console.log("Purpose: Retrieve all wishlist items");
  const test1 = await makeRequest("GET", "/api/v1/wishlist");
  tests.push({ name: "GET Wishlist", pass: test1.ok, status: test1.status });

  // TEST 2: POST /api/v1/wishlist/add/{productId}
  console.log("\n[TEST 2] POST /api/v1/wishlist/add/1");
  console.log("Purpose: Add product 1 to wishlist");
  const test2 = await makeRequest("POST", "/api/v1/wishlist/add/1", {});
  tests.push({ name: "Add Product", pass: test2.ok, status: test2.status });

  // TEST 3: GET /api/v1/wishlist/check/{productId}
  console.log("\n[TEST 3] GET /api/v1/wishlist/check/1");
  console.log("Purpose: Check if product 1 is in wishlist");
  const test3 = await makeRequest("GET", "/api/v1/wishlist/check/1");
  tests.push({ name: "Check Product", pass: test3.ok, status: test3.status });

  // TEST 4: POST /api/v1/wishlist/add/{productId}/variant/{variantId}
  console.log("\n[TEST 4] POST /api/v1/wishlist/add/2/variant/10");
  console.log("Purpose: Add product 2 with variant 10 to wishlist");
  const test4 = await makeRequest("POST", "/api/v1/wishlist/add/2/variant/10", {});
  tests.push({ name: "Add Product + Variant", pass: test4.ok, status: test4.status });

  // TEST 5: GET /api/v1/wishlist/check/{productId}/variant/{variantId}
  console.log("\n[TEST 5] GET /api/v1/wishlist/check/2/variant/10");
  console.log("Purpose: Check if product 2 variant 10 is in wishlist");
  const test5 = await makeRequest("GET", "/api/v1/wishlist/check/2/variant/10");
  tests.push({ name: "Check Product + Variant", pass: test5.ok, status: test5.status });

  // TEST 6: DELETE /api/v1/wishlist/{productId}/variant/{variantId}
  console.log("\n[TEST 6] DELETE /api/v1/wishlist/2/variant/10");
  console.log("Purpose: Remove product 2 variant 10 from wishlist");
  const test6 = await makeRequest("DELETE", "/api/v1/wishlist/2/variant/10", {});
  tests.push({ name: "Remove Product + Variant", pass: test6.ok, status: test6.status });

  // TEST 7: DELETE /api/v1/wishlist/{productId}
  console.log("\n[TEST 7] DELETE /api/v1/wishlist/1");
  console.log("Purpose: Remove product 1 from wishlist");
  const test7 = await makeRequest("DELETE", "/api/v1/wishlist/1", {});
  tests.push({ name: "Remove Product", pass: test7.ok, status: test7.status });

  // SUMMARY
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 TEST SUMMARY\n");
  
  const passed = tests.filter(t => t.pass).length;
  const total = tests.length;
  const percentage = Math.round((passed / total) * 100);

  tests.forEach((test, idx) => {
    const icon = test.pass ? "✓" : "✗";
    const status = test.status >= 200 && test.status < 300 ? "SUCCESS" : "FAILED";
    console.log(`${idx + 1}. ${icon} ${test.name.padEnd(25)} (${test.status}) - ${status}`);
  });

  console.log(`\nResult: ${passed}/${total} tests passed (${percentage}%)`);

  if (percentage === 100) {
    console.log("\n🎉 ALL TESTS PASSED! Wishlist API is fully functional.\n");
  } else if (percentage >= 70) {
    console.log("\n⚠️  MOST TESTS PASSED - Check failed endpoints above.\n");
  } else {
    console.log("\n❌ MULTIPLE FAILURES - Backend may need fixes.\n");
  }
}

// Run tests
runTests();

console.log(`
USAGE NOTES:
============
1. Make sure you're logged in (token must exist in localStorage)
2. Open browser DevTools (F12)
3. Go to Console tab
4. Paste this entire script
5. Press Enter to run all 7 tests

Expected Results:
- All tests should return Status: 200
- GET requests return wishlist data
- POST requests return wishlistItemId
- DELETE requests return success message
- Check requests return inWishlist boolean

If any test fails with Status: 500 or 404:
- Backend endpoint might not be deployed
- Check backend logs for errors
- Verify backend is running at http://3.111.157.226
`);
