package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.Product;
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
    public ResponseEntity<ApiResponse<Product>> createProduct(@RequestBody Product product) {
        Product createdProduct = productService.createProduct(product);
        return new ResponseEntity<>(new ApiResponse<>(true, "Product created successfully", createdProduct),
                HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product
                .map(value -> new ResponseEntity<>(new ApiResponse<>(true, "Product found", value), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse<>(false, "Product not found", null),
                        HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return new ResponseEntity<>(new ApiResponse<>(true, "Products retrieved successfully", products),
                HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Product updatedProduct = productService.updateProduct(id, product);
        if (updatedProduct != null) {
            return new ResponseEntity<>(new ApiResponse<>(true, "Product updated successfully", updatedProduct),
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
