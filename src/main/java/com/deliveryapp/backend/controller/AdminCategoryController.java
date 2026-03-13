package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.entity.Category;
import com.deliveryapp.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/categories")
public class AdminCategoryController {

    @GetMapping
    public ResponseEntity<Object> getAllCategories() {
        java.util.List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Categories retrieved successfully", categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getCategoryById(@PathVariable("id") Long id) {
        java.util.Optional<Category> category = categoryService.getCategoryById(id);
        if (category.isPresent()) {
            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Category found", category.get()));
        } else {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.NOT_FOUND.value(), "Category not found"), HttpStatus.NOT_FOUND);
        }
    }

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiResponse> createCategory(@RequestBody Category category) {
        categoryService.createCategory(category);
        return new ResponseEntity<>(new ApiResponse(HttpStatus.CREATED.value(), "Category created successfully"),
                HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCategory(@PathVariable("id") Long id,
            @RequestBody Category category) {
        Category updatedCategory = categoryService.updateCategory(id, category);
        if (updatedCategory != null) {
            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Category updated successfully", updatedCategory));
        } else {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.NOT_FOUND.value(), "Category not found"),
                    HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Category deleted successfully"));
    }
}
