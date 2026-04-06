package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDetailsDto {
    private Long id;
    private Long orderId;
    private Long variantId;
    private Long productId;
    private String productName;
    private String variantName;
    private BigDecimal priceAtPurchase;
    private Integer quantity;
    private BigDecimal subtotal;
}
