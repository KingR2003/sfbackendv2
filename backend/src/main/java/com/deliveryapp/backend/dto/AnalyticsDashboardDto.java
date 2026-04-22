package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardDto {
    private BigDecimal totalRevenue;
    private Double totalRevenueChange;
    private Long totalOrders;
    private Double totalOrdersChange;
    private Long totalUsers;
    private Long activeProducts;
    
    private Double overallConversion;
    private Double overallConversionChange;
    private BigDecimal avgOrderValue;
    private Double avgOrderValueChange;

    private Map<String, BigDecimal> revenueOverview; 
    private Map<String, Long> ordersOverview; 

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductPerformanceItem {
        private String product;
        private BigDecimal revenue;
        private Long units;
    }
    private List<ProductPerformanceItem> productPerformance;

    private Map<String, Double> customerSplit; 
    private Map<String, Long> ageGroups; 

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertsData {
        private Long lowStockCount;
        private Long expiryAlertCount;
        private Double highCancellationRateStr;
        private String highRefundsMsg;
    }
    private AlertsData alerts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryHealthData {
        private Long totalStock;
        private Long outOfStock;
        private Long expirySoon;
        private Long reorderNeeded;
        private Map<String, String> specificProducts; 
    }
    private InventoryHealthData inventoryHealth;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentOrderItem {
        private String orderId;
        private String customer;
        private BigDecimal amount;
        private String status;
    }
    private List<RecentOrderItem> recentOrders;
}
