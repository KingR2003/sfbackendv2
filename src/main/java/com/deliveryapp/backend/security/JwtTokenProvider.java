package com.deliveryapp.backend.security;

import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {
    // JWT token generation and validation methods
    
    public String generateToken(String username) {
        // Generate JWT token logic
        return null;
    }

    public String getUserFromToken(String token) {
        // Extract username from token
        return null;
    }

    public boolean validateToken(String token) {
        // Validate JWT token logic
        return false;
    }
}
