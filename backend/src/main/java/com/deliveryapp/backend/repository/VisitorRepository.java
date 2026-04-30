package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    @Query("SELECT COUNT(DISTINCT v.sessionId) FROM Visitor v WHERE v.visitedAt >= :startDate")
    long countDistinctSessionIdByVisitedAtAfter(@Param("startDate") LocalDateTime startDate);
}
