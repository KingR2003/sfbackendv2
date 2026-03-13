package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Object> getUserOrders() {
        Long userId = getAuthenticatedUserId();
        try {
            List<OrderEntity> allOrders = orderService.getAllOrders();
            List<OrderEntity> userOrders = allOrders.stream()
                    .filter(order -> order.getUserId().equals(userId))
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Orders retrieved successfully");
            response.put("orders", userOrders);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve orders: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getOrderDetails(@PathVariable Long id) {
        Long userId = getAuthenticatedUserId();
        try {
            OrderEntity order = orderService.getOrderById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
            
            if (!order.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(HttpStatus.FORBIDDEN.value(), "Access denied"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Order details retrieved successfully");
            response.put("order", order);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve order details: " + e.getMessage()));
        }
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String username = authentication.getName();
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByMobile(username)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username)));
        return user.getId();
    }
}
