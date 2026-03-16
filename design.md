# System Design Document - Svasthya Fresh

## 1. Architecture Overview
**Pattern:** Microservices or Modular Monolith (Starting with Monolith for simplicity/speed as per "Centralized backend application" requirement).
**Style:** API-Driven Architecture.

### High-Level Components
1.  **Clients:**
    -   Customer Web App (React)
    -   Customer Mobile App (React Native - iOS/Android)
    -   Admin Web Panel (React)
2.  **API Gateway / Load Balancer:** (Optional for now, Nginx/Cloud LB)
3.  **Backend Application:** Spring Boot Monolith
4.  **Data Storage:** MySQL (Relational Data)
5.  **Caching:** Redis (Cart & Session)
6.  **Object Storage:** AWS S3 or Local (Product Images)
7.  **Payment Gateway:** Razorpay

## 2. Database Schema (ER Diagram Concept)

### Tables
-   **Users:** `id`, `name`, `email`, `phone`, `password_hash`, `role` (ADMIN/CUSTOMER), `created_at`.
-   **Addresses:** `id`, `user_id`, `street`, `city`, `zip`, `type`.
-   **Products:** `id`, `name`, `description`, `price`, `stock_quantity`, `category_id`, `image_url`, `is_active`, `is_deleted`.
-   **Categories:** `id`, `name`, `parent_id`.
-   **Coupons:** `id`, `code`, `discount_type`, `value`, `min_order_amount`, `max_discount`, `expiry_date`, `usage_limit`.
-   **Orders:** `id`, `user_id`, `total_amount`, `status`, `payment_id`, `shipping_address_id`, `created_at`.
-   **OrderItems:** `id`, `order_id`, `product_id`, `quantity`, `price_at_time`.
-   **Payments:** `id`, `order_id`, `transaction_id`, `amount`, `status`, `provider` (Razorpay).

## 3. API Design (Key Endpoints)

### Auth
-   `POST /api/auth/register` (Customer)
-   `POST /api/auth/login` (Admin/Customer)
-   `POST /api/auth/refresh-token`

### Products
-   `GET /api/products` (Public, Filters: Category, Search)
-   `GET /api/products/{id}` (Public)
-   `POST /api/admin/products` (Admin)
-   `PUT /api/admin/products/{id}` (Admin)
-   `DELETE /api/admin/products/{id}` (Admin - Soft Delete)

### Cart
-   `GET /api/cart` (Auth)
-   `POST /api/cart/add` (Auth)
-   `PUT /api/cart/update` (Auth)
-   `DELETE /api/cart/remove` (Auth)

### Orders
-   `POST /api/orders/checkout` (Auth)
-   `GET /api/orders` (Auth - History)
-   `GET /api/admin/orders` (Admin - All)
-   `PUT /api/admin/orders/{id}/status` (Admin)

### Coupons
-   `GET /api/coupons/validate?code={code}` (Auth)
-   `POST /api/admin/coupons` (Admin)

## 4. Security Design
-   **Authentication:** JWT (Stateless).
-   **Authorization:** Role-based (Spring Security).
-   **Data Protection:** HTTPS, BCrypt for passwords.
-   **Input Validation:** Spring Validation (@Valid).

## 5. Scalability & Performance
-   **Database:** Indexing on frequent query columns (category_id, user_id).
-   **Caching:** Redis for Cart (fast access) and potentially for Product inputs.
-   **Stateless:** Backend allows horizontal scaling.
