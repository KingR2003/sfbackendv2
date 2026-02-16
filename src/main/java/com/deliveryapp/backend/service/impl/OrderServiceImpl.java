package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.repository.OrderRepository;
import com.deliveryapp.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

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
}
