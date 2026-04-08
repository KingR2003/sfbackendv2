package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/support")
public class AdminSupportController {

    @Autowired
    private SupportService supportService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SupportResponse>> getAllSupportTickets() {
        return ResponseEntity.ok(supportService.getAllSupportTickets());
    }

    @GetMapping("/{ticketId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupportResponse> getSupportTicket(@PathVariable String ticketId) {
        return ResponseEntity.ok(supportService.getSupportTicketById(ticketId));
    }
}
