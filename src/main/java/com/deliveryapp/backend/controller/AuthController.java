package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.LoginRequest;
import com.deliveryapp.backend.dto.LoginResponse;
import com.deliveryapp.backend.dto.RegisterRequest;
import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @Autowired
    private com.deliveryapp.backend.security.JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = jwtUtil.generateToken(loginRequest.getEmail());

            LoginResponse response = new LoginResponse(
                    token,
                    "Login successful");

            return ResponseEntity.ok(response);

        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Invalid email or password", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "An error occurred: " + e.getMessage(), null));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            // Check if email already exists
            java.util.List<User> users = userService.getAllUsers();
            boolean emailExists = users.stream()
                    .anyMatch(u -> u.getEmail().equals(registerRequest.getEmail()));

            if (emailExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse<>(false, "Email already registered", null));
            }

            // Create new user
            User newUser = new User();
            newUser.setName(registerRequest.getName());
            newUser.setEmail(registerRequest.getEmail());
            newUser.setMobile(registerRequest.getMobile());
            newUser.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newUser.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : "CUSTOMER");
            newUser.setIsActive(true);
            // newUser.setCreatedAt(LocalDateTime.now());
            // newUser.setUpdatedAt(LocalDateTime.now());

            userService.createUser(newUser);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "User registered successfully", null));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "An error occurred: " + e.getMessage(), null));
        }
    }
}
