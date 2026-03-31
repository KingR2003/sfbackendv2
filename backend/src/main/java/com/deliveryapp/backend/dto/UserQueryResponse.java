package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQueryResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String subject;
    private String message;
    private LocalDateTime createdAt;
}
