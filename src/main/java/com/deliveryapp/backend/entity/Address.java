package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonProperty("user_id")
    @Column(name = "user_id")
    private Long userId;

    @com.fasterxml.jackson.annotation.JsonProperty("building_no")
    @Column(name = "building_no")
    private String buildingNo;

    @com.fasterxml.jackson.annotation.JsonProperty("building_name")
    @Column(name = "building_name")
    private String buildingName;

    @com.fasterxml.jackson.annotation.JsonProperty("street_no")
    @Column(name = "street_no")
    private String streetNo;

    @com.fasterxml.jackson.annotation.JsonProperty("area_name")
    @Column(name = "area_name")
    private String areaName;

    private String city;

    private String state;

    private String pincode;

    @com.fasterxml.jackson.annotation.JsonProperty("is_default")
    @Column(name = "is_default")
    private Integer isDefault;

    @com.fasterxml.jackson.annotation.JsonProperty("address_type")
    @Column(name = "address_type")
    private String addressType;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
