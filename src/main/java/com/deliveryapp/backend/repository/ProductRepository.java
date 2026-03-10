package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true")
    long countActiveProducts();
}
