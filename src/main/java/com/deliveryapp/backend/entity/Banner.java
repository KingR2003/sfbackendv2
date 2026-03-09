package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    private String platform; // MOBILE_APP, WEBSITE, ALL

    private String gender; // ALL, MALE, FEMALE

    @Column(name = "age_group")
    private String ageGroup; // ALL, etc.

    @Column(name = "button_text")
    private String buttonText;

    @Column(name = "redirect_to")
    private String redirectTo;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    private Integer priority;

    @Column(name = "is_active")
    private Boolean isActive;

    private String devices; // Comma separated: MOBILE, TABLET, DESKTOP

    @Column(name = "created_at", updatable = false)
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }
}
