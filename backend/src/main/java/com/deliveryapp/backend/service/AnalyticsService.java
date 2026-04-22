package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.AnalyticsDashboardDto;
import com.deliveryapp.backend.dto.RevenueReportDto;
import com.deliveryapp.backend.dto.ProductPerformanceDto;
import com.deliveryapp.backend.dto.DemographicReportDto;
import com.deliveryapp.backend.dto.FunnelReportDto;
import com.deliveryapp.backend.dto.OrderStatusReportDto;
import com.deliveryapp.backend.dto.BannerAnalyticsDto;
import com.deliveryapp.backend.dto.PaymentRefundReportDto;
import com.deliveryapp.backend.dto.InventoryReportDto;

public interface AnalyticsService {
    AnalyticsDashboardDto getDashboardMetrics(int days);
    RevenueReportDto getRevenueReport(int days);
    ProductPerformanceDto getProductPerformance(int days);
    DemographicReportDto getDemographicReport(int days);
    FunnelReportDto getFunnelReport(int days);
    OrderStatusReportDto getOrderStatusReport(int days);
    BannerAnalyticsDto getBannerAnalytics(int days);
    PaymentRefundReportDto getPaymentRefundReport(int days);
    InventoryReportDto getInventoryReport(int days);
}
