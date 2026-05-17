package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.ManagePermissionsRequest;
import com.deliveryapp.backend.dto.ManageRoleRequest;
import com.deliveryapp.backend.dto.PermissionDto;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.service.ManageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/manage/members")
@PreAuthorize("hasRole('SUPER ADMIN')")
public class ManageController {

    @Autowired
    private ManageService manageService;

    @GetMapping
    public ResponseEntity<Object> getAdminMembers() {
        try {
            List<User> admins = manageService.getAdminMembers();
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Members retrieved successfully");
            response.put("members", admins);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve members: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<Object> updateMemberRole(@PathVariable Long userId, @Valid @RequestBody ManageRoleRequest request) {
        try {
            User updatedUser = manageService.updateMemberRole(userId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Member role updated successfully");
            response.put("member", updatedUser);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to update member role: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}/permissions")
    public ResponseEntity<Object> getMemberPermissions(@PathVariable Long userId) {
        try {
            List<PermissionDto> permissions = manageService.getMemberPermissions(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Permissions retrieved successfully");
            response.put("permissions", permissions);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to retrieve permissions: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}/permissions")
    public ResponseEntity<Object> updateMemberPermissions(@PathVariable Long userId, @Valid @RequestBody ManagePermissionsRequest request) {
        try {
            List<PermissionDto> permissions = manageService.updateMemberPermissions(userId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Permissions updated successfully");
            response.put("permissions", permissions);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Failed to update permissions: " + e.getMessage()));
        }
    }
}
