package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.BannerInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BannerInteractionRepository extends JpaRepository<BannerInteraction, Long> {

    List<BannerInteraction> findByBannerId(Long bannerId);

    List<BannerInteraction> findByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT bi FROM BannerInteraction bi WHERE bi.createdAt >= :startDate AND bi.interactionType = :type")
    List<BannerInteraction> findRecentInteractions(@Param("startDate") LocalDateTime startDate, 
                                                   @Param("type") BannerInteraction.InteractionType type);

    @Query("SELECT COUNT(bi) FROM BannerInteraction bi WHERE bi.bannerId = :bannerId AND bi.interactionType = :type")
    long countByBannerIdAndType(@Param("bannerId") Long bannerId, @Param("type") BannerInteraction.InteractionType type);

    @Query("SELECT u.gender, COUNT(bi) FROM BannerInteraction bi JOIN User u ON bi.userId = u.id WHERE bi.createdAt >= :startDate AND bi.interactionType = 'VIEW' GROUP BY u.gender")
    List<Object[]> countViewsByGender(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT bi.platform, COUNT(bi) FROM BannerInteraction bi WHERE bi.createdAt >= :startDate AND bi.interactionType = 'VIEW' GROUP BY bi.platform")
    List<Object[]> countViewsByPlatform(@Param("startDate") LocalDateTime startDate);
}
