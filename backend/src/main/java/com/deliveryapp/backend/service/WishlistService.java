package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.WishlistResponse;

import java.util.List;

public interface WishlistService {

    List<WishlistResponse> getWishlist(Long userId);

    void addToWishlist(Long userId, Long productId);

    void removeFromWishlist(Long userId, Long productId);

    void clearWishlist(Long userId);

    boolean isProductWishlisted(Long userId, Long productId);
}
