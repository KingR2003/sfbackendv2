package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FunnelReportDto {
    private Long visitors;
    private Long addToCart;
    private Long checkoutStarted;
    private Long paymentCompleted;
    private Long delivered;
    
    private Double overallConversion;
    private Double cartAbandonmentRate;

    private List<FunnelStageItem> funnelSummaryTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FunnelStageItem {
        private String stage;
        private Long count;
        private Double conversionRate;
        private Double dropOffPercentage;
    }
}
