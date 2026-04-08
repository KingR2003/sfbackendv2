package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "support_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "support_id", nullable = false)
    private Support support;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;
}
