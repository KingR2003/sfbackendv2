package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendOtpRequest {

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "\\+[1-9]\\d{6,14}",
        message = "Mobile number must be in E.164 format, e.g. +919876543210"
    )
    private String mobileNumber;
}
