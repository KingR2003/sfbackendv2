package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
}
