package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.WishlistResponse;
import com.deliveryapp.backend.entity.Product;
import com.deliveryapp.backend.entity.WishlistItem;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.repository.WishlistRepository;
import com.deliveryapp.backend.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public List<WishlistResponse> getWishlist(Long userId) {
        List<WishlistItem> items = wishlistRepository.findByUserId(userId);
        return items.stream().map(item -> {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            WishlistResponse response = new WishlistResponse();
            response.setWishlistItemId(item.getId());
            response.setProductId(item.getProductId());
            response.setProductName(product != null ? product.getName() : "Unknown Product");
            response.setProductDescription(product != null ? product.getDescription() : null);
            response.setAddedAt(item.getAddedAt());
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public void addToWishlist(Long userId, Long productId) {
        // Verify product exists
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

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
