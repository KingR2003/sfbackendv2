package com.deliveryapp.backend.dto;

import com.deliveryapp.backend.entity.Address;
import com.deliveryapp.backend.entity.OrderEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailsResponse {
    private OrderEntity order;
    private Map<String, Object> customer;
    private Address shippingAddress;
    private List<OrderItemDetailsDto> items;
}
