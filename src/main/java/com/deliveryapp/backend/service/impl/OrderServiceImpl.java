package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.CartItemDto;
import com.deliveryapp.backend.dto.CartResponse;
import com.deliveryapp.backend.dto.CheckoutRequest;
import com.deliveryapp.backend.entity.*;
import com.deliveryapp.backend.repository.CouponUsageRepository;
import com.deliveryapp.backend.repository.OrderItemRepository;
import com.deliveryapp.backend.repository.OrderRepository;
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

    @Override
    @Transactional
    public OrderEntity checkout(Long userId, CheckoutRequest request) {
        // 1. Get Cart
        CartResponse cart = cartService.getCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        BigDecimal totalAmount = cart.getTotalAmount();
        BigDecimal discountAmount = BigDecimal.ZERO;
        boolean couponApplied = false;

        // 2. Apply Coupon if present
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponService.verifyCoupon(request.getCouponCode(), userId, totalAmount);

            if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                discountAmount = totalAmount.multiply(coupon.getDiscountValue()).divide(new BigDecimal(100));
            } else if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
                discountAmount = coupon.getDiscountValue();
            }

            // Cap discount if maxDiscountAmount is set
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

        // 3. Create Order
        OrderEntity order = new OrderEntity();
        order.setUserId(userId);
        order.setAddressId(request.getAddressId());
        order.setTotalAmount(totalAmount);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);
        order.setCouponApplied(couponApplied);
        order.setOrderStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        OrderEntity savedOrder = orderRepository.save(order);

        // 4. Create Order Items
        for (CartItemDto cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(savedOrder.getId());
            orderItem.setVariantId(cartItem.getVariantId());
            orderItem.setPriceAtPurchase(cartItem.getUnitPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(cartItem.getSubtotal());
            orderItemRepository.save(orderItem);
        }

        // 5. Clear Cart
        cartService.clearCart(userId);

        return savedOrder;
    }
}
