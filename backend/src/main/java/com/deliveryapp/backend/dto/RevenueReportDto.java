package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueReportDto {
    private BigDecimal totalRevenue;
    private Double revenueChangePercentage;
    
    // For "Monthly Revenue Trend" line chart
    private Map<String, BigDecimal> monthlyRevenueTrend;
    
    // For "Revenue by Product" bar chart
    private Map<String, BigDecimal> revenueByProduct;
    
    // For "Revenue by Age Group" donut chart
    private Map<String, BigDecimal> revenueByAgeGroup;
    
    // For "Revenue by Gender" pie chart
    private Map<String, BigDecimal> revenueByGender;
    
    // For "Revenue Breakdown by Product" table
    private List<RevenueBreakdownItem> revenueBreakdownTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueBreakdownItem {
        private String product;
        private Long unitsSold;
        private BigDecimal avgPrice;
        private BigDecimal totalRevenue;
    }
}
