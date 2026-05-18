package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAdminDto {
    private Long id;
    private Long orderId;
    private String customerName;
    private String paymentMethod;
    private BigDecimal amount;
    private BigDecimal gst;
    private String status;
    private LocalDateTime createdAt;
}
