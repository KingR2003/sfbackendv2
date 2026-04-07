package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.AnalyticsDashboardDto;
import com.deliveryapp.backend.repository.OrderRepository;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDashboardDto getDashboardMetrics() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();
        long activeProducts = productRepository.countActiveProducts();

        return new AnalyticsDashboardDto(
                totalRevenue,
                totalOrders,
                totalUsers,
                activeProducts
        );
    }
}
