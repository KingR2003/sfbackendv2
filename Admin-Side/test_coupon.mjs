import fs from 'fs';

const BASE_URL = 'http://15.206.163.52/api/v1';

async function testApi() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "aman@svasthya.com", password: "Aman@123" })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;
    if (!token) throw new Error("No token returned");
    console.log("Login successful. Token:", token.substring(0, 10) + "...");

    // 2. Create coupon with different time formats to test
    const testCases = [
      { name: "Format 1 (HH:mm:ss)", code: "TEST1", startTime: "14:30:00", endTime: "16:45:00" },
      { name: "Format 2 (HH:mm)", code: "TEST2", startTime: "14:30", endTime: "16:45" },
      { name: "Format 3 (Date+Time)", code: "TEST3", startTime: "2025-10-10T14:30:00", endTime: "2025-10-10T16:45:00" },
      { name: "Format 4 (Date+Time+Z)", code: "TEST4", startTime: "2025-10-10T14:30:00Z", endTime: "2025-10-10T16:45:00Z" }
    ];

    for (const tc of testCases) {
      console.log(`\nTesting ${tc.name}...`);
      const payload = {
        code: tc.code,
        discountType: "Percentage",
        discountValue: 10,
        minOrderAmount: 100,
        maxDiscountAmount: 50,
        usageLimitPerUser: 1,
        daysOfWeek: "Monday",
        startTime: tc.startTime,
        endTime: tc.endTime,
        isActive: false,
        platform: "App & Web"
      };

      const res = await fetch(`${BASE_URL}/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const txt = await res.text();
      try {
        const json = JSON.parse(txt);
        console.log(`Response for ${tc.name}:`, json.status || res.status, json);
      } catch (e) {
        console.log(`Raw Response for ${tc.name}:`, res.status, txt);
      }
    }

    // 3. Fetch coupons to see what actually got saved
    console.log("\nFetching coupons to verify...");
    const getRes = await fetch(`${BASE_URL}/admin/coupons`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const getData = await getRes.json();
    const coupons = Array.isArray(getData) ? getData : (getData.data || getData.content || getData.coupons || []);
    
    for (const tc of testCases) {
      const saved = coupons.find(c => c.code === tc.code);
      if (saved) {
        console.log(`\nVerification for ${tc.name}:`);
        console.log(`  Sent startTime: ${tc.startTime} -> Saved startTime: ${saved.startTime || saved.start_time}`);
        console.log(`  Sent endTime: ${tc.endTime} -> Saved endTime: ${saved.endTime || saved.end_time}`);
        
        // Clean up: delete test coupon
        await fetch(`${BASE_URL}/admin/coupons/${saved.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        console.log(`  Deleted test coupon ${saved.id}`);
      } else {
        console.log(`\nVerification for ${tc.name}: Not found in list`);
      }
    }

  } catch (err) {
    console.error("Test failed:", err);
  }
}

testApi();
