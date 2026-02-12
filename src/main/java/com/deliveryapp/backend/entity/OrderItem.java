package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "variant_id")
    private Long variantId;

    @Column(name = "price_at_purchase")
    private BigDecimal priceAtPurchase;

    private Integer quantity;

    private BigDecimal subtotal;

    public OrderItem() {
    }
}
