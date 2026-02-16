# Product Requirements Document (PRD) - Svasthya Fresh

## 1. Introduction
**Project Name:** Svasthya Fresh Backend Application
**Purpose:** To provide a robust backend infrastructure via secure REST APIs supporting Customer Website, Mobile Applications (Android & iOS), and an Admin Web Panel.
**Core Functionality:** Inventory, Orders, Users, Coupons, and Payments.

## 2. User Roles
- **ADMIN:** Full access to manage products, inventory, orders, coupons, and payments.
- **CUSTOMER:** Can browse products, manage cart, place orders, and view order history.

## 3. Functional Requirements

### 3.1 Authentication & User Management
- **Registration (Customer):** 
  - Register via Mobile Number / Email.
  - OTP-based verification.
  - Duplicate check.
- **Login:**
  - Secure login for Admin (email/password) and Customer.
  - **Security:** JWT (Access & Refresh tokens), BCrypt for password storage.
- **Profile Management:**
  - Update profile details.
  - Manage multiple delivery addresses.
  - View order history.

### 3.2 Inventory Management (Admin Only)
- **Product Operations:**
  - Add, Edit, Soft Delete Products.
  - Activate/Deactivate Products.
  - **Attributes:** ID, Name, Description, Category, Price, Stock Quantity, Images, Availability Status, Timestamps.
- **Price Management:**
  - Real-time updates.
- **Category Management:**
  - CRUD operations for Categories.
  - Map products to categories.

### 3.3 Coupon Management
- **Admin:**
  - Create Coupons (Code, Type: %/Flat, Value, Min Order, Max Discount, Expiry, Usage Limit, Status).
- **Customer:**
  - Validate and apply coupons at checkout.
  - Validation: Expiry, Usage limit, Order conditions.

### 3.4 Cart Management
- **Storage:** Redis (User-specific).
- **Features:** Add item, Update quantity, Remove item, View summary, Apply coupon.

### 3.5 Order Management
- **Placement Flow:** Validate Cart -> Validate Inventory -> Apply Coupon -> Calculate Total -> Initiate Payment -> Create Order.
- **Order Status Lifecycle:** 
  1. `CREATED`
  2. `PAID`
  3. `PROCESSING`
  4. `OUT_FOR_DELIVERY`
  5. `DELIVERED`
  6. `CANCELLED`
- **Admin Operations:** View all orders, Update status, Cancel orders, View payment status.

### 3.6 Payment Management
- **Provider:** Razorpay.
- **Features:** Integrate Gateway, Track Status, Handle Callbacks (Webhooks), Support Refunds.

## 4. Non-Functional Requirements
- **Performance:** Low latency APIs, Redis caching for Cart.
- **Security:** Role-Based Access Control (RBAC), Secure Password Hashing, JWT Authentication.
- **Scalability:** API-driven architecture to support multiple clients.

## 5. Technology Stack
- **Backend:** Spring Boot (Java)
- **Database:** MySQL
- **Cache:** Redis
- **Payment Gateway:** Razorpay
- **Frontend (Web):** React (Admin + Customer Website)
- **Mobile:** React Native (Customer App)
