package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer priority;

    @Column(name = "banner_image")
    private String bannerImage;

    private String title;

    @Column(name = "campaign_type")
    private String campaignType;

    @Column(columnDefinition = "TEXT")
    private String description;

    // e.g., MOBILE_APP, WEBSITE, BOTH
    private String platform;

    // e.g., ALL, MEN, WOMEN
    private String gender;

    @Column(name = "age_group")
    private String ageGroup;

    @Column(name = "button_text")
    private String buttonText;

    @Column(name = "redirect_to")
    private String redirectTo; // e.g., MOBILE_APP, EXTERNAL_LINK, CUSTOM_PAGE

    @Column(name = "custom_page_url")
    private String customPageUrl;

    @Column(name = "start_date_time")
    private LocalDateTime startDateTime;

    @Column(name = "end_date_time")
    private LocalDateTime endDateTime;

    @Column(name = "is_active")
    private Boolean isActive = false;

    // Analytics fields
    private Long views = 0L;
    private Long clicks = 0L;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.views == null) this.views = 0L;
        if (this.clicks == null) this.clicks = 0L;
        if (this.isActive == null) this.isActive = false;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
