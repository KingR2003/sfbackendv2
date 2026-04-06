package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.Category;
import java.util.List;
import java.util.Optional;

public interface CategoryService {
    Category createCategory(Category category, org.springframework.web.multipart.MultipartFile image);
    Optional<Category> getCategoryById(Long id);
    List<Category> getAllCategories();           // User-side: isActive=true only
    List<Category> getAllCategoriesForAdmin();   // Admin-side: all non-deleted
    Category updateCategory(Long id, Category category, org.springframework.web.multipart.MultipartFile image);
    void deleteCategory(Long id);
}
