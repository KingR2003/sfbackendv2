package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.CartItemRequest;
import com.deliveryapp.backend.dto.CartResponse;

public interface CartService {
    CartResponse getCart(Long userId);

    void addToCart(Long userId, CartItemRequest request);

    void removeFromCart(Long userId, Long variantId);

    void clearCart(Long userId);
}
