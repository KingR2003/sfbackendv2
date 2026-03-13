package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.service.ProductService;
import com.deliveryapp.backend.service.S3Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    @GetMapping
    public ResponseEntity<Object> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Products retrieved successfully", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getProductById(@PathVariable("id") Long id) {
        java.util.Optional<ProductResponse> product = productService.getProductById(id);
        if (product.isPresent()) {
            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Product found", product.get()));
        } else {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.NOT_FOUND.value(), "Product not found"), HttpStatus.NOT_FOUND);
        }
    }

    @Autowired
    private ProductService productService;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private ObjectMapper objectMapper;

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

    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<Object> updateProduct(@PathVariable("id") Long id,
            @RequestPart("product") String productStr,
            @RequestPart(value = "image", required = false) List<MultipartFile> images) {
        try {
            ProductRequest request = objectMapper.readValue(productStr, ProductRequest.class);
            ProductResponse updatedProduct = productService.updateProduct(id, request, images);
            if (updatedProduct != null) {
                return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Product updated successfully", updatedProduct));
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
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Product deleted successfully"));
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Object> uploadProductImage(@PathVariable("id") Long productId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "File is empty"),
                        HttpStatus.BAD_REQUEST);
            }

            String imageUrl = s3Service.uploadFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());
            productService.addProductImage(productId, imageUrl);

            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Image uploaded successfully", imageUrl));
        } catch (IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to upload image"),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
