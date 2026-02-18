package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.ProductImageDto;
import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.dto.ProductVariantDto;
import com.deliveryapp.backend.entity.Product;
import com.deliveryapp.backend.entity.ProductImage;
import com.deliveryapp.backend.entity.ProductVariant;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategoryId(request.getCategoryId());
        product.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        // Map images
        if (request.getImages() != null) {
            for (ProductImageDto imgDto : request.getImages()) {
                ProductImage image = new ProductImage();
                image.setImageUrl(imgDto.getImageUrl());
                image.setProduct(product);
                product.getImages().add(image);
            }
        }

        // Map variants
        if (request.getVariants() != null) {
            for (ProductVariantDto varDto : request.getVariants()) {
                ProductVariant variant = new ProductVariant();
                variant.setVariantName(varDto.getVariantName());
                variant.setSku(varDto.getSku());
                variant.setMrp(varDto.getMrp());
                variant.setPrice(varDto.getPrice());
                variant.setDiscount(varDto.getDiscount());
                variant.setStockQuantity(varDto.getStockQuantity());
                variant.setAvailabilityStatus(varDto.getAvailabilityStatus());
                variant.setIsActive(varDto.getIsActive() != null ? varDto.getIsActive() : true);
                variant.setCreatedAt(LocalDateTime.now());
                variant.setUpdatedAt(LocalDateTime.now());
                variant.setProduct(product);
                product.getVariants().add(variant);
            }
        }

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProductResponse> getProductById(Long id) {
        return productRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isEmpty()) {
            return null;
        }

        Product product = optionalProduct.get();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategoryId(request.getCategoryId());
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        // Replace images
        product.getImages().clear();
        if (request.getImages() != null) {
            for (ProductImageDto imgDto : request.getImages()) {
                ProductImage image = new ProductImage();
                image.setImageUrl(imgDto.getImageUrl());
                image.setProduct(product);
                product.getImages().add(image);
            }
        }

        // Replace variants
        product.getVariants().clear();
        if (request.getVariants() != null) {
            for (ProductVariantDto varDto : request.getVariants()) {
                ProductVariant variant = new ProductVariant();
                variant.setVariantName(varDto.getVariantName());
                variant.setSku(varDto.getSku());
                variant.setMrp(varDto.getMrp());
                variant.setPrice(varDto.getPrice());
                variant.setDiscount(varDto.getDiscount());
                variant.setStockQuantity(varDto.getStockQuantity());
                variant.setAvailabilityStatus(varDto.getAvailabilityStatus());
                variant.setIsActive(varDto.getIsActive() != null ? varDto.getIsActive() : true);
                variant.setCreatedAt(LocalDateTime.now());
                variant.setUpdatedAt(LocalDateTime.now());
                variant.setProduct(product);
                product.getVariants().add(variant);
            }
        }

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    private ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setCategoryId(product.getCategoryId());
        response.setIsActive(product.getIsActive());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        List<ProductImageDto> imageDtos = new ArrayList<>();
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                ProductImageDto dto = new ProductImageDto();
                dto.setId(img.getId());
                dto.setImageUrl(img.getImageUrl());
                imageDtos.add(dto);
            }
        }
        response.setImages(imageDtos);

        List<ProductVariantDto> variantDtos = new ArrayList<>();
        if (product.getVariants() != null) {
            for (ProductVariant var : product.getVariants()) {
                ProductVariantDto dto = new ProductVariantDto();
                dto.setId(var.getId());
                dto.setVariantName(var.getVariantName());
                dto.setSku(var.getSku());
                dto.setMrp(var.getMrp());
                dto.setPrice(var.getPrice());
                dto.setDiscount(var.getDiscount());
                dto.setStockQuantity(var.getStockQuantity());
                dto.setAvailabilityStatus(var.getAvailabilityStatus());
                dto.setIsActive(var.getIsActive());
                variantDtos.add(dto);
            }
        }
        response.setVariants(variantDtos);

        return response;
    }
}
