package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.dto.UpdateTicketStatusRequest;
import com.deliveryapp.backend.dto.UserQueryResponse;
import com.deliveryapp.backend.service.UserQueryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/queries")
public class AdminUserQueryController {

    @Autowired
    private UserQueryService userQueryService;

    @GetMapping
    public ResponseEntity<DataResponse<List<UserQueryResponse>>> getAllQueries() {
        List<UserQueryResponse> queries = userQueryService.getAllQueries();
        return ResponseEntity.ok(
                new DataResponse<>(HttpStatus.OK.value(), "Queries retrieved successfully", queries));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DataResponse<UserQueryResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        UserQueryResponse updated = userQueryService.updateStatus(id, request);
        return ResponseEntity.ok(
                new DataResponse<>(HttpStatus.OK.value(), "Ticket status updated successfully", updated));
    }
}
