const fetch = require('node-fetch');

async function testEndpoints() {
    try {
        console.log("1. Authenticating...");
        const loginRes = await fetch("http://65.1.85.74:8082/api/v1/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@svasthya.com", password: "admin" })
        });
        const loginData = await loginRes.json();
        const token = loginData?.data?.token || loginData?.token;
        
        if (!token) {
            console.error("Failed to get token! Response:", loginData);
            return;
        }
        console.log("Token acquired.");

        const endpoints = [
            "/api/v1/admin/categories",
            "/api/v1/categories",
            "/api/categories",
            "/admin/categories"
        ];

        for (const ep of endpoints) {
            console.log(`\n2. Testing POST ${ep}`);
            const res = await fetch(`http://65.1.85.74:8082${ep}`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: "TestCategoryNode",
                    description: "Created via node script",
                    is_active: true
                })
            });
            const text = await res.text();
            console.log(`Status: ${res.status}`);
            console.log(`Body excerpt: ${text.slice(0, 150)}`);
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

testEndpoints();
