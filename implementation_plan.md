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

## Profile Update & Auth Stability Fix

The goal is to fix the issue where updating the profile (specifically the mobile number) invalidates the JWT and causes issues with adding addresses. We'll make the mobile number immutable in the profile update.

### [Component] DTOs
#### [MODIFY] [UpdateProfileRequest.java](file:///c:/Users/Harsha%20nanda.A/deliveryapp-clean/sfbackendv2/src/main/java/com/deliveryapp/backend/dto/UpdateProfileRequest.java)
- Remove `mobile` field. Mobile number will be fixed.

### [Component] Services
#### [MODIFY] [UserServiceImpl.java](file:///c:/Users/Harsha%20nanda.A/deliveryapp-clean/sfbackendv2/src/main/java/com/deliveryapp/backend/service/impl/UserServiceImpl.java)
- In `updateProfile`, remove logic that updates the `mobile` number.
- Ensure only `name`, `email`, `gender`, and `dateOfBirth` are updated.

## Verification Plan

### Automated Tests
- Run `mvn clean compile` to ensure no syntax errors.

### Manual Verification
1. Login with a mobile number.
2. Update profile (without mobile number).
3. Verify that the JWT remains valid and you can still fetch your profile and add an address.
4. Verify that no duplicate user is created on re-login with the same number.
