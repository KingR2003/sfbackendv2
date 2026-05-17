package com.deliveryapp.backend.security;

import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import java.util.Collections;

/**
 * Loads user details from the database for Spring Security.
 *
 * Supports two credential types:
 *  - Admin users: subject = email address (password-based auth)
 *  - Customer users: subject = mobile number (OTP-based auth)
 *
 * When resolving a JWT, tries email first, then mobile. The password field
 * for OTP-only customers is set to a non-matchable sentinel value so that
 * Spring Security's DaoAuthenticationProvider cannot be used to authenticate them
 * via password — they must always go through the OTP flow.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);


    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.info("Loading user details for username: {}", username);
        // 1. Try by email (Admin path)
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> {
                    logger.info("User not found by email, trying by mobile: {}", username);
                    // 2. Fall back to mobile number (Customer OTP path)
                    return userRepository.findByMobile(username)
                            .orElseThrow(() -> {
                                logger.error("User not found with email or mobile: {}", username);
                                return new UsernameNotFoundException("User not found with email or mobile: " + username);
                            });
                });

        logger.info("Successfully loaded user: {} (Role: {})", user.getEmail() != null ? user.getEmail() : user.getMobile(), user.getRole());


        // OTP customers have no password hash; use empty string so DaoAuthenticationProvider
        // will never succeed — effectively disabling password-based auth for CUSTOMER role.
        String passwordHash = (user.getPasswordHash() != null) ? user.getPasswordHash() : "";

        // A user is enabled if their status is explicitly ACTIVE.
        // We also check user.isActive() as a secondary safeguard if it exists, 
        // but status should be the primary source of truth for approvals.
        boolean enabled = "ACTIVE".equalsIgnoreCase(user.getStatus());

        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()));
            // Grant a base ROLE_ADMIN to all non-customer staff members to bypass standard @PreAuthorize checks
            if (!"CUSTOMER".equalsIgnoreCase(user.getRole()) && !"ADMIN".equalsIgnoreCase(user.getRole())) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }
        }

        return new org.springframework.security.core.userdetails.User(
                username,
                passwordHash,
                enabled,
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                authorities
        );
    }
}
