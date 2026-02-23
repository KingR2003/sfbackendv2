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

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "building_no")
    private String buildingNo;

    @Column(name = "building_name")
    private String buildingName;

    @Column(name = "street_no")
    private String streetNo;

    @Column(name = "area_name")
    private String areaName;

    private String city;

    private String state;

    private String pincode;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "address_type")
    private String addressType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
