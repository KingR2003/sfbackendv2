package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.BannerCreateRequest;
import com.deliveryapp.backend.dto.BannerDto;
import com.deliveryapp.backend.dto.BannerUpdateRequest;

import java.util.List;

public interface BannerService {
    BannerDto createBanner(BannerCreateRequest request);
    BannerDto updateBanner(Long id, BannerUpdateRequest request);
    void deleteBanner(Long id);
    BannerDto getBannerById(Long id);
    List<BannerDto> getAllBanners();
    List<BannerDto> getActiveBanners(String platform, String gender);
    void incrementViews(Long id);
    void incrementClicks(Long id);
    void uploadBannerImage(Long id, String imageUrl);
}
