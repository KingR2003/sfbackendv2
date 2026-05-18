package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.PaymentAdminDto;
import com.deliveryapp.backend.entity.Payment;
import com.deliveryapp.backend.repository.OrderRepository;
import com.deliveryapp.backend.repository.PaymentRepository;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Map<String, Object> getPaymentSummary() {
        List<Payment> allPayments = paymentRepository.findAll();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal processing = BigDecimal.ZERO;
        BigDecimal refunded = BigDecimal.ZERO;

        for (Payment p : allPayments) {
            String status = p.getPaymentStatus();
            if (status == null) continue;
            
            if ("SUCCESS".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                if (p.getAmount() != null) totalRevenue = totalRevenue.add(p.getAmount());
            } else if ("PENDING".equalsIgnoreCase(status)) {
                if (p.getAmount() != null) processing = processing.add(p.getAmount());
            } else if ("REFUNDED".equalsIgnoreCase(status)) {
                if (p.getAmount() != null) refunded = refunded.add(p.getAmount());
            }
        }

        BigDecimal totalExpected = totalRevenue.add(processing);
        double collectionProgress = 0.0;
        if (totalExpected.compareTo(BigDecimal.ZERO) > 0) {
            collectionProgress = totalRevenue.doubleValue() / totalExpected.doubleValue() * 100.0;
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("processing", processing);
        summary.put("refunded", refunded);
        
        // Format to 1 decimal place to match UI (e.g. 0.0%)
        summary.put("collectionProgress", Math.round(collectionProgress * 10.0) / 10.0);
        
        return summary;
    }

    @Override
    public Map<String, Object> getPaymentMethodsCount() {
        List<Payment> allPayments = paymentRepository.findAll();
        long card = 0, upi = 0, cash = 0;

        for (Payment p : allPayments) {
            String method = p.getPaymentMethod();
            if (method == null) method = "COD";
            
            String lowerMethod = method.toLowerCase();
            if (lowerMethod.contains("card") || lowerMethod.contains("visa") || lowerMethod.contains("master")) {
                card++;
            } else if (lowerMethod.contains("upi") || lowerMethod.contains("gpay") || lowerMethod.contains("paytm") || lowerMethod.contains("phonepe")) {
                upi++;
            } else {
                // Default everything else to Cash/COD
                cash++;
            }
        }

        Map<String, Object> counts = new HashMap<>();
        counts.put("allMethods", allPayments.size());
        counts.put("card", card);
        counts.put("upi", upi);
        counts.put("cash", cash);
        return counts;
    }

    @Override
    public List<PaymentAdminDto> getAllPayments() {
        List<Payment> allPayments = paymentRepository.findAll();
        
        return allPayments.stream().map(p -> {
            PaymentAdminDto dto = new PaymentAdminDto();
            dto.setId(p.getId());
            dto.setOrderId(p.getOrderId());
            dto.setPaymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod() : "COD");
            dto.setAmount(p.getAmount());
            
            if (p.getAmount() != null) {
                dto.setGst(p.getAmount().multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP));
            } else {
                dto.setGst(BigDecimal.ZERO);
            }
            
            // Map SUCCESS to Completed for UI
            String status = p.getPaymentStatus();
            if ("SUCCESS".equalsIgnoreCase(status)) status = "Completed";
            dto.setStatus(status != null ? status : "Pending");
            
            dto.setCreatedAt(p.getCreatedAt());

            if (p.getOrderId() != null) {
                orderRepository.findById(p.getOrderId()).ifPresent(order -> {
                    if (order.getUserId() != null) {
                        userRepository.findById(order.getUserId()).ifPresent(user -> {
                            dto.setCustomerName(user.getName());
                        });
                    }
                });
            }
            return dto;
        }).collect(Collectors.toList());
    }
}
