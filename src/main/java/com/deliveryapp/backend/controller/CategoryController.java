package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.entity.Category;
import com.deliveryapp.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/{id}")
    public ResponseEntity<Object> getCategoryById(@PathVariable("id") Long id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        if (category.isPresent()) {
            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Category found", category.get()));
        } else {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND.value(), "Category not found"),
                    HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Categories retrieved successfully", categories));
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<ApiResponse> createCategory(
            @RequestPart("category") String categoryJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            Category category = objectMapper.readValue(categoryJson, Category.class);
            categoryService.createCategory(category, image);
            return new ResponseEntity<>(new ApiResponse(HttpStatus.CREATED.value(), "Category created successfully"), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Error creating category: " + e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<Object> updateCategory(
            @PathVariable("id") Long id,
            @RequestPart("category") String categoryJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            Category category = objectMapper.readValue(categoryJson, Category.class);
            Category updatedCategory = categoryService.updateCategory(id, category, image);
            if (updatedCategory != null) {
                return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Category updated successfully", updatedCategory));
            } else {
                return new ResponseEntity<>(new ApiResponse(HttpStatus.NOT_FOUND.value(), "Category not found"), HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "Error updating category: " + e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Category deleted successfully"));
    }
}
