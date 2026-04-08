package com.deliveryapp.backend.dto;

import com.deliveryapp.backend.entity.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportResponse {
    private String ticketId;
    private String name;
    private String email;
    private String subject;
    private String message;
    private String orderId;
    private TicketStatus status;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
}
