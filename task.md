# SF Backend Requirements Project

- [x] Read and Analyze Requirements from `sf-backend-requirements.pdf` <!-- id: 0 -->
- [x] Create Product Requirements Document (PRD) <!-- id: 1 -->
- [x]# Svasthya Fresh Backend API Harmonization

- [ ] Audit all controllers for consistency [/]
    - [x] Review ProductController
    - [x] Review AuthController
    - [x] Review Cart and Checkout controllers
    - [x] Review Category and Address controllers
- [ ] Refactor Response Structure [x]
    - [x] Update `ApiResponse` DTO
    - [x] Implement `DataResponse<T>` for consistent payload delivery
- [ ] Harmonize API Endpoints [/]
    - [ ] Standardize on# Analytics Dashboard implementation
[x] Create `AnalyticsDashboardDto` with total revenue, total orders, total users, active products.
[x] Add `calculateTotalRevenue()` to `OrderRepository`.
[x] Add `countActiveProducts()` to `ProductRepository`.
[x] Create `AnalyticsService` and `AnalyticsServiceImpl`.
[x] Create `AdminAnalyticsController` with `GET /api/v1/admin/analytics/dashboard`.s
- [ ] Verification [ ]
    - [ ] Run Postman scenarios
    - [ ] Verify HTTP status codes

- [x] Update Order status to "PROCESSING", "PACKED", "ON_THE_WAY", "DELIVERED"
    - [x] Updated default status to "PROCESSING" in `OrderServiceImpl`
    - [x] Added `OrderController` for user order retrieval
    - [x] Added `AdminOrderController` for admin status updates
    - [x] Updated Postman Collection with these APIs
-->
