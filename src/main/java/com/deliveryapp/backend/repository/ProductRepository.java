package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.status = 'active'")
    long countActiveProducts();
    
    @Query("SELECT p FROM Product p JOIN Category c ON p.categoryId = c.id " +
           "WHERE p.status = 'active' AND p.isActive = true " +
           "AND c.status = 'active' AND c.isActive = true")
    java.util.List<Product> findActiveProducts();

    @Query("SELECT p FROM Product p JOIN Category c ON p.categoryId = c.id " +
           "WHERE p.id = :id AND p.status = 'active' AND p.isActive = true " +
           "AND c.status = 'active' AND c.isActive = true")
    java.util.Optional<Product> findActiveProductById(@org.springframework.data.repository.query.Param("id") Long id);

    java.util.List<Product> findByStatus(String status);
    java.util.Optional<Product> findByIdAndStatus(Long id, String status);
    
    java.util.List<Product> findByStatusAndIsActiveTrue(String status);
    java.util.Optional<Product> findByIdAndStatusAndIsActiveTrue(Long id, String status);

    // Cascade category active/inactive toggle to all products in that category
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Product p SET p.isActive = :isActive WHERE p.categoryId = :categoryId AND p.status = 'active'")
    void updateIsActiveByCategoryId(@org.springframework.data.repository.query.Param("categoryId") Long categoryId,
                                    @org.springframework.data.repository.query.Param("isActive") Boolean isActive);
}
