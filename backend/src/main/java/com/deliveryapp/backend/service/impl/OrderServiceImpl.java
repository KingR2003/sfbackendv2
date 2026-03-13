package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.CartItemDto;
import com.deliveryapp.backend.dto.CartResponse;
import com.deliveryapp.backend.dto.CheckoutRequest;
import com.deliveryapp.backend.entity.*;
import com.deliveryapp.backend.repository.CouponUsageRepository;
import com.deliveryapp.backend.repository.OrderItemRepository;
import com.deliveryapp.backend.repository.OrderRepository;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.service.CartService;
import com.deliveryapp.backend.service.CouponService;
import com.deliveryapp.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private CouponService couponService;

    @Autowired
    private CouponUsageRepository couponUsageRepository;

    @Override
    public OrderEntity createOrder(OrderEntity order) {
        return orderRepository.save(order);
    }

    @Override
    public Optional<OrderEntity> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Override
    public List<OrderEntity> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public OrderEntity updateOrder(Long id, OrderEntity order) {
        if (orderRepository.existsById(id)) {
            return orderRepository.save(order);
        }
        return null;
    }

    @Override
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    @Autowired
    private com.deliveryapp.backend.repository.ProductVariantRepository productVariantRepository;

    @Override
    @Transactional
    public OrderEntity checkout(Long userId, CheckoutRequest request) {
        // 1. Get Cart
        CartResponse cart = cartService.getCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        // 1.1 Verify all items are available
        for (CartItemDto item : cart.getItems()) {
            ProductVariant variant = productVariantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + item.getVariantId()));
            if (variant.getStockQuantity() < item.getQuantity()) {
                throw new IllegalArgumentException("Product " + item.getProductName() + " is out of stock!");
            }
        }

        BigDecimal totalAmount = cart.getTotalAmount();
        BigDecimal discountAmount = BigDecimal.ZERO;
        boolean couponApplied = false;

        // 2. Apply Coupon if present
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponService.verifyCoupon(request.getCouponCode(), userId, totalAmount);
            // Re-verify specific business rules here if needed

            if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                discountAmount = totalAmount.multiply(coupon.getDiscountValue()).divide(new BigDecimal(100));
            } else if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
                discountAmount = coupon.getDiscountValue();
            }

            if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discountAmount = coupon.getMaxDiscountAmount();
            }

            couponApplied = true;

            // Update Coupon Usage
            CouponUsage usage = couponUsageRepository.findByCouponIdAndUserId(coupon.getId(), userId)
                    .orElse(new CouponUsage(null, coupon.getId(), userId, 0));
            usage.setUsageCount(usage.getUsageCount() + 1);
            couponUsageRepository.save(usage);
        }

        BigDecimal finalAmount = totalAmount.subtract(discountAmount);

        // 3. Update stock and create order items
        for (CartItemDto cartItem : cart.getItems()) {
            ProductVariant variant = productVariantRepository.findById(cartItem.getVariantId()).get();
            variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
            productVariantRepository.save(variant);
        }

        // 4. Create Order
        OrderEntity order = new OrderEntity();
        order.setUserId(userId);
        order.setAddressId(request.getAddressId());
        order.setTotalAmount(totalAmount);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);
        order.setCouponApplied(couponApplied);
        order.setOrderStatus("PROCESSING");
        order.setCreatedAt(LocalDateTime.now());

        OrderEntity savedOrder = orderRepository.save(order);

        // 5. Create Order Items
        for (CartItemDto cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(savedOrder.getId());
            orderItem.setVariantId(cartItem.getVariantId());
            orderItem.setPriceAtPurchase(cartItem.getUnitPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(cartItem.getSubtotal());
            orderItemRepository.save(orderItem);
        }

        // 6. Clear Cart
        cartService.clearCart(userId);

        return savedOrder;
    }
}
