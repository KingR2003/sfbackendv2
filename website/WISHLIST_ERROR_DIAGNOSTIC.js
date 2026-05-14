// Wishlist Error Diagnostic - Find the Root Cause
// Paste this in browser console (F12) and run it

console.clear();
console.log("=== WISHLIST ERROR DIAGNOSTIC ===\n");

const BASE_URL = "http://3.111.157.226";
const token = localStorage.getItem("token");

console.log("Configuration Check:");
console.log("├─ BASE_URL:", BASE_URL);
console.log("├─ Token exists:", !!token);
console.log("├─ Token preview:", token ? token.substring(0, 30) + "..." : "❌ NO TOKEN");
console.log("");

if (!token) {
  console.error("❌ CRITICAL: No token found! User must login first.");
  console.log("\nLogin first, then try again.");
  throw new Error("No authentication token");
}

// Test the actual endpoint construction
console.log("Endpoint URL Generation:");
const productId = 3;
const variantId = 10;

const urls = {
  "GET_WISHLIST": `${BASE_URL}/api/v1/wishlist`,
  "ADD_PRODUCT": `${BASE_URL}/api/v1/wishlist/add/${productId}`,
  "REMOVE_PRODUCT": `${BASE_URL}/api/v1/wishlist/${productId}`,
  "CHECK_PRODUCT": `${BASE_URL}/api/v1/wishlist/check/${productId}`,
  "ADD_VARIANT": `${BASE_URL}/api/v1/wishlist/add/${productId}/variant/${variantId}`,
  "REMOVE_VARIANT": `${BASE_URL}/api/v1/wishlist/${productId}/variant/${variantId}`,
  "CHECK_VARIANT": `${BASE_URL}/api/v1/wishlist/check/${productId}/variant/${variantId}`,
};

Object.entries(urls).forEach(([name, url]) => {
  console.log(`├─ ${name}: ${url}`);
});

console.log("\n" + "=".repeat(60) + "\n");

// Test each endpoint
async function testEndpoint(name, method, url, body = null) {
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

  console.log(`\nTesting: ${method} ${name}`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);
    console.log(`Response:`, data);

    return {
      name,
      status: response.status,
      ok: response.ok,
      data,
      error: null
    };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      name,
      status: 0,
      ok: false,
      data: null,
      error: error.message
    };
  }
}

// Run sequence of tests
async function runDiagnostics() {
  const results = [];

  console.log("STARTING ENDPOINT TESTS...\n");
  console.log("=".repeat(60));

  // Test 1: GET Wishlist
  results.push(await testEndpoint(
    "GET_WISHLIST",
    "GET",
    urls.GET_WISHLIST
  ));

  // Test 2: Add Product
  results.push(await testEndpoint(
    "ADD_PRODUCT (productId=3)",
    "POST",
    urls.ADD_PRODUCT,
    {}
  ));

  // Test 3: Check Product
  results.push(await testEndpoint(
    "CHECK_PRODUCT (productId=3)",
    "GET",
    urls.CHECK_PRODUCT
  ));

  // Test 4: Remove Product
  results.push(await testEndpoint(
    "REMOVE_PRODUCT (productId=3)",
    "DELETE",
    urls.REMOVE_PRODUCT,
    {}
  ));

  // Test 5: Add Variant
  results.push(await testEndpoint(
    "ADD_VARIANT (productId=3, variantId=10)",
    "POST",
    urls.ADD_VARIANT,
    {}
  ));

  // Test 6: Check Variant
  results.push(await testEndpoint(
    "CHECK_VARIANT (productId=3, variantId=10)",
    "GET",
    urls.CHECK_VARIANT
  ));

  // Test 7: Remove Variant
  results.push(await testEndpoint(
    "REMOVE_VARIANT (productId=3, variantId=10)",
    "DELETE",
    urls.REMOVE_VARIANT,
    {}
  ));

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 DIAGNOSTIC SUMMARY\n");

  const passed = results.filter(r => r.ok && r.status >= 200 && r.status < 300).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  results.forEach((result, idx) => {
    const icon = result.ok ? "✓" : "✗";
    const status = result.status || "CONN_ERR";
    console.log(`${idx + 1}. ${icon} ${result.name.padEnd(40)} [${status}]`);
    if (!result.ok) {
      console.log(`   Error: ${result.error || result.data?.message || "Unknown error"}`);
    }
  });

  console.log(`\nResult: ${passed}/${total} endpoints working (${percentage}%)`);

  console.log("\n" + "=".repeat(60));
  console.log("\n🔧 DIAGNOSIS:\n");

  if (percentage === 100) {
    console.log("✅ ALL TESTS PASSED!");
    console.log("The backend is working correctly.");
    console.log("If you're still getting errors in the app, check:");
    console.log("- Are you passing the correct productId?");
    console.log("- Is the productId a number or string?");
  } else if (percentage >= 50) {
    console.log("⚠️  PARTIAL FAILURES - Some endpoints have issues");
    console.log("Check the failed tests above for details.");
  } else if (percentage === 0) {
    console.log("❌ ALL TESTS FAILED");
    console.log("Possible causes:");
    console.log("1. Backend server at 3.111.157.226 is DOWN");
    console.log("2. Network connectivity issue");
    console.log("3. Backend routes not properly configured");
    console.log("\nTry: Test-NetConnection 3.111.157.226 -Port 80");
  } else {
    console.log("⚠️  MOST TESTS FAILED");
    console.log("Check backend configuration and logs");
  }
}

// Run the diagnostics
runDiagnostics();
