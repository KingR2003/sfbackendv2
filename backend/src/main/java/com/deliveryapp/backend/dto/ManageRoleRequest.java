package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ManageRoleRequest {
    @NotBlank(message = "Role is required")
    private String role;
}
