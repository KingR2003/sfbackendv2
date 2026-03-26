package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    @Autowired
    private OrderService orderService;

    private static final List<String> VALID_STATUSES = Arrays.asList(
            "PROCESSING", "PACKED", "ON_THE_WAY", "DELIVERED", "CANCELLED"
    );

    @GetMapping
    public ResponseEntity<Object> getAllOrders() {
        try {
            List<OrderEntity> allOrders = orderService.getAllOrders();
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Orders retrieved successfully");
            response.put("orders", allOrders);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve orders: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Object> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            OrderEntity order = orderService.getOrderById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

            String newStatus = body.get("status");
            if (newStatus == null || !VALID_STATUSES.contains(newStatus.toUpperCase())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid status. Valid statuses: " + VALID_STATUSES));
            }

            order.setOrderStatus(newStatus.toUpperCase());
            OrderEntity updatedOrder = orderService.updateOrder(id, order);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Order status updated successfully");
            response.put("order", updatedOrder);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to update order status: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getOrderDetails(@PathVariable Long id) {
        try {
            com.deliveryapp.backend.dto.OrderDetailsResponse orderDetails = orderService.getOrderDetailsWithItems(id);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Order details retrieved successfully");
            response.put("order", orderDetails.getOrder());
            response.put("customer", orderDetails.getCustomer());
            response.put("shippingAddress", orderDetails.getShippingAddress());
            response.put("items", orderDetails.getItems());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve order details: " + e.getMessage()));
        }
    }
}
