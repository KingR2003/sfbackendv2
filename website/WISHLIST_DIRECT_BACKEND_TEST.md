# Wishlist API Direct Backend Test

Run these commands in PowerShell to test your backend directly:

## Prerequisites
First, get your token (after login, check localStorage):
```powershell
$token = "YOUR_TOKEN_HERE"  # Get from browser console: localStorage.getItem('token')
$BASE_URL = "http://3.111.157.226"
```

## Test 1: GET Wishlist (GET /api/v1/wishlist)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist" `
    -Method GET `
    -Headers $headers `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with wishlist data

---

## Test 2: Add Product (POST /api/v1/wishlist/add/3)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = "{}"

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/add/3" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with wishlistItemId

---

## Test 3: Check Product (GET /api/v1/wishlist/check/3)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/check/3" `
    -Method GET `
    -Headers $headers `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with inWishlist: true

---

## Test 4: Remove Product (DELETE /api/v1/wishlist/3)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = "{}"

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/3" `
    -Method DELETE `
    -Headers $headers `
    -Body $body `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with success message

---

## Test 5: Add with Variant (POST /api/v1/wishlist/add/1/variant/10)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = "{}"

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/add/1/variant/10" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with wishlistItemId

---

## Test 6: Check with Variant (GET /api/v1/wishlist/check/1/variant/10)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/check/1/variant/10" `
    -Method GET `
    -Headers $headers `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with inWishlist: true/false

---

## Test 7: Remove with Variant (DELETE /api/v1/wishlist/1/variant/10)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = "{}"

Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/1/variant/10" `
    -Method DELETE `
    -Headers $headers `
    -Body $body `
    -ErrorAction Stop | Select-Object StatusCode, Content
```

Expected: Status 200 with success message

---

## Quick Test Script (All in one)

```powershell
# Set your token
$token = "YOUR_TOKEN_HERE"
$BASE_URL = "http://3.111.157.226"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Testing Wishlist API Endpoints..."
Write-Host ""

# Test 1: GET
Write-Host "1. GET /api/v1/wishlist"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)"
}

Write-Host ""

# Test 2: POST
Write-Host "2. POST /api/v1/wishlist/add/3"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/add/3" -Method POST -Headers $headers -Body "{}" -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)"
}

Write-Host ""

# Test 3: GET Check
Write-Host "3. GET /api/v1/wishlist/check/3"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/check/3" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)"
}

Write-Host ""

# Test 4: DELETE
Write-Host "4. DELETE /api/v1/wishlist/3"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/wishlist/3" -Method DELETE -Headers $headers -Body "{}" -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)"
}
```

---

## How to Get Your Token

1. Open your app in browser
2. Press F12
3. Go to Console tab
4. Type: `localStorage.getItem('token')`
5. Copy the token value (without quotes)
6. Use it in the commands above

---

## If You Get 500 Errors

That means the backend endpoint exists but has an internal error.

Common causes:
1. **Backend not redeployed** - Implementation might not be live yet
2. **Database connection issue** - Check backend logs
3. **User authentication issue** - Token might be invalid/expired
4. **Route parameter mismatch** - Path might need to be different format

**Share the error response** to help debug further.

---

## If You Get Connection Refused

That means the backend server at 3.111.157.226 is not responding.

Actions:
1. Verify server is running: `Test-NetConnection 3.111.157.226 -Port 80`
2. Check if server is reachable
3. Try: `curl http://3.111.157.226/api/v1/users/profile -H "Authorization: Bearer $token"`

If that doesn't work, backend server might be down.

---

## Steps to Fix

1. **Run Test 1 (GET /api/v1/wishlist)** - Should work if backend is up
2. **If Status 200:** Backend is working, routes exist
3. **If Status 500:** Backend has error, needs debugging
4. **If Connection Refused:** Backend server is down

Share the results and I'll help debug further!
