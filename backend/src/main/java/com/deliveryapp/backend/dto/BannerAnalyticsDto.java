package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerAnalyticsDto {
    // KPI metrics
    private Long totalImpressions;
    private Double impressionChange; // percentage change
    private Long totalClicks;
    private Double clickChange; // percentage change
    private Double averageCTR;
    private Double ctrChange; // percentage change
    
    // Top performer
    private String topPerformerName;
    private Long topPerformerViews;
    
    // For "Views & Clicks — Last 14 Days" line chart
    private Map<String, Map<String, Long>> viewsClicksTrendLast14Days;
    
    // For "Views by Campaign Type" pie chart
    private Map<String, Long> viewsByCampaignType;
    
    // For "Impressions by Platform" pie chart
    private Map<String, Long> impressionsByPlatform;
    
    // For "Impressions by Audience Gender" pie chart
    private Map<String, Long> impressionsByGender;
    
    // For "Banner Performance Comparison" bar chart
    private Map<String, Map<String, Long>> bannerPerformanceComparison;
    
    // For "Banner Leaderboard" table - all banners ranked by impressions
    private List<BannerAnalyticsItem> bannerLeaderboard;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BannerAnalyticsItem {
        private Long id;
        private String title;
        private String campaign;
        private String status; // Active, Inactive, Expired
        private String campaignType; // New Product, Festival, Discount, Seasonal
        private String platform; // Mobile App, Web, Both
        private Long views;
        private Long clicks;
        private Double clickThroughRate;
        private String gender; // Men, Women, All Users
    }
}
