#!/bin/bash

BASE_URL="http://localhost:8080"
JSON_HEADER="Content-Type: application/json"

echo "========================================"
echo "Starting Comprehensive API Verification"
echo "========================================"

# 1. Health Check
echo -e "\n[1] Health Check..."
curl -s "$BASE_URL/api/v1/health"
echo ""

# 2. Auth - Register
echo -e "\n[2] Registering User..."
REGISTER_PAYLOAD='{"name":"Test User", "email":"test@example.com", "mobile":"1234567890", "password":"password123", "role":"CUSTOMER"}'
curl -s -X POST -H "$JSON_HEADER" -d "$REGISTER_PAYLOAD" "$BASE_URL/api/v1/auth/register"
echo ""

# 3. Auth - Login
echo -e "\n[3] Logging in..."
LOGIN_PAYLOAD='{"email":"test@example.com", "password":"password123"}'
curl -s -X POST -H "$JSON_HEADER" -d "$LOGIN_PAYLOAD" "$BASE_URL/api/v1/auth/login"
echo ""

# 4. Category - Create
echo -e "\n[4] Creating Category..."
CATEGORY_PAYLOAD='{"name":"Electronics", "description":"Gadgets", "isActive":true}'
curl -s -X POST -H "$JSON_HEADER" -d "$CATEGORY_PAYLOAD" "$BASE_URL/api/categories"
echo ""

# 5. Category - Get All
echo -e "\n[5] Getting All Categories..."
curl -s "$BASE_URL/api/categories"
echo ""

# 6. Product - Create
echo -e "\n[6] Creating Product..."
PRODUCT_PAYLOAD='{"name":"Laptop", "description":"Gaming Laptop", "categoryId":1, "isActive":true}'
curl -s -X POST -H "$JSON_HEADER" -d "$PRODUCT_PAYLOAD" "$BASE_URL/api/products"
echo ""

# 7. Product - Get All
echo -e "\n[7] Getting All Products..."
curl -s "$BASE_URL/api/products"
echo ""

# 8. Product - Create Second Product
echo -e "\n[8] Creating Second Product (Headphones)..."
PRODUCT2_PAYLOAD='{"name":"Headphones", "description":"Noise Cancelling", "categoryId":1, "isActive":true}'
curl -s -X POST -H "$JSON_HEADER" -d "$PRODUCT2_PAYLOAD" "$BASE_URL/api/products"
echo ""

# 9. Product - Get All (Should have 2)
echo -e "\n[9] Getting All Products (Expect 2)..."
curl -s "$BASE_URL/api/products"
echo ""

# 10. Product - Update Product 1
echo -e "\n[10] Updating Product 1..."
UPDATE_PRODUCT_PAYLOAD='{"name":"Gaming Laptop Pro", "description":"High End", "categoryId":1, "isActive":true}'
curl -s -X PUT -H "$JSON_HEADER" -d "$UPDATE_PRODUCT_PAYLOAD" "$BASE_URL/api/products/1"
echo ""

# 10.5 Product - Get Product 1 (Check Timestamps)
echo -e "\n[10.5] Getting Product 1 after update..."
curl -s "$BASE_URL/api/products/1"
echo ""

# 11. Product - Delete Product 1
echo -e "\n[11] Deleting Product 1..."
curl -s -X DELETE "$BASE_URL/api/products/1"
echo ""

# 12. Product - Get All (Should have 1)
echo -e "\n[12] Getting All Products (Expect 1 ie Headphones)..."
curl -s "$BASE_URL/api/products"
echo ""

echo -e "\n========================================"
echo "Verification Complete"
echo "========================================"
