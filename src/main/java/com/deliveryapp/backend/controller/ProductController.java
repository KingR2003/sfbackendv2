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
        ProductResponse created = productService.createProduct(request);
        return new ResponseEntity<>(new ApiResponse<>(true, "Product created successfully", created),
                HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        Optional<ProductResponse> product = productService.getProductById(id);
        return product
                .map(value -> new ResponseEntity<>(new ApiResponse<>(true, "Product found", value), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse<>(false, "Product not found", null),
                        HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return new ResponseEntity<>(new ApiResponse<>(true, "Products retrieved successfully", products),
                HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(@PathVariable Long id,
            @RequestBody ProductRequest request) {
        ProductResponse updated = productService.updateProduct(id, request);
        if (updated != null) {
            return new ResponseEntity<>(new ApiResponse<>(true, "Product updated successfully", updated),
                    HttpStatus.OK);
        } else {
            return new ResponseEntity<>(new ApiResponse<>(false, "Product not found", null), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return new ResponseEntity<>(new ApiResponse<>(true, "Product deleted successfully", null), HttpStatus.OK);
    }
}
