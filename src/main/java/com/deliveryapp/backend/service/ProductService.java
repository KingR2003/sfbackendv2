package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request, List<MultipartFile> images);

    Optional<ProductResponse> getProductById(Long id);

    List<ProductResponse> getAllProducts();

    ProductResponse updateProduct(Long id, ProductRequest request, List<MultipartFile> images);

    void deleteProduct(Long id);

    void addProductImage(Long productId, String imageUrl);
}
