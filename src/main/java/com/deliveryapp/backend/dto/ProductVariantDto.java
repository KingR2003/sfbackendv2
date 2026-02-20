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
public class ProductVariantDto {
    private Long id;
    private String variantName;
    private String sku;
    private BigDecimal mrp;
    private BigDecimal price;
    private BigDecimal discount;
    private Integer stockQuantity;
    private String availabilityStatus;
    private Boolean isActive;
    private java.util.List<ProductImageDto> images;
}
