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
import org.springframework.beans.factory.annotation.Value;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailChangeTokenRepository emailChangeTokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.customer-frontend-url:http://localhost:5173}")
    private String customerFrontendUrl;

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
    // Authenticated user requests to change their email
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

        // Delete any existing pending token for this user
        emailChangeTokenRepository.deleteByUserId(user.getId());

        // Create a new token
        EmailChangeToken token = new EmailChangeToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setNewEmail(request.getNewEmail());
        emailChangeTokenRepository.save(token);

        // Build the verification link
        String verifyLink = customerFrontendUrl + "/verify-email?token=" + token.getToken();

        // Send verification email to the NEW address
        emailService.sendEmailVerification(request.getNewEmail(), user.getName(), verifyLink);

        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "A verification email has been sent to " + request.getNewEmail() + ". Please check your inbox and click the link to confirm the change.");
        return ResponseEntity.ok(response);
    }

    // ---------------------------------------------------------------
    // POST /api/v1/users/email/verify
    // Public endpoint — verifies the token and updates the email
    // ---------------------------------------------------------------
    @PostMapping("/email/verify")
    public ResponseEntity<Object> verifyEmailChange(@RequestParam String token) {
        Optional<EmailChangeToken> tokenOpt = emailChangeTokenRepository.findByToken(token);

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(400, "Invalid or expired verification link."));
        }

        EmailChangeToken emailToken = tokenOpt.get();

        if (emailToken.isExpired()) {
            emailChangeTokenRepository.delete(emailToken);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(400, "Verification link has expired. Please request a new one."));
        }

        // Update the user's email
        User user = emailToken.getUser();
        user.setEmail(emailToken.getNewEmail());
        userService.saveUser(user);

        // Delete the token so it cannot be reused
        emailChangeTokenRepository.delete(emailToken);

        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "Email address updated successfully!");
        return ResponseEntity.ok(response);
    }
}
