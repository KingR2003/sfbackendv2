package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.PaymentRequest;
import com.deliveryapp.backend.dto.PaymentResponse;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);
}
