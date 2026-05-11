package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.UserQueryResponse;
import com.deliveryapp.backend.service.UserQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/user-queries")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserQueryController {

    @Autowired
    private UserQueryService userQueryService;

    @GetMapping
    public ResponseEntity<List<UserQueryResponse>> getAllQueries() {
        return ResponseEntity.ok(userQueryService.getAllQueries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserQueryResponse> getQueryById(@PathVariable Long id) {
        return ResponseEntity.ok(userQueryService.getQueryById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserQueryResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(userQueryService.updateStatus(id, status));
    }
}
