package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSupportReplyRequest {

    @NotBlank(message = "Reply message cannot be blank")
    private String message;

    /** Display name of the admin who is replying */
    private String adminName;
}
