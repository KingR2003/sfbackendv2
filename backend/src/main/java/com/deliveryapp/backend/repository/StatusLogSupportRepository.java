package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.StatusLogSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusLogSupportRepository extends JpaRepository<StatusLogSupport, Long> {
    List<StatusLogSupport> findBySupportIdOrderByTimestampDesc(Long supportId);
}
