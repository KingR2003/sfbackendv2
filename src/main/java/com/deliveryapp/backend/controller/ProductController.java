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

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            ProductRequest request = objectMapper.readValue(productStr, ProductRequest.class);
            ProductResponse createdProduct = productService.createProduct(request, image);
            return new ResponseEntity<>(new ApiResponse<>(HttpStatus.CREATED.value(), "Product created successfully", createdProduct),
                    HttpStatus.CREATED);
        } catch (IOException e) {
             return new ResponseEntity<>(new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), "Invalid product JSON: " + e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable("id") Long id) {
        Optional<ProductResponse> product = productService.getProductById(id);
        return product
                .map(value -> new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Product found", value),
                        HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(
                        new ApiResponse<>(HttpStatus.NOT_FOUND.value(), "Product not found", null),
                        HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return new ResponseEntity<>(
                new ApiResponse<>(HttpStatus.OK.value(), "Products retrieved successfully", products),
                HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(@PathVariable("id") Long id,
            @RequestBody ProductRequest request) {
        ProductResponse updated = productService.updateProduct(id, request);
        if (updated != null) {
            return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Product updated successfully"),
                    HttpStatus.OK);
        } else {
            return new ResponseEntity<>(new ApiResponse<>(HttpStatus.NOT_FOUND.value(), "Product not found", null),
                    HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Product deleted successfully"),
                HttpStatus.OK);
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<ApiResponse<String>> uploadProductImage(@PathVariable("id") Long productId,
                                                                   @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), "File is empty", null),
                        HttpStatus.BAD_REQUEST);
            }

            // Upload to S3
            String imageUrl = s3Service.uploadFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());

            // Save to database
            productService.addProductImage(productId, imageUrl);

            return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Image uploaded successfully", imageUrl),
                    HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<>(new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to upload image", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
