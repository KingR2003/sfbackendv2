package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ManagePermissionsRequest {
    @NotNull(message = "Permissions list is required")
    private List<PermissionDto> permissions;
}
