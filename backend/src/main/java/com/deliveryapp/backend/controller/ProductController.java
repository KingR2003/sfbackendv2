package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/{id}")
    public ResponseEntity<Object> getProductById(@PathVariable("id") Long id) {
        Optional<ProductResponse> product = productService.getProductById(id);
        if (product.isPresent()) {
            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Product found", product.get()));
        } else {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND.value(), "Product not found"),
                    HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Products retrieved successfully", products));
    }

    @Autowired
    private com.deliveryapp.backend.service.S3Service s3Service;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<ApiResponse> createProduct(
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) List<org.springframework.web.multipart.MultipartFile> images) {
        try {
            com.deliveryapp.backend.dto.ProductRequest request = objectMapper.readValue(productStr, com.deliveryapp.backend.dto.ProductRequest.class);
            
            // Manual validation of required fields
            if (request.getName() == null || request.getName().isBlank()) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Product name is required"),
                        HttpStatus.BAD_REQUEST);
            }
            if (request.getDescription() == null || request.getDescription().isBlank()) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Product description is required"),
                        HttpStatus.BAD_REQUEST);
            }
            if (request.getCategoryId() == null) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Category ID is required"),
                        HttpStatus.BAD_REQUEST);
            }
            if (request.getIsActive() == null) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Active status is required"),
                        HttpStatus.BAD_REQUEST);
            }
            
            // Additional validation for variants if provided
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                for (com.deliveryapp.backend.dto.ProductVariantDto variant : request.getVariants()) {
                    if (variant.getVariantName() == null || variant.getVariantName().isBlank()) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant name is required"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getPrice() == null || variant.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant price must be greater than 0"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getMrp() == null || variant.getMrp().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant MRP must be greater than 0"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getStockQuantity() == null) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant stock quantity is required"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getIsActive() == null) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant active status is required"),
                                HttpStatus.BAD_REQUEST);
                    }
                }
            }
            
            productService.createProduct(request, images);
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.CREATED.value(), "Product created successfully"),
                    HttpStatus.CREATED);
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid product JSON: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<Object> updateProduct(@PathVariable("id") Long id,
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) List<org.springframework.web.multipart.MultipartFile> images) {
        try {
            com.deliveryapp.backend.dto.ProductRequest request = objectMapper.readValue(productStr, com.deliveryapp.backend.dto.ProductRequest.class);
            
            // Manual validation of required fields
            if (request.getName() == null || request.getName().isBlank()) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Product name is required"),
                        HttpStatus.BAD_REQUEST);
            }
            if (request.getDescription() == null || request.getDescription().isBlank()) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Product description is required"),
                        HttpStatus.BAD_REQUEST);
            }
            if (request.getCategoryId() == null) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Category ID is required"),
                        HttpStatus.BAD_REQUEST);
            }
            if (request.getIsActive() == null) {
                return new ResponseEntity<>(
                        new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Active status is required"),
                        HttpStatus.BAD_REQUEST);
            }
            
            // Additional validation for variants if provided
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                for (com.deliveryapp.backend.dto.ProductVariantDto variant : request.getVariants()) {
                    if (variant.getVariantName() == null || variant.getVariantName().isBlank()) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant name is required"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getPrice() == null || variant.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant price must be greater than 0"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getMrp() == null || variant.getMrp().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant MRP must be greater than 0"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getStockQuantity() == null) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant stock quantity is required"),
                                HttpStatus.BAD_REQUEST);
                    }
                    if (variant.getIsActive() == null) {
                        return new ResponseEntity<>(
                                new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Variant active status is required"),
                                HttpStatus.BAD_REQUEST);
                    }
                }
            }
            
            ProductResponse updatedProduct = productService.updateProduct(id, request, images);
            if (updatedProduct != null) {
                return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Product updated successfully", updatedProduct));
            } else {
                return new ResponseEntity<>(new ApiResponse(HttpStatus.NOT_FOUND.value(), "Product not found"),
                        HttpStatus.NOT_FOUND);
            }
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid product JSON: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Product deleted successfully"));
    }
}
