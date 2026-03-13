package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.Category;
import com.deliveryapp.backend.repository.CategoryRepository;
import com.deliveryapp.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public Category createCategory(Category category) {
        if (category.getStatus() == null) {
            category.setStatus("active");
        }
        return categoryRepository.save(category);
    }

    @Override
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findByIdAndStatus(id, "active");
    }

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findByStatus("active");
    }

    @Override
    public Category updateCategory(Long id, Category category) {
        Optional<Category> existingOpt = categoryRepository.findByIdAndStatus(id, "active");
        if (existingOpt.isPresent()) {
            Category existing = existingOpt.get();
            existing.setName(category.getName());
            // Check if getDescription is present on the entity
            // wait, Category has description. Let's just update all fields
            if (category.getDescription() != null) existing.setDescription(category.getDescription());
            if (category.getIsActive() != null) existing.setIsActive(category.getIsActive());
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
