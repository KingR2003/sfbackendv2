package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String name;
    private String description;
    private Long categoryId;
    private Boolean isActive;
    private List<ProductImageDto> images;
    private List<ProductVariantDto> variants;
}
