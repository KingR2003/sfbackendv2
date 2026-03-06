package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.CategoryRepository;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private com.deliveryapp.backend.service.S3Service s3Service;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    public void testCreateProduct_CategoryNotFound_ShouldThrowException() {
        ProductRequest request = new ProductRequest();
        request.setCategoryId(999L);

        when(categoryRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            productService.createProduct(request, null);
        });
    }

    @Test
    public void testUpdateProduct_CategoryNotFound_ShouldThrowException() {
        ProductRequest request = new ProductRequest();
        request.setCategoryId(999L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(new com.deliveryapp.backend.entity.Product()));
        when(categoryRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            productService.updateProduct(1L, request, null);
        });
    }
}
