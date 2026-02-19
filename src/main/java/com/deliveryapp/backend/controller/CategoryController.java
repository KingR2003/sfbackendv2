package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.Category;
import com.deliveryapp.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category) {
        categoryService.createCategory(category);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.CREATED.value(), "Category created successfully"),
                HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getCategoryById(@PathVariable("id") Long id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        return category
                .map(value -> new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Category found", value),
                        HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(
                        new ApiResponse<>(HttpStatus.NOT_FOUND.value(), "Category not found", null),
                        HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return new ResponseEntity<>(
                new ApiResponse<>(HttpStatus.OK.value(), "Categories retrieved successfully", categories),
                HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable("id") Long id,
            @RequestBody Category category) {
        Category updatedCategory = categoryService.updateCategory(id, category);
        if (updatedCategory != null) {
            return new ResponseEntity<>(
                    new ApiResponse<>(HttpStatus.OK.value(), "Category updated successfully", updatedCategory),
                    HttpStatus.OK);
        } else {
            return new ResponseEntity<>(new ApiResponse<>(HttpStatus.NOT_FOUND.value(), "Category not found", null),
                    HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Category deleted successfully"),
                HttpStatus.OK);
    }
}
