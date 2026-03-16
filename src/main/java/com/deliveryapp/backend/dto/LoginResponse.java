package com.deliveryapp.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse extends ApiResponse {
    private String token;

    public LoginResponse(String email, String token, String message, Integer status) {
        super(status, message);
        this.token = token;
        // email is not currently a field in LoginResponse, but let's add it if needed
        // or just ignore it for now to match the constructor call.
        // Actually, let's just make the constructor match what the controller expects.
    }

    public LoginResponse(String message, Integer status) {
        super(status, message);
    }
}
