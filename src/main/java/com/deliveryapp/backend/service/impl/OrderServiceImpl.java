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
        List<OrderEntity> orders = orderRepository.findAll();
        for (OrderEntity order : orders) {
            populateUserAndAddress(order);
        }
        return orders;
    }

    private void populateUserAndAddress(OrderEntity order) {
        if (order.getUserId() != null && userRepository != null) {
            userRepository.findById(order.getUserId()).ifPresent(u -> order.setUserName(u.getName()));
        }
        if (order.getAddressId() != null && addressRepository != null) {
            addressRepository.findById(order.getAddressId()).ifPresent(a -> {
                java.util.List<String> parts = new java.util.ArrayList<>();
                if (a.getBuildingNo() != null && !a.getBuildingNo().isEmpty()) parts.add(a.getBuildingNo());
                if (a.getBuildingName() != null && !a.getBuildingName().isEmpty()) parts.add(a.getBuildingName());
                if (a.getStreetNo() != null && !a.getStreetNo().isEmpty()) parts.add(a.getStreetNo());
                if (a.getAreaName() != null && !a.getAreaName().isEmpty()) parts.add(a.getAreaName());
                if (a.getCity() != null && !a.getCity().isEmpty()) parts.add(a.getCity());
                if (a.getPincode() != null && !a.getPincode().isEmpty()) parts.add(a.getPincode());
                order.setDeliveryAddress(String.join(", ", parts));
            });
        }
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

    @Autowired
    private com.deliveryapp.backend.repository.UserRepository userRepository;

    @Autowired
    private com.deliveryapp.backend.repository.AddressRepository addressRepository;

    @Override
    public com.deliveryapp.backend.dto.OrderDetailsResponse getOrderDetailsWithItems(Long id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

        com.deliveryapp.backend.entity.User user = userRepository.findById(order.getUserId()).orElse(null);
        com.deliveryapp.backend.entity.Address address = null;
        if (order.getAddressId() != null) {
            address = addressRepository.findById(order.getAddressId()).orElse(null);
        }

        java.util.Map<String, Object> customerMap = new java.util.HashMap<>();
        if (user != null) {
            customerMap.put("id", user.getId());
            customerMap.put("name", user.getName());
            customerMap.put("email", user.getEmail());
            customerMap.put("mobile", user.getMobile());
            customerMap.put("role", user.getRole());
            customerMap.put("isActive", user.isActive());
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<com.deliveryapp.backend.dto.OrderItemDetailsDto> itemDtos = items.stream().map(item -> {
            com.deliveryapp.backend.dto.OrderItemDetailsDto dto = new com.deliveryapp.backend.dto.OrderItemDetailsDto();
            dto.setId(item.getId());
            dto.setOrderId(item.getOrderId());
            dto.setVariantId(item.getVariantId());
            dto.setPriceAtPurchase(item.getPriceAtPurchase());
            dto.setQuantity(item.getQuantity());
            dto.setSubtotal(item.getSubtotal());

            ProductVariant variant = productVariantRepository.findById(item.getVariantId()).orElse(null);
            if (variant != null) {
                dto.setVariantName(variant.getVariantName());
                dto.setProductId(variant.getProductId());
                if (variant.getProduct() != null) {
                    dto.setProductName(variant.getProduct().getName());
                }
            }
            return dto;
        }).collect(java.util.stream.Collectors.toList());

        com.deliveryapp.backend.dto.OrderDetailsResponse response = new com.deliveryapp.backend.dto.OrderDetailsResponse();
        response.setOrder(order);
        response.setCustomer(customerMap);
        response.setShippingAddress(address);
        response.setItems(itemDtos);

        return response;
    }

    @Override
    public List<OrderEntity> getOrdersByUserId(Long userId) {
        List<OrderEntity> orders = orderRepository.findByUserId(userId);
        for (OrderEntity order : orders) {
            populateUserAndAddress(order);
        }
        return orders;
    }
}
