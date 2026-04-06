package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.Category;
import com.deliveryapp.backend.repository.CategoryRepository;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public Category createCategory(Category category) {
        if (category.getStatus() == null) {
            category.setStatus("active");
        }
        return categoryRepository.save(category);
    }

    @Override
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findByIdAndStatusAndIsActive(id, "active", true);
    }

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findByStatusAndIsActive("active", true);
    }

    @Override
    public List<Category> getAllCategoriesForAdmin() {
        return categoryRepository.findByStatus("active");
    }

    @Override
    @Transactional
    public Category updateCategory(Long id, Category category) {
        Optional<Category> existingOpt = categoryRepository.findByIdAndStatus(id, "active");
        if (existingOpt.isPresent()) {
            Category existing = existingOpt.get();
            existing.setName(category.getName());
            if (category.getDescription() != null) existing.setDescription(category.getDescription());
            if (category.getIsActive() != null) {
                boolean wasActive = Boolean.TRUE.equals(existing.getIsActive());
                boolean nowActive = category.getIsActive();
                existing.setIsActive(nowActive);
                // Cascade: if category toggled, flip all products in this category too
                if (wasActive != nowActive) {
                    productRepository.updateIsActiveByCategoryId(id, nowActive);
                }
            }
            return categoryRepository.save(existing);
        }
        return null;
    }

    @Override
    public void deleteCategory(Long id) {
        Optional<Category> existingOpt = categoryRepository.findByIdAndStatus(id, "active");
        if (existingOpt.isPresent()) {
            Category existing = existingOpt.get();
            existing.setStatus("inactive");
            categoryRepository.save(existing);
        }
    }
}
