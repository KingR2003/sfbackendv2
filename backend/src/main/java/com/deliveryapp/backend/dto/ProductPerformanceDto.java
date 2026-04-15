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
public class ProductPerformanceDto {
    private String topRevenueProduct;
    private String slowMovingProduct;
    private Long totalUnitsSold;
    private Double avgRefundRate;
    private String topCategory;
    private Integer lowOutOfStock;
    private BigDecimal topProductRevenue;

    private Map<String, BigDecimal> top5ProductsByRevenue;
    private Map<String, Long> unitsSoldByCategory;
    private Map<String, BigDecimal> monthlyProductRevenueGrowth;

    private List<ProductPerformanceItem> productPerformanceTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductPerformanceItem {
        private String product;
        private String category;
        private Long unitsSold;
        private BigDecimal revenue;
        private Long stock;
        private Double refundRate;
        private String status;
    }
}
