package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    java.util.Optional<Banner> findByIdAndStatus(Long id, String status);

    List<Banner> findByPlatformIgnoreCaseAndStatus(String platform, String status);

    List<Banner> findByCampaignTypeIgnoreCaseAndStatus(String campaignType, String status);

    List<Banner> findByGenderIgnoreCaseAndStatus(String gender, String status);

    // Active banners
    List<Banner> findByIsActiveTrueAndStatus(String status);

    // Banners that are active and currently within their start/end dates
    List<Banner> findByIsActiveTrueAndStatusAndStartDateTimeBeforeAndEndDateTimeAfter(String status, LocalDateTime start, LocalDateTime end);
    
    // Scheduled: Active flag is true, but start date is in the future
    List<Banner> findByIsActiveTrueAndStatusAndStartDateTimeAfter(String status, LocalDateTime start);

    // Expired: End date is in the past
    List<Banner> findByEndDateTimeBeforeAndStatus(LocalDateTime end, String status);

    List<Banner> findByStatusOrderByPriorityAsc(String status);
}
