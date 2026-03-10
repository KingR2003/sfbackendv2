package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardDto {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalUsers;
    private Long activeProducts;
}
