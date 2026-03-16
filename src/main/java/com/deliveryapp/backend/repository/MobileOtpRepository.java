package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.MobileOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MobileOtpRepository extends JpaRepository<MobileOtp, Long> {

    /** Latest OTP record for a mobile number (for verification) */
    Optional<MobileOtp> findTopByMobileNumberOrderByCreatedAtDesc(String mobileNumber);

    /** Check for recent non-expired, unverified OTP (spam prevention) */
    Optional<MobileOtp> findTopByMobileNumberAndVerifiedFalseOrderByCreatedAtDesc(String mobileNumber);
}
