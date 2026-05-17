package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.PaymentRequest;
import com.deliveryapp.backend.dto.PaymentResponse;
import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.entity.Payment;
import com.deliveryapp.backend.enums.PaymentMethod;
import com.deliveryapp.backend.repository.OrderRepository;
import com.deliveryapp.backend.repository.PaymentRepository;
import com.deliveryapp.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        String normalizedMethod = normalizeMethod(request.getExternalMethod());
        
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(normalizedMethod);
        payment.setPaymentStatus("SUCCESS");
        payment.setCreatedAt(LocalDateTime.now());
        
        // Handle external IDs (e.g. Razorpay)
        if (request.getExternalMethod() != null && request.getExternalMethod().toLowerCase().contains("razor")) {
            payment.setRazorpayPaymentId(request.getExternalId());
        }
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update Order with payment ID
        orderRepository.findById(request.getOrderId()).ifPresent(order -> {
            order.setPaymentId(savedPayment.getId());
            orderRepository.save(order);
        });

        return PaymentResponse.builder()
                .status(200)
                .message("Payment processed and standardized successfully")
                .paymentId(savedPayment.getId())
                .method(normalizedMethod.toLowerCase())
                .build();
    }

    private String normalizeMethod(String externalMethod) {
        if (externalMethod == null || externalMethod.isBlank()) {
            return PaymentMethod.COD.name();
        }

        String method = externalMethod.toLowerCase();

        if (method.contains("upi") || method.contains("gpay") || method.contains("phonepe") || method.contains("paytm")) {
            return PaymentMethod.UPI.name();
        }

        if (method.contains("card") || method.contains("visa") || method.contains("master") || method.contains("credit") || method.contains("debit")) {
            return PaymentMethod.CARD.name();
        }

        // If unrecognized, default to COD as per requirement
        return PaymentMethod.COD.name();
    }
}
