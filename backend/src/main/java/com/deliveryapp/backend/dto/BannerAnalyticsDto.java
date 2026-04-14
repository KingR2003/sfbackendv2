package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerAnalyticsDto {
    private List<BannerAnalyticsItem> banners;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BannerAnalyticsItem {
        private Long id;
        private String title;
        private Long views;
        private Long clicks;
        private Double clickThroughRate;
        private String platform;
        private String gender;
    }
}
