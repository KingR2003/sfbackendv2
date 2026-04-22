package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.*;
import com.deliveryapp.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Endpoints for Admin Dashboard Analytics")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Get Dashboard Metrics", description = "Retrieves comprehensive dashboard data including revenue, overview, product performance, metrics, alerts, etc.")
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnalyticsDashboardDto> getDashboardMetrics(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getDashboardMetrics(days));
    }

    @Operation(summary = "Get Revenue Report", description = "Retrieves revenue metrics, trends, and breakdown.")
    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RevenueReportDto> getRevenueReport(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getRevenueReport(days));
    }

    @Operation(summary = "Get Product Performance", description = "Retrieves product performance metrics.")
    @GetMapping("/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductPerformanceDto> getProductPerformance(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getProductPerformance(days));
    }

    @Operation(summary = "Get Demographic Report", description = "Retrieves customer demographics.")
    @GetMapping("/demographic")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DemographicReportDto> getDemographicReport(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getDemographicReport(days));
    }

    @Operation(summary = "Get Funnel Report", description = "Retrieves sales funnel metrics.")
    @GetMapping("/funnel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FunnelReportDto> getFunnelReport(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getFunnelReport(days));
    }

    @Operation(summary = "Get Order Status Report", description = "Retrieves order status distribution.")
    @GetMapping("/order-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderStatusReportDto> getOrderStatusReport(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getOrderStatusReport(days));
    }

    @Operation(summary = "Get Banner Analytics", description = "Retrieves view and click analytics for banners.")
    @GetMapping("/banners")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BannerAnalyticsDto> getBannerAnalytics(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getBannerAnalytics(days));
    }

    @Operation(summary = "Get Payment & Refund Report", description = "Retrieves payment methods, refund analytics, and transaction status.")
    @GetMapping("/payment-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentRefundReportDto> getPaymentRefundReport(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getPaymentRefundReport(days));
    }

    @Operation(summary = "Get Inventory Report", description = "Retrieves stock levels, inventory movement, and reorder information.")
    @GetMapping("/inventory")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InventoryReportDto> getInventoryReport(
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getInventoryReport(days));
    }
}
