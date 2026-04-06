package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.CartItemDto;
import com.deliveryapp.backend.dto.CartItemRequest;
import com.deliveryapp.backend.dto.CartResponse;
import com.deliveryapp.backend.entity.CartItem;
import com.deliveryapp.backend.entity.ProductVariant;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.CartRepository;
import com.deliveryapp.backend.repository.ProductVariantRepository;
import com.deliveryapp.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private com.deliveryapp.backend.repository.CategoryRepository categoryRepository;

    @Override
    public CartResponse getCart(Long userId) {
        List<CartItem> cartItems = cartRepository.findByUserId(userId);
        List<CartItemDto> itemDtos = cartItems.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        BigDecimal totalAmount = itemDtos.stream()
                .map(CartItemDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = itemDtos.stream()
                .mapToInt(CartItemDto::getQuantity)
                .sum();

        return new CartResponse(itemDtos, totalAmount, totalItems);
    }

    @Override
    @Transactional
    public void addToCart(Long userId, CartItemRequest request) {
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product Variant not found with id: " + request.getVariantId()));

        if (!Boolean.TRUE.equals(variant.getIsActive())) {
            throw new IllegalArgumentException("Product variant is inactive");
        }
        
        com.deliveryapp.backend.entity.Product product = variant.getProduct();
        if (product == null || !Boolean.TRUE.equals(product.getIsActive()) || !"active".equals(product.getStatus())) {
            throw new IllegalArgumentException("Product is inactive");
        }
        
        // Check category status
        com.deliveryapp.backend.entity.Category category = categoryRepository.findById(product.getCategoryId()).orElse(null);
        if (category == null || !Boolean.TRUE.equals(category.getIsActive()) || !"active".equals(category.getStatus())) {
            throw new IllegalArgumentException("Category is inactive");
        }

        if (variant.getStockQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for variant: " + variant.getVariantName());
        }

        CartItem cartItem = cartRepository.findByUserIdAndVariantId(userId, request.getVariantId())
                .orElse(new CartItem(null, userId, request.getVariantId(), 0));

        cartItem.setQuantity(request.getQuantity());
        cartRepository.save(cartItem);
    }

    @Override
    @Transactional
    public void removeFromCart(Long userId, Long variantId) {
        cartRepository.deleteByUserIdAndVariantId(userId, variantId);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }

    private CartItemDto mapToDto(CartItem item) {
        ProductVariant variant = productVariantRepository.findById(item.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + item.getVariantId()));

        BigDecimal subtotal = variant.getPrice().multiply(new BigDecimal(item.getQuantity()));

        String imageUrl = null;
        if (!variant.getImages().isEmpty()) {
            imageUrl = variant.getImages().get(0).getImageUrl();
        } else if (variant.getProduct() != null && !variant.getProduct().getImages().isEmpty()) {
            imageUrl = variant.getProduct().getImages().get(0).getImageUrl();
        }

        // Derive availability from product, category, variant activity and stock
        com.deliveryapp.backend.entity.Product product = variant.getProduct();
        boolean isProductActive = product != null && Boolean.TRUE.equals(product.getIsActive()) && "active".equals(product.getStatus());
        
        boolean isCategoryActive = false;
        if (product != null) {
            com.deliveryapp.backend.entity.Category category = categoryRepository.findById(product.getCategoryId()).orElse(null);
            isCategoryActive = category != null && Boolean.TRUE.equals(category.getIsActive()) && "active".equals(category.getStatus());
        }
        
        boolean isAvailable = Boolean.TRUE.equals(variant.getIsActive())
                && isProductActive 
                && isCategoryActive
                && variant.getStockQuantity() > 0 
                && variant.getStockQuantity() >= item.getQuantity();

        return new CartItemDto(
                item.getVariantId(),
                product != null ? product.getName() : "Unknown Product",
                variant.getVariantName(),
                item.getQuantity(),
                variant.getPrice(),
                subtotal,
                isAvailable,
                imageUrl);
    }

    @Override
    @Transactional
    public void incrementQuantity(Long userId, Long variantId) {
        CartItem cartItem = cartRepository.findByUserIdAndVariantId(userId, variantId)
                .orElse(new CartItem(null, userId, variantId, 0));
        cartItem.setQuantity(cartItem.getQuantity() + 1);
        cartRepository.save(cartItem);
    }

    @Override
    @Transactional
    public void decrementQuantity(Long userId, Long variantId) {
        cartRepository.findByUserIdAndVariantId(userId, variantId).ifPresent(cartItem -> {
            if (cartItem.getQuantity() > 1) {
                cartItem.setQuantity(cartItem.getQuantity() - 1);
                cartRepository.save(cartItem);
            } else {
                cartRepository.delete(cartItem);
            }
        });
    }
}
