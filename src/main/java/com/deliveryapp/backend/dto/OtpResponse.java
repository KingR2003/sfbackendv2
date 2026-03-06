package com.deliveryapp.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpResponse extends ApiResponse {

    /** JWT token — only present after successful OTP verification */
    private String token;

    /** Flag to indicate if the user is logging in for the first time */
    private Boolean isNewUser;

    public OtpResponse(Integer status, String message) {
        super(status, message);
    }

    public OtpResponse(Integer status, String message, String token, Boolean isNewUser) {
        super(status, message);
        this.token = token;
        this.isNewUser = isNewUser;
    }
}
