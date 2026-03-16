package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.AnalyticsDashboardDto;
import com.deliveryapp.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Endpoints for Admin Dashboard Analytics")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Get Dashboard Metrics", description = "Retrieves total revenue, orders, users, and active products.")
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnalyticsDashboardDto> getDashboardMetrics() {
        return ResponseEntity.ok(analyticsService.getDashboardMetrics());
    }
}
