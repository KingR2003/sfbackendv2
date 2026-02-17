#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
EMAIL="testjwt2@example.com"
PASSWORD="password123"

echo "1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
-H "Content-Type: application/json" \
-d "{\"name\":\"Test JWT User\", \"email\":\"$EMAIL\", \"password\":\"$PASSWORD\", \"mobile\":\"9876543211\"}")
echo $REGISTER_RESPONSE
echo -e "\n"

echo "2a. Testing Invalid Login (Expect 401)..."
INVALID_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
-H "Content-Type: application/json" \
-d "{\"email\":\"$EMAIL\", \"password\":\"wrongpassword\"}")
echo "Invalid Login Response: $INVALID_LOGIN_RESPONSE"
echo -e "\n"

echo "2b. Logging in successfully to get token..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
-H "Content-Type: application/json" \
-d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token using grep/sed
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
echo "Token: $TOKEN"
echo -e "\n"

echo "3. Accessing protected endpoint WITHOUT token (Expect 401)..."
UNAUTH_RESPONSE=$(curl -s -X GET $BASE_URL/users/1)
echo "Response: $UNAUTH_RESPONSE"
echo -e "\n"

echo "4. Accessing protected endpoint WITH token (Expect 200)..."
# User ID is now hardcoded as it is not returned in login response
USER_ID=1
echo "User ID: $USER_ID"

if [ ! -z "$TOKEN" ]; then
    RESPONSE=$(curl -s -X GET $BASE_URL/users/$USER_ID \
    -H "Authorization: Bearer $TOKEN")
    echo $RESPONSE
else
    echo "Login failed, cannot test protected endpoint with token."
fi
echo -e "\n"
