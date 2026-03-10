package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findByPlatformIgnoreCase(String platform);

    List<Banner> findByCampaignTypeIgnoreCase(String campaignType);

    List<Banner> findByGenderIgnoreCase(String gender);

    // Active banners
    List<Banner> findByIsActiveTrue();

    // Banners that are active and currently within their start/end dates
    List<Banner> findByIsActiveTrueAndStartDateTimeBeforeAndEndDateTimeAfter(LocalDateTime start, LocalDateTime end);
    
    // Scheduled: Active flag is true, but start date is in the future
    List<Banner> findByIsActiveTrueAndStartDateTimeAfter(LocalDateTime start);

    // Expired: End date is in the past
    List<Banner> findByEndDateTimeBefore(LocalDateTime end);

    List<Banner> findAllByOrderByPriorityAsc();
}
