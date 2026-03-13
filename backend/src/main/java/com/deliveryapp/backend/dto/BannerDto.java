package com.deliveryapp.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class BannerDto {
    private Long id;
    private Integer priority;
    private String bannerImage;
    private String title;
    private String campaignType;
    private String description;
    private String platform;
    private String gender;
    private String ageGroup;
    private String buttonText;
    private String redirectTo;
    private String customPageUrl;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Boolean isActive;
    
    // Analytics
    private Long views;
    private Long clicks;
    
    // Computed fields
    private String status; // Active / Scheduled / Expired / Inactive
    private Double ctr; // Click-through rate (%)

    // Method to compute dynamic fields
    public void computeDynamicFields() {
        // Compute CTR
        if (views != null && views > 0 && clicks != null) {
            this.ctr = (double) clicks / views * 100.0;
        } else {
            this.ctr = 0.0;
        }

        // Compute Status
        LocalDateTime now = LocalDateTime.now();
        if (isActive == null || !isActive) {
            this.status = "Inactive";
        } else if (endDateTime != null && now.isAfter(endDateTime)) {
            this.status = "Expired";
        } else if (startDateTime != null && now.isBefore(startDateTime)) {
            this.status = "Scheduled";
        } else {
            this.status = "Active";
        }
    }
}
