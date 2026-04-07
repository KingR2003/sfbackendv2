package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.CartResponse;
import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.CartService;
import com.deliveryapp.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin endpoints to view a specific user's cart and order history.
 * Used by the "User Details" panel (Cart tab + Orders tab) in the admin frontend.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserDataController {

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/v1/admin/users/{userId}/cart
     * Fetch the current cart of a specific user.
     */
    @GetMapping("/{userId}/cart")
    public ResponseEntity<Object> getUserCart(@PathVariable Long userId) {
        try {
            // Verify user exists
            userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            CartResponse cart = cartService.getCart(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Cart retrieved successfully");
            response.put("userId", userId);
            response.put("cart", cart);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(404, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve cart: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/admin/users/{userId}/orders
     * Fetch all orders placed by a specific user.
     */
    @GetMapping("/{userId}/orders")
    public ResponseEntity<Object> getUserOrders(@PathVariable Long userId) {
        try {
            // Verify user exists
            userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            List<OrderEntity> orders = orderService.getOrdersByUserId(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Orders retrieved successfully");
            response.put("userId", userId);
            response.put("orders", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(404, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve orders: " + e.getMessage()));
        }
    }
}
