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
}
