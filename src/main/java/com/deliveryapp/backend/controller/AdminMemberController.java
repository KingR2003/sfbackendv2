package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/members")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberController {

    @Autowired
    private UserRepository userRepository;

    private static final List<String> VALID_STATUSES = Arrays.asList("ACTIVE", "INACTIVE", "PENDING");
    private static final List<String> MEMBER_ROLES = Arrays.asList("ADMIN", "MANAGER", "STAFF");

    @GetMapping
    public ResponseEntity<Object> getAllMembers() {
        try {
            List<User> allUsers = userRepository.findAll();
            
            // Return only active users, mirroring logical deletion
            List<User> activeUsers = allUsers.stream()
                    .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
                    .collect(Collectors.toList());

            List<User> admins = activeUsers.stream()
                    .filter(user -> user.getRole() != null && MEMBER_ROLES.contains(user.getRole().toUpperCase()))
                    .collect(Collectors.toList());

            List<User> customers = activeUsers.stream()
                    .filter(user -> user.getRole() == null || "CUSTOMER".equalsIgnoreCase(user.getRole()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Users retrieved successfully");
            response.put("admins", admins);
            response.put("users", customers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve members: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
            user.setStatus("INACTIVE");
            user.setActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "User deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to delete user: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Object> updateMemberStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));

            if (user.getRole() == null || !MEMBER_ROLES.contains(user.getRole().toUpperCase())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "User is not a staff member/admin"));
            }

            String newStatus = body.get("status");
            if (newStatus == null || !VALID_STATUSES.contains(newStatus.toUpperCase())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid status. Valid statuses: " + VALID_STATUSES));
            }

            user.setStatus(newStatus.toUpperCase());
            if ("ACTIVE".equalsIgnoreCase(newStatus)) {
                user.setActive(true);
            } else {
                user.setActive(false);
            }
            
            User updatedUser = userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Member status updated successfully");
            response.put("member", updatedUser);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to update member status: " + e.getMessage()));
        }
    }
}
