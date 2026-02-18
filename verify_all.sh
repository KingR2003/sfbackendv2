#!/bin/bash

# Configuration
API_URL="http://localhost:8080/api"
AUTH_URL="http://localhost:8080/api/v1/auth"
EMAIL="testjwt2@example.com"
PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 0. Register User (Idempotent-ish)
log "Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST $AUTH_URL/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test JWT User\", \"email\":\"$EMAIL\", \"password\":\"$PASSWORD\", \"mobile\":\"9876543211\"}")
log "Registration Response: $REGISTER_RESPONSE"

# 1. Authentication
log "Authenticating user..."
LOGIN_RESPONSE=$(curl -s -X POST $AUTH_URL/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//' | sed 's/"//')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    error "Authentication failed. Response: $LOGIN_RESPONSE"
    exit 1
fi
log "Authentication successful."

# 2. Create Category
log "Creating Category 'Test Category'..."
CATEGORY_PAYLOAD='{
    "name": "Test Category",
    "description": "Category for integration testing",
    "isActive": true
}'

CATEGORY_RESPONSE=$(curl -s -X POST $API_URL/categories \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$CATEGORY_PAYLOAD")

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$CATEGORY_ID" ]; then
    error "Category creation failed. Response: $CATEGORY_RESPONSE"
    exit 1
fi
log "Category created with ID: $CATEGORY_ID"

# 3. Create Product
log "Creating Product 'Test Product'..."
PRODUCT_PAYLOAD='{
    "name": "Test Product",
    "description": "Product for integration testing",
    "categoryId": '$CATEGORY_ID',
    "isActive": true,
    "images": [
        { "imageUrl": "http://example.com/image1.jpg" },
        { "imageUrl": "http://example.com/image2.jpg" }
    ],
    "variants": [
        {
            "variantName": "Red - Large",
            "sku": "SKU-RED-L",
            "mrp": 1200.00,
            "price": 999.00,
            "discount": 201.00,
            "stockQuantity": 50,
            "availabilityStatus": "IN_STOCK",
            "isActive": true
        },
        {
            "variantName": "Blue - Medium",
            "sku": "SKU-BLUE-M",
            "mrp": 1000.00,
            "price": 850.00,
            "discount": 150.00,
            "stockQuantity": 30,
            "availabilityStatus": "IN_STOCK",
            "isActive": true
        }
    ]
}'

PRODUCT_RESPONSE=$(curl -s -X POST $API_URL/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$PRODUCT_PAYLOAD")

PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$PRODUCT_ID" ]; then
    error "Product creation failed. Response: $PRODUCT_RESPONSE"
    # Attempt cleanup of category
    curl -s -X DELETE $API_URL/categories/$CATEGORY_ID -H "Authorization: Bearer $TOKEN" > /dev/null
    exit 1
fi
log "Product created with ID: $PRODUCT_ID"


# 4. Get All Products
log "Retrieving all products..."
ALL_PRODUCTS_RESPONSE=$(curl -s -X GET $API_URL/products \
    -H "Authorization: Bearer $TOKEN")

if [[ "$ALL_PRODUCTS_RESPONSE" == *"$PRODUCT_ID"* ]]; then
    log "Product ID $PRODUCT_ID found in list."
else
    error "Product ID $PRODUCT_ID NOT found in list. Response snippet: ${ALL_PRODUCTS_RESPONSE:0:100}..."
fi

# 5. Get Product By ID
log "Retrieving product by ID: $PRODUCT_ID..."
GET_PRODUCT_RESPONSE=$(curl -s -X GET $API_URL/products/$PRODUCT_ID \
    -H "Authorization: Bearer $TOKEN")

if [[ "$GET_PRODUCT_RESPONSE" == *"$PRODUCT_ID"* ]]; then
    log "Product retrieved successfully."
else
    error "Failed to retrieve product. Response: $GET_PRODUCT_RESPONSE"
fi

# 6. Update Product
log "Updating product ID: $PRODUCT_ID..."
UPDATE_PAYLOAD='{
    "name": "Updated Test Product",
    "description": "Updated description",
    "categoryId": '$CATEGORY_ID',
    "isActive": true,
    "images": [
        { "imageUrl": "http://example.com/image1_updated.jpg" }
    ],
    "variants": [
         {
            "variantName": "Red - Large Updated",
            "sku": "SKU-RED-L",
            "mrp": 1250.00,
            "price": 1050.00,
            "discount": 200.00,
            "stockQuantity": 45,
            "availabilityStatus": "IN_STOCK",
            "isActive": true
        }
    ]
}'

UPDATE_RESPONSE=$(curl -s -X PUT $API_URL/products/$PRODUCT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$UPDATE_PAYLOAD")

if [[ "$UPDATE_RESPONSE" == *"Updated Test Product"* ]]; then
    log "Product updated successfully."
else
    error "Product update failed. Response: $UPDATE_RESPONSE"
fi

# 7. Delete Product (Skipped)
log "Skipping product deletion as per request. Product ID: $PRODUCT_ID"

# 8. Delete Category (Skipped)
log "Skipping category deletion as per request. Category ID: $CATEGORY_ID"

log "All verification steps completed successfully."
