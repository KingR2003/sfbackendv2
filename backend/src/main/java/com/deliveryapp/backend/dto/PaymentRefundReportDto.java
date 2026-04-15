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
public class PaymentRefundReportDto {
    private BigDecimal totalRevenue;
    private BigDecimal totalRefundAmount;
    private Double refundRate;
    private Double failedTransactionRate;
    
    // Payment status breakdown
    private Long paidCount;
    private Long pendingCount;
    private Long refundedCount;
    private Long failedCount;
    
    // For "Payment Method Distribution" pie chart
    private Map<String, Long> paymentMethodDistribution;
    
    // For "Revenue by Payment Method" bar chart
    private Map<String, BigDecimal> revenueByPaymentMethod;
    
    // For "Refund Trend" line chart (Month -> Count)
    private Map<String, Long> refundTrend;
    
    // For "Refund Amount Trend" line chart (Month -> Amount)
    private Map<String, BigDecimal> refundAmountTrend;
    
    // For "Payment Method Details" table
    private List<PaymentMethodDetailItem> paymentMethodDetailsTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentMethodDetailItem {
        private String paymentMethod;
        private Long transactions;
        private BigDecimal revenue;
        private Double shareOfRevenue;
    }
}
