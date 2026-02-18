package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;

import java.util.List;
import java.util.Optional;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    Optional<ProductResponse> getProductById(Long id);
    List<ProductResponse> getAllProducts();
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
