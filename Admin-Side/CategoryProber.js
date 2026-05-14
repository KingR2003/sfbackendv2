console.log("Starting Category Endpoint Prober...");

async function probe() {
    try {
        console.log("1. Logging in as Admin...");
        const loginRes = await fetch("http://65.1.85.74:8082/api/v1/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@svasthya.com", password: "admin" })
        });
        const loginData = await loginRes.json();
        const token = loginData?.data?.token || loginData?.token;
        
        if (!token) {
            console.error("Login failed!", loginData);
            return;
        }
        console.log("Token retrieved successfully.");

        // We will try an array of combinations for the POST category endpoint
        const endpoints = [
            "/api/v1/admin/categories",
            "/api/v1/categories",
            "/api/categories",
            "/admin/categories",
            "/api/v1/category",
            "/api/category"
        ];
        
        // Let's also test variations of the payload
        const payloads = [
            { name: "TestCat", description: "Test", is_active: true }, // what frontend currently sends
            { name: "TestCat", description: "Test", isActive: true },  // camelCase test
            { categoryName: "TestCat", description: "Test", is_active: true } // Different key test
        ];

        for (const ep of endpoints) {
            console.log(`\nTesting Endpoint: POST ${ep}`);
            for (let i = 0; i < payloads.length; i++) {
                const res = await fetch(`http://65.1.85.74:8082${ep}`, {
                    method: "POST",
                    headers: { 
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ...payloads[i], name: payloads[i].name + `_${i}_${Date.now()}` })
                });
                
                const text = await res.text();
                if (res.ok) {
                    console.log(`✅ SUCCESS! Payload ${i+1} on ${ep} returned ${res.status}:`, text.slice(0,100));
                    return; // Stop if we find it
                } else if (res.status !== 401 && res.status !== 404 && res.status !== 405) {
                    // Not auth error, not not found, not method not allowed. Might be validation error (400) which means the route exists!
                    console.log(`⚠️ Partial Match? Route gave ${res.status}. Body:`, text.slice(0, 100));
                } else {
                    console.log(`❌ Failed (${res.status}) with payload ${i+1}`);
                }
            }
        }
        
    } catch(e) {
        console.error("Probe error:", e);
    }
}

probe();
