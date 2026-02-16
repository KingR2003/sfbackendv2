# Technical Flow Document - Svasthya Fresh

## 1. User Registration & Login Flow (Customer)
**Actor:** Customer Client (Mobile/Web)

1.  **User enters Mobile Number/Email.**
2.  **Client** sends `POST /api/auth/register-otp` with mobile number.
3.  **Backend** generates OTP, saves to Redis (with 5 min expiry), and sends via SMS/Email provider.
4.  **User enters OTP.**
5.  **Client** sends `POST /api/auth/verify-otp` with OTP.
6.  **Backend** validates OTP against Redis.
    -   *If valid & new user:* Create User record.
    -   *If valid & existing user:* Retrieve User record.
7.  **Backend** generates JWT Access Token & Refresh Token.
8.  **Backend** returns Tokens to Client.

## 2. Order Placement Flow
**Actor:** Customer Client

1.  **User adds items to Cart.**
    -   *Client* calls `POST /api/cart/add` -> *Backend* updates Redis Cart.
2.  **User initiates Checkout.**
    -   *Client* calls `GET /api/cart` to review.
3.  **User invokes "Place Order".**
    -   *Client* calls `POST /api/orders/checkout`.
    -   **Backend:**
        1.  Validates Stock (Database).
        2.  Calculates Total (Price * Qty - Coupon).
        3.  Creates `Order` record with status `CREATED`.
        4.  Interacts with **Razorpay** to create an Order ID.
        5.  Returns Razorpay Order ID to Client.
4.  **User completes Payment.**
    -   *Client* opens Razorpay SDK/Modal.
    -   On success, Razorpay returns `payment_id`, `signature`.
5.  **Client confirms Payment.**
    -   *Client* sends `POST /api/payments/verify` with payment details.
    -   **Backend:**
        1.  Verifies signature.
        2.  Updates Order status to `PAID`.
        3.  Clears User's Cart in Redis.
        4.  Deducts Stock in Database.
        5.  Sends Confirmation Email/Notification.

## 3. Product Management Flow (Admin)
**Actor:** Admin User

1.  **Admin logs in.** (Email/Password)
2.  **Admin submits new Product.**
    -   *Client* uploads Image -> *Backend* saves to S3/Disk -> gets URL.
    -   *Client* sends `POST /api/admin/products` with details + Image URL.
3.  **Backend:**
    -   Validates inputs.
    -   Saves `Product` to MySQL.
    -   Returns `Product` ID.

## 4. Coupon Application Flow
**Actor:** Customer Client

1.  **User enters Coupon Code.**
2.  **Client** sends `GET /api/coupons/validate?code=XYZ`.
3.  **Backend:**
    -   Checks if coupon exists and `is_active`.
    -   Checks `expiry_date`.
    -   Checks `usage_limit`.
    -   Checks `min_order_amount` vs Cart Total.
4.  **Backend** returns:
    -   `valid: true/false`
    -   `discount_amount`
    -   `message`
