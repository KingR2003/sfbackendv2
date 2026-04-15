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
public class OrderStatusReportDto {
    private Long totalOrders;
    private Long totalDelivered;
    private Double cancelledPercentage;
    private Double deliveredPercentage;
    private Long returnInProgress;
    private Long returned;
    private Long cancelledOrders;

    private Map<String, Long> orderStatusDistribution;
    
    // Structure: Month (e.g., "Jan") -> Map<Status, Count>
    private Map<String, Map<String, Long>> monthlyStatusBreakdown;
    
    private Map<String, Long> cancellationTrend;

    private List<StatusDistributionItem> statusDistributionTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusDistributionItem {
        private String status;
        private Long count;
        private Double percentage;
    }
}
