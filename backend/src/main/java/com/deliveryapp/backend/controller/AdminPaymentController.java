package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.PaymentAdminDto;
import com.deliveryapp.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/payments")
public class AdminPaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/summary")
    public ResponseEntity<Object> getPaymentSummary() {
        try {
            Map<String, Object> summary = paymentService.getPaymentSummary();
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Payment summary retrieved successfully");
            response.put("data", summary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve payment summary: " + e.getMessage()));
        }
    }

    @GetMapping("/methods")
    public ResponseEntity<Object> getPaymentMethodsCount() {
        try {
            Map<String, Object> methods = paymentService.getPaymentMethodsCount();
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Payment methods count retrieved successfully");
            response.put("data", methods);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve payment methods: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAllPayments() {
        try {
            List<PaymentAdminDto> payments = paymentService.getAllPayments();
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Payments retrieved successfully");
            response.put("payments", payments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve payments: " + e.getMessage()));
        }
    }
}
