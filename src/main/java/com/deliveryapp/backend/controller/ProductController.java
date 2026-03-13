package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            productService.createProduct(request, images);
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.CREATED.value(), "Product created successfully"),
                    HttpStatus.CREATED);
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Invalid product JSON: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<Object> updateProduct(@PathVariable("id") Long id,
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) List<org.springframework.web.multipart.MultipartFile> images) {
        try {
            com.deliveryapp.backend.dto.ProductRequest request = objectMapper.readValue(productStr, com.deliveryapp.backend.dto.ProductRequest.class);
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
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Product deleted successfully"));
    }
}
