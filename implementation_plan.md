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

## Admin Address API Implementation

The goal is to allow the Admin web app to fetch/display addresses for any customer in the user management module.

## Proposed Changes

### [Component] Address Controller
#### [MODIFY] [AddressController.java](file:///c:/Users/Harsha%20nanda.A/deliveryapp-clean/sfbackendv2/src/main/java/com/deliveryapp/backend/controller/AddressController.java)
- Add `GET /api/v1/addresses/customer/{userId}` endpoint.
- Protect it with `ROLE_ADMIN` authorization.
- Call `addressService.getAddressesByUserId(userId)` to fetch addresses.

## Verification Plan

### Automated Tests
- Run `mvn clean compile` to ensure no syntax errors.

### Manual Verification
1. Login as Admin in Postman.
2. Call `GET http://15.206.163.52/api/v1/addresses/customer/5` (replace 5 with a valid user ID).
3. Verify that the addresses for that user are returned.
