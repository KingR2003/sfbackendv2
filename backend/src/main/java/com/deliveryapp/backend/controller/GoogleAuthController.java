package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.GoogleAuthRequest;
import com.deliveryapp.backend.dto.OtpResponse;
import com.deliveryapp.backend.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class GoogleAuthController {

    @Autowired
    private GoogleAuthService googleAuthService;

    /**
     * Google Sign-In for mobile app and website.
     * Frontend completes Google sign-in and sends the ID token here.
     * Returns the same JWT format as OTP login.
     */
    @PostMapping("/google")
    public ResponseEntity<OtpResponse> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        OtpResponse response = googleAuthService.loginWithGoogle(request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }
}
