package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module_name", nullable = false, unique = true)
    private String moduleName;

    private String description;

    @Column(name = "is_active")
    private boolean active = true;
}
