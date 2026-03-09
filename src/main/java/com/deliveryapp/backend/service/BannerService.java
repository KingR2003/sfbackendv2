package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.Banner;
import java.util.List;

public interface BannerService {
    List<Banner> getAllBanners();
    Banner getBannerById(Long id);
    Banner createBanner(Banner banner);
    Banner updateBanner(Long id, Banner bannerDetails);
    void deleteBanner(Long id);
    List<Banner> getActiveBanners();
}
