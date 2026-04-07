package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    
    @NotBlank(message = "Variant name is required")
    private String variantName;
    
    private String sku;
    
    @NotNull(message = "MRP is required")
    @DecimalMin(value = "0.01", message = "MRP must be greater than 0")
    private BigDecimal mrp;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;
    
    private BigDecimal discount;
    
    @NotNull(message = "Stock quantity is required")
    private Integer stockQuantity;
    
    private String availabilityStatus;
    
    @NotNull(message = "Active status is required")
    private Boolean isActive;
    
    private java.util.List<ProductImageDto> images;
}
