# Implementation Plan - Svasthya Fresh

## Goal Description
Build a Spring Boot Backend with React/React Native frontends for Svasthya Fresh, supporting inventory, orders, users, coupons, and payments.

## Future Steps (Roadmap)

### Phase 1: Project Setup & Auth
-   Initialize Spring Boot Project (Dependencies: Web, JPA, Security, MySQL, Redis, Lombok).
-   Set up MySQL Database and Redis Cache.
-   Implement Authentication (JWT, BCrypt, Refresh Token).
-   Create User & Role Entities.

### Phase 2: Product & Inventory
-   Implement Product Entity & CRUD APIs.
-   Implement Categories & Mapping.
-   Product Image Upload (S3/Local).

### Phase 3: Cart & Coupons
-   Implement Redis-based Cart.
-   Implement Coupon Entity & Validation Logic.

### Phase 4: Orders & Payments
-   Implement Order State Machine.
-   Integrate Razorpay.
-   Implement Order Placement Flow.

### Phase 5: Production Readiness
-   Unit & Integration Tests.
-   Dockerization.
-   Deployment to Cloud.
