package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDto {
    private Long moduleId;
    private String moduleName;
    private boolean viewAccess;
    private boolean createAccess;
    private boolean updateAccess;
    private boolean deleteAccess;
}
