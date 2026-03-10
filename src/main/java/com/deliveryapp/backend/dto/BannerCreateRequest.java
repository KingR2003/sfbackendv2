package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BannerCreateRequest {

    private Integer priority = 0;

    @NotBlank(message = "Banner image URL is required")
    private String bannerImage;

    @NotBlank(message = "Title is required")
    private String title;

    private String campaignType;

    private String description;

    @NotBlank(message = "Platform is required (e.g., APP, WEBSITE, BOTH)")
    private String platform;

    private String gender = "ALL";

    private String ageGroup;

    private String buttonText;

    private String redirectTo;

    private String customPageUrl;

    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    private Boolean isActive = false;
}
