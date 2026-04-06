package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.User;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Service to manage token persistence and revocation (logout).
 */
public interface TokenService {

    /**
     * Persists token record and active status in the database.
     */
    void persistToken(User user, String token, String clientType, HttpServletRequest request);

    /**
     * Invalidates a token by removing it from the database whitelist.
     */
    void invalidateToken(String token);
}
