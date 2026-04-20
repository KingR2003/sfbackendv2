package com.deliveryapp.backend.dto;

import com.deliveryapp.backend.entity.SupportMessage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportMessageDto {
    private Long id;
    private String senderName;
    private String message;
    private boolean fromAdmin;
    private LocalDateTime createdAt;

    public static SupportMessageDto from(SupportMessage msg) {
        return new SupportMessageDto(
                msg.getId(),
                msg.getSenderName(),
                msg.getMessage(),
                msg.isFromAdmin(),
                msg.getCreatedAt()
        );
    }
}
