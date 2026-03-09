package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.Banner;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.BannerRepository;
import com.deliveryapp.backend.service.BannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BannerServiceImpl implements BannerService {

    @Autowired
    private BannerRepository bannerRepository;

    @Override
    public List<Banner> getAllBanners() {
        return bannerRepository.findAll();
    }

    @Override
    public Banner getBannerById(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));
    }

    @Override
    public Banner createBanner(Banner banner) {
        return bannerRepository.save(banner);
    }

    @Override
    public Banner updateBanner(Long id, Banner bannerDetails) {
        Banner banner = getBannerById(id);
        banner.setTitle(bannerDetails.getTitle());
        banner.setImageUrl(bannerDetails.getImageUrl());
        banner.setPlatform(bannerDetails.getPlatform());
        banner.setGender(bannerDetails.getGender());
        banner.setAgeGroup(bannerDetails.getAgeGroup());
        banner.setButtonText(bannerDetails.getButtonText());
        banner.setRedirectTo(bannerDetails.getRedirectTo());
        banner.setStartDate(bannerDetails.getStartDate());
        banner.setEndDate(bannerDetails.getEndDate());
        banner.setPriority(bannerDetails.getPriority());
        banner.setIsActive(bannerDetails.getIsActive());
        banner.setDevices(bannerDetails.getDevices());
        return bannerRepository.save(banner);
    }

    @Override
    public void deleteBanner(Long id) {
        Banner banner = getBannerById(id);
        bannerRepository.delete(banner);
    }

    @Override
    public List<Banner> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByPriorityAsc();
    }
}
