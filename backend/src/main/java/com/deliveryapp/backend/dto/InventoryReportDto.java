package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReportDto {
    private Long totalStockUnits;
    private Long outOfStockCount;
    private Long expirySoonCount;
    private Long reorderNeededCount;
    
    // For "Stock Health Overview" - map of status -> count
    private Map<String, Long> stockHealthOverview;
    
    // For "Stock vs. Sold (Top 8)" - map of product -> stock/sold data
    private Map<String, Map<String, Long>> stockVsSoldTopProducts;
    
    // For "Monthly Stock Movement" line chart (Month -> Total Units)
    private Map<String, Long> monthlyStockMovement;
    
    // For "Inventory Details" table
    private List<InventoryDetailItem> inventoryDetailsTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryDetailItem {
        private String product;
        private String category;
        private Long stock;
        private Long sold;
        private String status; // In Stock, Low Stock, Out of Stock
        private String expiryRisk; // — (none), Soon, Critical
        private String reorderNeeded; // — (none) or Yes
    }
}
