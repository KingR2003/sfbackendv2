package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.EmailChangeRequest;
import com.deliveryapp.backend.dto.UpdateProfileRequest;
import com.deliveryapp.backend.entity.EmailChangeToken;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.EmailChangeTokenRepository;
import com.deliveryapp.backend.service.EmailService;
import com.deliveryapp.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailChangeTokenRepository emailChangeTokenRepository;

    @Autowired
    private EmailService emailService;

    private static final List<String> VALID_STATUSES = Arrays.asList("ACTIVE", "INACTIVE", "PENDING", "BLOCKED");

    @GetMapping
    public ResponseEntity<Object> getAllUsers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(403, "Access Denied"));
        }
        List<User> customers = userService.getAllCustomers();
        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "Users retrieved successfully");
        response.put("users", customers);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Object> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(403, "Access Denied"));
        }
        try {
            String newStatus = body.get("status");
            if (newStatus == null || !VALID_STATUSES.contains(newStatus.toUpperCase())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Invalid status. Valid statuses: " + VALID_STATUSES));
            }
            User updatedUser = userService.updateUserStatus(id, newStatus.toUpperCase());
            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "User status updated successfully");
            response.put("user", updatedUser);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(404, e.getMessage()));
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
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            String username = null;
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            } else if (principal instanceof String) {
                username = (String) principal;
            }
            if (username != null) {
                Optional<User> userOpt = userService.getUserByIdentifier(username);
                if (userOpt.isPresent()) {
                    return userOpt.get().getId();
                }
            }
        }
        throw new IllegalStateException("Authenticated user ID not found.");
    }

    // ---------------------------------------------------------------
    // POST /api/v1/users/email/request-change
    // Sends a 6-digit OTP to the new email address (authenticated)
    // ---------------------------------------------------------------
    @PostMapping("/email/request-change")
    public ResponseEntity<Object> requestEmailChange(@Valid @RequestBody EmailChangeRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String identifier = authentication.getName();

        Optional<User> userOpt = userService.getUserByIdentifier(identifier);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(404, "User not found"));
        }
        User user = userOpt.get();

        // Check if the new email is already taken by another account
        if (userService.getUserByIdentifier(request.getNewEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(409, "This email address is already registered to another account."));
        }

        // Delete any existing pending OTP for this user
        emailChangeTokenRepository.deleteByUserId(user.getId());

        // Generate a 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save OTP in email_change_tokens table
        EmailChangeToken otpRecord = new EmailChangeToken();
        otpRecord.setToken(otp);
        otpRecord.setUser(user);
        otpRecord.setNewEmail(request.getNewEmail());
        emailChangeTokenRepository.save(otpRecord);

        // Send OTP to the NEW email address
        emailService.sendEmailChangeOtp(request.getNewEmail(), user.getName(), otp);

        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "A 6-digit OTP has been sent to " + request.getNewEmail() + ". Enter it to confirm your email change.");
        return ResponseEntity.ok(response);
    }

    // ---------------------------------------------------------------
    // POST /api/v1/users/email/verify-otp
    // User submits the OTP received in their new email (authenticated)
    // Account data, orders & history are preserved — only email field changes
    // ---------------------------------------------------------------
    @PostMapping("/email/verify-otp")
    public ResponseEntity<Object> verifyEmailOtp(@RequestBody Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String identifier = authentication.getName();

        String otp = body.get("otp");
        if (otp == null || otp.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(400, "OTP is required."));
        }

        Optional<User> userOpt = userService.getUserByIdentifier(identifier);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(404, "User not found"));
        }
        User user = userOpt.get();

        // Find the pending OTP record for this user
        Optional<EmailChangeToken> otpRecordOpt = emailChangeTokenRepository.findByToken(otp);

        if (otpRecordOpt.isEmpty() || !otpRecordOpt.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(400, "Invalid OTP. Please try again."));
        }

        EmailChangeToken otpRecord = otpRecordOpt.get();

        if (otpRecord.isExpired()) {
            emailChangeTokenRepository.delete(otpRecord);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(400, "OTP has expired. Please request a new one."));
        }

        // Update only the email field on the SAME user record
        // All other data (orders, cart, wishlist, profile) stays intact
        user.setEmail(otpRecord.getNewEmail());
        userService.saveUser(user);

        // Delete OTP so it cannot be reused
        emailChangeTokenRepository.delete(otpRecord);

        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "Email address updated successfully! Your account information and order history remain intact.");
        response.put("newEmail", otpRecord.getNewEmail());
        return ResponseEntity.ok(response);
    }
}

