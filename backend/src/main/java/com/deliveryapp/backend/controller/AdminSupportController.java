package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.dto.AdminSupportOrderDetailsResponse;
import com.deliveryapp.backend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/support")
public class AdminSupportController {

    @Autowired
    private SupportService supportService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.deliveryapp.backend.dto.DataResponse<List<AdminSupportOrderDetailsResponse>>> getSupportTickets(
            @RequestParam(required = false) String ticketId,
            @RequestParam(required = false) String orderId
    ) {
        List<AdminSupportOrderDetailsResponse> response;
        if (ticketId != null) {
            response = List.of(supportService.getSupportWithOrderDetails(ticketId));
        } else if (orderId != null) {
            response = supportService.getSupportTicketsByOrderId(orderId);
        } else {
            response = supportService.getAllSupportTicketsWithOrderDetails();
        }
        return ResponseEntity.ok(
                new com.deliveryapp.backend.dto.DataResponse<>(org.springframework.http.HttpStatus.OK.value(), "Support tickets retrieved successfully", response));
    }

    @PatchMapping("/{ticketId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.deliveryapp.backend.dto.DataResponse<SupportResponse>> updateStatus(
            @PathVariable String ticketId,
            @jakarta.validation.Valid @RequestBody com.deliveryapp.backend.dto.UpdateTicketStatusRequest request) {
        SupportResponse updated = supportService.updateStatus(ticketId, request);
        return ResponseEntity.ok(
                new com.deliveryapp.backend.dto.DataResponse<>(org.springframework.http.HttpStatus.OK.value(), "Ticket status updated successfully", updated));
    }
}
