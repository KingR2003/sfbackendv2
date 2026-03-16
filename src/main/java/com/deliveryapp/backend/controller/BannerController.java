package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.BannerCreateRequest;
import com.deliveryapp.backend.dto.BannerDto;
import com.deliveryapp.backend.dto.BannerUpdateRequest;
import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.service.BannerService;
import com.deliveryapp.backend.service.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;
    private final S3Service s3Service;

    // ----- Public Endpoints -----

    @GetMapping("/banners/active")
    public ResponseEntity<List<BannerDto>> getActiveBanners(
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String gender) {
        return ResponseEntity.ok(bannerService.getActiveBanners(platform, gender));
    }

    @PostMapping("/banners/{id}/view")
    public ResponseEntity<Void> incrementViews(@PathVariable Long id) {
        bannerService.incrementViews(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/banners/{id}/click")
    public ResponseEntity<Void> incrementClicks(@PathVariable Long id) {
        bannerService.incrementClicks(id);
        return ResponseEntity.ok().build();
    }

    // ----- Admin Endpoints -----

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/admin/banners")
    public ResponseEntity<List<BannerDto>> getAllBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/admin/banners/{id}")
    public ResponseEntity<BannerDto> getBannerById(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.getBannerById(id));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping("/admin/banners")
    public ResponseEntity<BannerDto> createBanner(@Valid @RequestBody BannerCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bannerService.createBanner(request));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/admin/banners/{id}")
    public ResponseEntity<BannerDto> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody BannerUpdateRequest request) {
        return ResponseEntity.ok(bannerService.updateBanner(id, request));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/admin/banners/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping("/admin/banners/{id}/upload-image")
    public ResponseEntity<Object> uploadBannerImage(@PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST.value(), "File is empty"),
                        HttpStatus.BAD_REQUEST);
            }

            String imageUrl = s3Service.uploadFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());
            bannerService.uploadBannerImage(id, imageUrl);

            return ResponseEntity.ok(new DataResponse<>(HttpStatus.OK.value(), "Banner image uploaded successfully", imageUrl));
        } catch (IOException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to upload image"),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
