package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.service.ProductService;
import com.deliveryapp.backend.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<ApiResponse> createProduct(
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) List<MultipartFile> images) {
        try {
            ProductRequest request = objectMapper.readValue(productStr, ProductRequest.class);
            productService.createProduct(request, images);
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.CREATED.value(), "Product created successfully"),
                    HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid product JSON: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getProductById(@PathVariable("id") Long id) {
        Optional<ProductResponse> product = productService.getProductById(id);
        if (product.isPresent()) {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Product found");
            response.put("product", product.get());
            return ResponseEntity.ok(response);
        } else {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND.value(), "Product not found"),
                    HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Products retrieved successfully");
        response.put("products", products);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<Object> updateProduct(@PathVariable("id") Long id,
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) List<MultipartFile> images) {
        try {
            ProductRequest request = objectMapper.readValue(productStr, ProductRequest.class);
            ProductResponse updatedProduct = productService.updateProduct(id, request, images);
            if (updatedProduct != null) {
                java.util.Map<String, Object> response = new java.util.HashMap<>();
                response.put("status", HttpStatus.OK.value());
                response.put("message", "Product updated successfully");
                response.put("product", updatedProduct);
                return ResponseEntity.ok(response);
            } else {
                return new ResponseEntity<>(new ApiResponse(HttpStatus.NOT_FOUND.value(), "Product not found"),
                        HttpStatus.NOT_FOUND);
            }
        } catch (IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid product JSON: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return new ResponseEntity<>(new ApiResponse(HttpStatus.OK.value(), "Product deleted successfully"),
                HttpStatus.OK);
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Object> uploadProductImage(@PathVariable("id") Long productId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "File is empty"),
                        HttpStatus.BAD_REQUEST);
            }

            // Upload to S3
            String imageUrl = s3Service.uploadFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());

            // Save to database
            productService.addProductImage(productId, imageUrl);

            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Image uploaded successfully");
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to upload image"),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
