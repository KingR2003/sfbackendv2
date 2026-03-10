package com.deliveryapp.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BannerUpdateRequest {

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
}
