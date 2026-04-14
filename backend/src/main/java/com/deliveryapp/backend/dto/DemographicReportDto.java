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
public class DemographicReportDto {
    private Long totalCustomers;
    private Long newCustomers;
    private Double returningCustomersPercentage;
    private BigDecimal totalRevenue;

    private Map<String, Long> newVsReturning;
    private Map<String, Long> genderDistribution;
    private Map<String, Long> ageDistribution;
    
    private Map<String, BigDecimal> revenueByGender;
    private Map<String, BigDecimal> revenueByAgeGroup;

    private List<TopCustomerItem> topCustomersTable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopCustomerItem {
        private String customer;
        private String gender;
        private String age;
        private String location;
        private Long orders;
        private BigDecimal revenue;
    }
}
