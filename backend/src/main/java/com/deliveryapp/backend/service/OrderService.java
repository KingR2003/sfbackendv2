package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.CheckoutRequest;
import com.deliveryapp.backend.entity.OrderEntity;
import java.util.List;
import java.util.Optional;

public interface OrderService {
    OrderEntity createOrder(OrderEntity order);

    Optional<OrderEntity> getOrderById(Long id);

    List<OrderEntity> getAllOrders();

    OrderEntity updateOrder(Long id, OrderEntity order);

    void deleteOrder(Long id);

    OrderEntity checkout(Long userId, CheckoutRequest request);
}
