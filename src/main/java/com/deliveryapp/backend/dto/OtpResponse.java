package com.deliveryapp.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpResponse {

    private boolean success;
    private String message;
    private int statusCode;

    /** JWT token — only present after successful OTP verification */
    private String token;

    /** Constructor for send-otp or error responses (no token) */
    public OtpResponse(boolean success, String message, int statusCode) {
        this.success = success;
        this.message = message;
        this.statusCode = statusCode;
    }
}
