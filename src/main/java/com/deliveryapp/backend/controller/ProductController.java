package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@RequestBody ProductRequest request) {
        productService.createProduct(request);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.CREATED.value(), "Product created successfully"),
                HttpStatus.CREATED);
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
}
