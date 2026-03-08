package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.UpdateProfileRequest;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<Object> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "User found");
            response.put("user", userOpt.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(404, "User not found"));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Object> getMyProfile() {
        Long userId = getAuthenticatedUserId();
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Profile retrieved successfully");
            response.put("user", userOpt.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(404, "Profile not found"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Object> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String identifier = authentication.getName();
        userService.updateProfile(identifier, request);
        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "Profile updated successfully");
        return ResponseEntity.ok(response);
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return ((User) authentication.getPrincipal()).getId();
        }
        // This should ideally not happen if security is configured correctly
        // Or throw an appropriate exception if user is not authenticated or principal
        // is not a User object
        throw new IllegalStateException("Authenticated user ID not found.");
    }
}
