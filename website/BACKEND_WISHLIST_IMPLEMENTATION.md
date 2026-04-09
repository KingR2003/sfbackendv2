# Wishlist API - Backend Implementation Guide

## ⚠️ Current Status

**Frontend:** ✅ Ready  
**Backend:** ❌ Endpoints not implemented or misconfigured

The backend is returning HTTP 500 with message: `"No static resource api/v1/wishlist/2"`

This means the wishlist routes are not registered on the backend server.

---

## 📋 Required Endpoints

### 1. GET /api/v1/wishlist
**Retrieve all wishlist items for the logged-in user**

**Request:**
```
GET /api/v1/wishlist
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
    "wishlist": [
        {
            "wishlistItemId": 68,
            "productId": 1,
            "selectedVariantId": 10,
            "productName": "Patanjali Honey",
            "productDescription": "Natural honey with...",
            "available": true,
            "images": [
                {
                    "id": 1,
                    "imageUrl": "https://..."
                }
            ],
            "variants": [
                {
                    "id": 10,
                    "variantName": "1kg",
                    "price": 250.00,
                    "availabilityStatus": "AVAILABLE"
                },
                {
                    "id": 11,
                    "variantName": "2kg",
                    "price": 480.00,
                    "availabilityStatus": "AVAILABLE"
                }
            ],
            "addedAt": "2026-04-08T10:01:38"
        }
    ],
    "count": 1,
    "message": "Wishlist retrieved successfully",
    "status": 200
}
```

---

### 2. POST /api/v1/wishlist/add/{productId}
**Add a product to wishlist (non-variant version)**

**Request:**
```
POST /api/v1/wishlist/add/3
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
    "wishlistItemId": 69,
    "message": "Product added to wishlist",
    "status": 200
}
```

**Error Responses:**
- **409 Conflict:** Product already in wishlist
- **404 Not Found:** Product not found
- **400 Bad Request:** Invalid product ID

---

### 3. DELETE /api/v1/wishlist/{productId}
**Remove a product from wishlist**

**Request:**
```
DELETE /api/v1/wishlist/2
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
    "message": "Product removed from wishlist",
    "status": 200
}
```

**Error Responses:**
- **404 Not Found:** Product not in wishlist or doesn't exist
- **400 Bad Request:** Invalid product ID

---

### 4. GET /api/v1/wishlist/check/{productId}
**Check if a product is in wishlist**

**Request:**
```
GET /api/v1/wishlist/check/1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
    "inWishlist": true,
    "message": "Wishlist check completed",
    "status": 200
}
```

---

### 5. POST /api/v1/wishlist/add/{productId}/variant/{variantId}
**Add a product with specific variant to wishlist**

**Request:**
```
POST /api/v1/wishlist/add/1/variant/10
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
    "wishlistItemId": 70,
    "message": "Product variant added to wishlist",
    "status": 200
}
```

---

### 6. DELETE /api/v1/wishlist/{productId}/variant/{variantId}
**Remove a product with specific variant from wishlist**

**Request:**
```
DELETE /api/v1/wishlist/1/variant/10
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
    "message": "Product variant removed from wishlist",
    "status": 200
}
```

---

### 7. GET /api/v1/wishlist/check/{productId}/variant/{variantId}
**Check if a specific variant is in wishlist**

**Request:**
```
GET /api/v1/wishlist/check/1/variant/10
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
    "inWishlist": true,
    "message": "Wishlist check completed",
    "status": 200
}
```

---

## 🗄️ Database Schema

### Wishlist Table

```sql
CREATE TABLE wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    selected_variant_id INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (selected_variant_id) REFERENCES product_variants(id),
    CONSTRAINT unique_wishlist UNIQUE (user_id, product_id, selected_variant_id)
);

CREATE INDEX idx_user_wishlist ON wishlist(user_id);
CREATE INDEX idx_product ON wishlist(product_id);
```

---

## 🔐 Authentication

All endpoints require:
- **Header:** `Authorization: Bearer {token}`
- Get token from login response
- Validate token and extract user_id

---

## ✅ Implementation Checklist

- [ ] Create wishlist table in database
- [ ] Create Wishlist model/entity
- [ ] Create WishlistRepository/DAO
- [ ] Implement WishlistController
  - [ ] GET /api/v1/wishlist
  - [ ] POST /api/v1/wishlist/add/{productId}
  - [ ] DELETE /api/v1/wishlist/{productId}
  - [ ] GET /api/v1/wishlist/check/{productId}
  - [ ] POST /api/v1/wishlist/add/{productId}/variant/{variantId}
  - [ ] DELETE /api/v1/wishlist/{productId}/variant/{variantId}
  - [ ] GET /api/v1/wishlist/check/{productId}/variant/{variantId}
- [ ] Add authentication middleware
- [ ] Add request validation
- [ ] Add error handling
- [ ] Test all endpoints with Postman
- [ ] Verify CORS headers are set correctly
- [ ] Add logging for debugging

---

## 🧪 Testing with Postman/curl

### Test GET Wishlist
```bash
curl -X GET http://3.111.157.226/api/v1/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test ADD to Wishlist
```bash
curl -X POST http://3.111.157.226/api/v1/wishlist/add/3 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test REMOVE from Wishlist
```bash
curl -X DELETE http://3.111.157.226/api/v1/wishlist/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test ADD with Variant
```bash
curl -X POST http://3.111.157.226/api/v1/wishlist/add/1/variant/10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🚀 Quick Implementation Example (Spring Boot/Java)

```java
@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthenticationHelper authHelper;

    @GetMapping
    public ResponseEntity<?> getWishlist(@RequestHeader("Authorization") String token) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            List<WishlistItem> items = wishlistService.getWishlist(userId);
            return ResponseEntity.ok(Map.of(
                "wishlist", items,
                "count", items.size(),
                "message", "Wishlist retrieved successfully",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("message", e.getMessage(), "status", 500));
        }
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<?> addToWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productId) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            WishlistItem item = wishlistService.addToWishlist(userId, productId);
            return ResponseEntity.ok(Map.of(
                "wishlistItemId", item.getId(),
                "message", "Product added to wishlist",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(409)
                .body(Map.of("message", e.getMessage(), "status", 409));
        }
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productId) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            wishlistService.removeFromWishlist(userId, productId);
            return ResponseEntity.ok(Map.of(
                "message", "Product removed from wishlist",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("message", e.getMessage(), "status", 404));
        }
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<?> checkInWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productId) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            boolean inWishlist = wishlistService.isInWishlist(userId, productId);
            return ResponseEntity.ok(Map.of(
                "inWishlist", inWishlist,
                "message", "Wishlist check completed",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("message", e.getMessage(), "status", 500));
        }
    }

    @PostMapping("/add/{productId}/variant/{variantId}")
    public ResponseEntity<?> addVariantToWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            WishlistItem item = wishlistService.addToWishlist(userId, productId, variantId);
            return ResponseEntity.ok(Map.of(
                "wishlistItemId", item.getId(),
                "message", "Product variant added to wishlist",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(409)
                .body(Map.of("message", e.getMessage(), "status", 409));
        }
    }

    @DeleteMapping("/{productId}/variant/{variantId}")
    public ResponseEntity<?> removeVariantFromWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            wishlistService.removeFromWishlist(userId, productId, variantId);
            return ResponseEntity.ok(Map.of(
                "message", "Product variant removed from wishlist",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("message", e.getMessage(), "status", 404));
        }
    }

    @GetMapping("/check/{productId}/variant/{variantId}")
    public ResponseEntity<?> checkVariantInWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        try {
            Long userId = authHelper.getUserIdFromToken(token);
            boolean inWishlist = wishlistService.isInWishlist(userId, productId, variantId);
            return ResponseEntity.ok(Map.of(
                "inWishlist", inWishlist,
                "message", "Wishlist check completed",
                "status", 200
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("message", e.getMessage(), "status", 500));
        }
    }
}
```

---

## 📝 Service Layer Example

```java
@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;

    public List<WishlistItem> getWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }

    public WishlistItem addToWishlist(Long userId, Long productId) {
        // Check if product exists
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found"));
        
        // Check if already in wishlist
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new AlreadyInWishlistException("Product already in wishlist");
        }
        
        // Add to wishlist
        WishlistItem item = new WishlistItem();
        item.setUserId(userId);
        item.setProductId(productId);
        item.setAddedAt(LocalDateTime.now());
        return wishlistRepository.save(item);
    }

    public WishlistItem addToWishlist(Long userId, Long productId, Long variantId) {
        // Similar logic but with variant
        WishlistItem item = new WishlistItem();
        item.setUserId(userId);
        item.setProductId(productId);
        item.setSelectedVariantId(variantId);
        item.setAddedAt(LocalDateTime.now());
        return wishlistRepository.save(item);
    }

    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    public void removeFromWishlist(Long userId, Long productId, Long variantId) {
        wishlistRepository.deleteByUserIdAndProductIdAndSelectedVariantId(userId, productId, variantId);
    }

    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    public boolean isInWishlist(Long userId, Long productId, Long variantId) {
        return wishlistRepository.existsByUserIdAndProductIdAndSelectedVariantId(userId, productId, variantId);
    }
}
```

---

## 🔄 Frontend Already Ready

The frontend is fully implemented:
- ✅ [src/apiConfig.js](../../src/apiConfig.js) - Endpoints defined
- ✅ [src/api.jsx](../../src/api.jsx) - API functions ready
- ✅ [src/components/WishlistPage.jsx](../../src/components/WishlistPage.jsx) - UI ready

**All endpoints just need to be created on the backend server.**

---

## 📞 Next Steps

1. **Implement the 7 endpoints** listed above
2. **Test each endpoint** with Postman/curl
3. **Verify responses match** the JSON examples provided
4. **Deploy to http://3.111.157.226**
5. **Frontend will work automatically** once backend is ready

