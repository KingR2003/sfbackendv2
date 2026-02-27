package com.deliveryapp.backend.security;

import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

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

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Try by email (Admin path)
        User user = userRepository.findByEmail(username)
                .orElseGet(() ->
                    // 2. Fall back to mobile number (Customer OTP path)
                    userRepository.findByMobile(username)
                            .orElseThrow(() ->
                                new UsernameNotFoundException("User not found with email or mobile: " + username))
                );

        // OTP customers have no password hash; use empty string so DaoAuthenticationProvider
        // will never succeed — effectively disabling password-based auth for CUSTOMER role.
        String passwordHash = (user.getPasswordHash() != null) ? user.getPasswordHash() : "";

        return new org.springframework.security.core.userdetails.User(
                username,
                passwordHash,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
