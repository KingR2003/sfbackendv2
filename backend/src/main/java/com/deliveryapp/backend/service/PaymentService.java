package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.PaymentAdminDto;

import java.util.List;
import java.util.Map;

public interface PaymentService {
    Map<String, Object> getPaymentSummary();
    Map<String, Object> getPaymentMethodsCount();
    List<PaymentAdminDto> getAllPayments();
}
