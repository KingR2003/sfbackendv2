package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.SupportImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportImageRepository extends JpaRepository<SupportImage, Long> {
}
