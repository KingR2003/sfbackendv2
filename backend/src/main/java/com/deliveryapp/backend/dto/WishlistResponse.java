package com.deliveryapp.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {

    private Long wishlistItemId;
    private Long productId;
    private String productName;
    private String productDescription;
    private boolean isAvailable;

    /** Product-level images (not tied to a specific variant). */
    private List<ProductImageDto> images;

    /** All active variants with price, stock, and availability. */
    private List<ProductVariantDto> variants;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime addedAt;
}
