package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Address;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends org.springframework.data.jpa.repository.JpaRepository<Address, Long> {
    java.util.List<Address> findByUserId(Long userId);
    java.util.List<Address> findByUserIdAndStatus(Long userId, String status);
}
