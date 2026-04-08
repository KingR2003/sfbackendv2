package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.ProductImageDto;
import com.deliveryapp.backend.dto.ProductVariantDto;
import com.deliveryapp.backend.dto.WishlistResponse;
import com.deliveryapp.backend.entity.Product;
import com.deliveryapp.backend.entity.ProductImage;
import com.deliveryapp.backend.entity.ProductVariant;
import com.deliveryapp.backend.entity.WishlistItem;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.repository.WishlistRepository;
import com.deliveryapp.backend.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.deliveryapp.backend.repository.CategoryRepository categoryRepository;

    @Override
    public List<WishlistResponse> getWishlist(Long userId) {
        List<WishlistItem> items = wishlistRepository.findByUserId(userId);
        return items.stream().map(item -> {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            com.deliveryapp.backend.entity.Category cat = null;
            if (product != null) {
                cat = categoryRepository.findById(product.getCategoryId()).orElse(null);
            }
            boolean isCategoryActive = cat != null && Boolean.TRUE.equals(cat.getIsActive()) && "active".equals(cat.getStatus());
            boolean isAvailable = product != null && Boolean.TRUE.equals(product.getIsActive()) && "active".equals(product.getStatus()) && isCategoryActive;

            WishlistResponse response = new WishlistResponse();
            response.setWishlistItemId(item.getId());
            response.setProductId(item.getProductId());
            response.setProductName(product != null ? product.getName() : "Unknown Product");
            response.setProductDescription(product != null ? product.getDescription() : null);
            response.setAvailable(isAvailable);
            response.setAddedAt(item.getAddedAt());

            if (product != null) {
                // Map product-level images (not linked to a specific variant)
                List<ProductImageDto> imageDtos = new ArrayList<>();
                if (product.getImages() != null) {
                    for (ProductImage img : product.getImages()) {
                        if (img.getProductVariant() == null) {
                            ProductImageDto imgDto = new ProductImageDto();
                            imgDto.setId(img.getId());
                            imgDto.setImageUrl(img.getImageUrl());
                            imageDtos.add(imgDto);
                        }
                    }
                }
                response.setImages(imageDtos);

                // Map variants with derived availability status
                List<ProductVariantDto> variantDtos = new ArrayList<>();
                if (product.getVariants() != null) {
                    for (ProductVariant variant : product.getVariants()) {
                        // Skip fully inactive variants
                        if (!Boolean.TRUE.equals(variant.getIsActive())) continue;

                        ProductVariantDto varDto = new ProductVariantDto();
                        varDto.setId(variant.getId());
                        varDto.setVariantName(variant.getVariantName());
                        varDto.setSku(variant.getSku());
                        varDto.setMrp(variant.getMrp());
                        varDto.setPrice(variant.getPrice());
                        varDto.setDiscount(variant.getDiscount());
                        varDto.setStockQuantity(variant.getStockQuantity());
                        varDto.setIsActive(variant.getIsActive());

                        // Derive availability: product, category, stock must all be valid
                        boolean outOfStock = !isAvailable
                                || variant.getStockQuantity() == null
                                || variant.getStockQuantity() <= 0;
                        varDto.setAvailabilityStatus(outOfStock ? "OUT_OF_STOCK" : "AVAILABLE");

                        // Map variant-specific images
                        List<ProductImageDto> variantImages = new ArrayList<>();
                        if (variant.getImages() != null) {
                            for (ProductImage img : variant.getImages()) {
                                ProductImageDto imgDto = new ProductImageDto();
                                imgDto.setId(img.getId());
                                imgDto.setImageUrl(img.getImageUrl());
                                imgDto.setProductVariantId(variant.getId());
                                variantImages.add(imgDto);
                            }
                        }
                        varDto.setImages(variantImages);
                        variantDtos.add(varDto);
                    }
                }
                response.setVariants(variantDtos);
            }

            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public void addToWishlist(Long userId, Long productId) {
        // Verify product exists and is active
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (!Boolean.TRUE.equals(product.getIsActive()) || !"active".equals(product.getStatus())) {
            throw new IllegalArgumentException("Product is inactive and cannot be added to wishlist");
        }

        // Check category status
        com.deliveryapp.backend.entity.Category category = categoryRepository.findById(product.getCategoryId()).orElse(null);
        if (category == null || !Boolean.TRUE.equals(category.getIsActive()) || !"active".equals(category.getStatus())) {
            throw new IllegalArgumentException("Category is inactive and product cannot be added to wishlist");
        }

        // Prevent duplicate
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new IllegalArgumentException("Product is already in your wishlist");
        }

        WishlistItem item = new WishlistItem();
        item.setUserId(userId);
        item.setProductId(productId);
        wishlistRepository.save(item);
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResourceNotFoundException("Wishlist item not found for productId: " + productId);
        }
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Override
    @Transactional
    public void clearWishlist(Long userId) {
        wishlistRepository.deleteAllByUserId(userId);
    }

    @Override
    public boolean isProductWishlisted(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }
}
