package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.BannerCreateRequest;
import com.deliveryapp.backend.dto.BannerDto;
import com.deliveryapp.backend.dto.BannerUpdateRequest;
import com.deliveryapp.backend.entity.Banner;
import com.deliveryapp.backend.repository.BannerRepository;
import com.deliveryapp.backend.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;

    @Override
    @Transactional
    public BannerDto createBanner(BannerCreateRequest request) {
        Banner banner = new Banner();
        BeanUtils.copyProperties(request, banner);
        Banner savedBanner = bannerRepository.save(banner);
        return mapToDto(savedBanner);
    }

    @Override
    @Transactional
    public BannerDto updateBanner(Long id, BannerUpdateRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));

        if (request.getPriority() != null) banner.setPriority(request.getPriority());
        if (request.getBannerImage() != null) banner.setBannerImage(request.getBannerImage());
        if (request.getTitle() != null) banner.setTitle(request.getTitle());
        if (request.getCampaignType() != null) banner.setCampaignType(request.getCampaignType());
        if (request.getDescription() != null) banner.setDescription(request.getDescription());
        if (request.getPlatform() != null) banner.setPlatform(request.getPlatform());
        if (request.getGender() != null) banner.setGender(request.getGender());
        if (request.getAgeGroup() != null) banner.setAgeGroup(request.getAgeGroup());
        if (request.getButtonText() != null) banner.setButtonText(request.getButtonText());
        if (request.getRedirectTo() != null) banner.setRedirectTo(request.getRedirectTo());
        if (request.getCustomPageUrl() != null) banner.setCustomPageUrl(request.getCustomPageUrl());
        if (request.getStartDateTime() != null) banner.setStartDateTime(request.getStartDateTime());
        if (request.getEndDateTime() != null) banner.setEndDateTime(request.getEndDateTime());
        if (request.getIsActive() != null) banner.setIsActive(request.getIsActive());

        Banner updatedBanner = bannerRepository.save(banner);
        return mapToDto(updatedBanner);
    }

    @Override
    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
        bannerRepository.delete(banner);
    }

    @Override
    public BannerDto getBannerById(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
        return mapToDto(banner);
    }

    @Override
    public List<BannerDto> getAllBanners() {
        return bannerRepository.findAllByOrderByPriorityAsc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BannerDto> getActiveBanners(String platform, String gender) {
        LocalDateTime now = LocalDateTime.now();
        List<Banner> activeBanners = bannerRepository.findByIsActiveTrueAndStartDateTimeBeforeAndEndDateTimeAfter(now, now);
        
        return activeBanners.stream()
                .filter(b -> {
                    // "BOTH" means it applies to both platforms
                    if (platform != null && !b.getPlatform().equalsIgnoreCase("BOTH") && !b.getPlatform().equalsIgnoreCase(platform)) {
                        return false;
                    }
                    // "ALL" means it applies to all genders
                    if (gender != null && !b.getGender().equalsIgnoreCase("ALL") && !b.getGender().equalsIgnoreCase(gender)) {
                        return false;
                    }
                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void incrementViews(Long id) {
        Banner banner = bannerRepository.findById(id).orElse(null);
        if (banner != null) {
            banner.setViews((banner.getViews() == null ? 0 : banner.getViews()) + 1);
            bannerRepository.save(banner);
        }
    }

    @Override
    @Transactional
    public void incrementClicks(Long id) {
        Banner banner = bannerRepository.findById(id).orElse(null);
        if (banner != null) {
            banner.setClicks((banner.getClicks() == null ? 0 : banner.getClicks()) + 1);
            bannerRepository.save(banner);
        }
    }

    @Override
    @Transactional
    public void uploadBannerImage(Long id, String imageUrl) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
        banner.setBannerImage(imageUrl);
        bannerRepository.save(banner);
    }

    private BannerDto mapToDto(Banner banner) {
        BannerDto dto = new BannerDto();
        BeanUtils.copyProperties(banner, dto);
        dto.computeDynamicFields();
        return dto;
    }
}
