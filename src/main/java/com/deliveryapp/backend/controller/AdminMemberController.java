package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.AdminUserUpdateRequest;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
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

    @Autowired
    private com.deliveryapp.backend.service.UserService userService;

    private static final List<String> VALID_STATUSES = Arrays.asList("ACTIVE", "PENDING", "BLOCKED");
    private static final List<String> MEMBER_ROLES = Arrays.asList("ADMIN", "MANAGER", "STAFF");

    @GetMapping
    public ResponseEntity<Object> getAllMembers() {
        try {
            List<User> admins = userRepository.findAll().stream()
                    .filter(user -> user.getRole() != null && MEMBER_ROLES.contains(user.getRole().toUpperCase()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Members retrieved successfully");
            response.put("admins", admins);
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
            // Soft delete: set user as inactive instead of permanent deletion
            user.setStatus("INACTIVE");
            user.setActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "User deactivated successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to deactivate user: " + e.getMessage()));
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
            // Set active based on status (ACTIVE = true, others = false)
            user.setActive("ACTIVE".equals(newStatus.toUpperCase()));
            
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

    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse> activateUser(@PathVariable Long id) {
        try {
            userService.activateUser(id);
            return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "User activated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to activate user: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse> deactivateUser(@PathVariable Long id) {
        try {
            userService.deactivateUser(id);
            return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "User deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to deactivate user: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Object> createMember(@Valid @RequestBody AdminUserUpdateRequest request) {
        try {
            // Validate required fields
            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Name is required"));
            }
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Email is required"));
            }
            if (request.getMobile() == null || request.getMobile().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Mobile is required"));
            }

            // Check if email already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse(409, "Email already registered"));
            }

            // Check if mobile already exists
            if (userRepository.findByMobile(request.getMobile()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse(409, "Mobile number already registered"));
            }

            // Create new user
            User newUser = new User();
            newUser.setName(request.getName());
            newUser.setEmail(request.getEmail());
            newUser.setMobile(request.getMobile());
            newUser.setGender(request.getGender());
            newUser.setDateOfBirth(request.getDateOfBirth());
            
            // Set role (default to ADMIN if not specified or invalid)
            String role = request.getRole() != null && !request.getRole().isBlank() 
                    ? request.getRole().toUpperCase() : "ADMIN";
            if (!MEMBER_ROLES.contains(role)) {
                role = "ADMIN";
            }
            newUser.setRole(role);
            
            // Set status (default to ACTIVE if not specified)
            String status = request.getStatus() != null && !request.getStatus().isBlank() 
                    ? request.getStatus().toUpperCase() : "ACTIVE";
            if (!VALID_STATUSES.contains(status)) {
                status = "ACTIVE";
            }
            newUser.setStatus(status);
            
            // All new members created by admin are ACTIVE by default
            newUser.setActive(true);
            
            userRepository.save(newUser);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.CREATED.value());
            response.put("message", "Member created successfully");
            response.put("member", newUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to create member: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateMember(@PathVariable Long id, @Valid @RequestBody AdminUserUpdateRequest request) {
        try {
            User updatedUser = userService.adminUpdateUser(id, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Member updated successfully");
            response.put("member", updatedUser);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("User not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
            } else if (e.getMessage().contains("already in use")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse(HttpStatus.CONFLICT.value(), e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to update member: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to update member: " + e.getMessage()));
        }
    }
}
