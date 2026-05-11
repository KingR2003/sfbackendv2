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
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.entity.BannerInteraction;
import com.deliveryapp.backend.repository.BannerInteractionRepository;
import com.deliveryapp.backend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;
    private final UserRepository userRepository;
    private final BannerInteractionRepository bannerInteractionRepository;

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
        Banner banner = bannerRepository.findByIdAndStatus(id, "active")
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
        Banner banner = bannerRepository.findByIdAndStatus(id, "active")
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
        banner.setStatus("inactive");
        bannerRepository.save(banner);
    }

    @Override
    public BannerDto getBannerById(Long id) {
        Banner banner = bannerRepository.findByIdAndStatus(id, "active")
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
        return mapToDto(banner);
    }

    @Override
    public List<BannerDto> getAllBanners() {
        return bannerRepository.findByStatusOrderByPriorityAsc("active")
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BannerDto> getActiveBanners(String platform, String gender) {
        LocalDateTime now = LocalDateTime.now();
        List<Banner> activeBanners = bannerRepository.findByIsActiveTrueAndStatusAndStartDateTimeBeforeAndEndDateTimeAfter("active", now, now);

        User loggedInUser = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            String username = authentication.getName();
            loggedInUser = userRepository.findByEmail(username)
                    .orElseGet(() -> userRepository.findByMobile(username).orElse(null));
        }

        final User finalUser = loggedInUser;

        return activeBanners.stream()
                .filter(b -> {
                    // Platform filter
                    if (platform != null) {
                        String bannerPlatform = b.getPlatform();
                        if (bannerPlatform == null) return false;
                        if (!bannerPlatform.equalsIgnoreCase("BOTH") && !bannerPlatform.equalsIgnoreCase(platform)) {
                            return false;
                        }
                    }

                    // If guest user, all banners are visible
                    if (finalUser == null) {
                        return true;
                    }

                    // Logged in user: check gender
                    String bannerGender = b.getGender();
                    if (bannerGender != null && !bannerGender.equalsIgnoreCase("All Users") && !bannerGender.equalsIgnoreCase("All")) {
                        if (finalUser.getGender() == null || !bannerGender.equalsIgnoreCase(finalUser.getGender())) {
                            return false; // User gender doesn't match banner specific gender
                        }
                    }

                    // Logged in user: check age group
                    String bannerAgeGroup = b.getAgeGroup();
                    if (bannerAgeGroup != null && !bannerAgeGroup.equalsIgnoreCase("All Ages") && !bannerAgeGroup.equalsIgnoreCase("All")) {
                        if (finalUser.getDateOfBirth() == null) {
                            return false; // User has no DOB set, cannot match specific age group
                        }
                        
                        int age = Period.between(finalUser.getDateOfBirth(), LocalDate.now()).getYears();
                        boolean matchesAge = false;
                        String parsedAgeGroup = bannerAgeGroup.replaceAll("\\s+", "");
                        
                        if (parsedAgeGroup.contains("-") || parsedAgeGroup.contains("–")) {
                            String sep = parsedAgeGroup.contains("-") ? "-" : "–";
                            String[] parts = parsedAgeGroup.split(sep);
                            if (parts.length == 2) {
                                try {
                                    int min = Integer.parseInt(parts[0]);
                                    int max = Integer.parseInt(parts[1]);
                                    if (age >= min && age <= max) matchesAge = true;
                                } catch (NumberFormatException ignored) {}
                            }
                        } else if (parsedAgeGroup.startsWith("<")) {
                            try {
                                int max = Integer.parseInt(parsedAgeGroup.substring(1));
                                if (age < max) matchesAge = true;
                            } catch (NumberFormatException ignored) {}
                        } else if (parsedAgeGroup.endsWith("+")) {
                            try {
                                int min = Integer.parseInt(parsedAgeGroup.substring(0, parsedAgeGroup.length() - 1));
                                if (age >= min) matchesAge = true;
                            } catch (NumberFormatException ignored) {}
                        } else {
                            matchesAge = true; // Fallback for unrecognized formats
                        }
                        
                        if (!matchesAge) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void incrementViews(Long id, Long userId, String platform) {
        Banner banner = bannerRepository.findByIdAndStatus(id, "active").orElse(null);
        if (banner != null) {
            banner.setViews((banner.getViews() == null ? 0 : banner.getViews()) + 1);
            bannerRepository.save(banner);

            // Record detailed interaction
            BannerInteraction interaction = BannerInteraction.builder()
                    .bannerId(id)
                    .userId(userId)
                    .interactionType(BannerInteraction.InteractionType.VIEW)
                    .platform(platform != null ? platform.toUpperCase() : "BOTH")
                    .build();
            bannerInteractionRepository.save(interaction);
        }
    }

    @Override
    @Transactional
    public void incrementClicks(Long id, Long userId, String platform) {
        Banner banner = bannerRepository.findByIdAndStatus(id, "active").orElse(null);
        if (banner != null) {
            banner.setClicks((banner.getClicks() == null ? 0 : banner.getClicks()) + 1);
            bannerRepository.save(banner);

            // Record detailed interaction
            BannerInteraction interaction = BannerInteraction.builder()
                    .bannerId(id)
                    .userId(userId)
                    .interactionType(BannerInteraction.InteractionType.CLICK)
                    .platform(platform != null ? platform.toUpperCase() : "BOTH")
                    .build();
            bannerInteractionRepository.save(interaction);
        }
    }

    @Override
    @Transactional
    public void uploadBannerImage(Long id, String imageUrl) {
        Banner banner = bannerRepository.findByIdAndStatus(id, "active")
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
