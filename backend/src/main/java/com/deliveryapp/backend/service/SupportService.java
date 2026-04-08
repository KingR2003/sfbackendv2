package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.SupportRequest;
import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.entity.Support;
import com.deliveryapp.backend.entity.SupportImage;
import com.deliveryapp.backend.repository.SupportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SupportService {

    @Autowired
    private SupportRepository supportRepository;

    @Autowired
    private S3Service s3Service;

    @Transactional
    public SupportResponse createSupportTicket(SupportRequest request, List<MultipartFile> images) {
        Support support = new Support();
        support.setTicketId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        support.setName(request.getName());
        support.setEmail(request.getEmail());
        support.setSubject(request.getSubject());
        support.setMessage(request.getMessage());
        support.setOrderId(request.getOrderId());

        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    try {
                        String imageUrl = s3Service.uploadFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());
                        SupportImage image = new SupportImage();
                        image.setImageUrl(imageUrl);
                        image.setSupport(support);
                        support.getImages().add(image);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to upload image to S3", e);
                    }
                }
            }
        }

        Support savedSupport = supportRepository.save(support);
        return mapToResponse(savedSupport);
    }

    public List<SupportResponse> getAllSupportTickets() {
        return supportRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SupportResponse getSupportTicketById(String ticketId) {
        Support support = supportRepository.findByTicketId(ticketId);
        if (support == null) {
            throw new RuntimeException("Support ticket not found");
        }
        return mapToResponse(support);
    }

    private SupportResponse mapToResponse(Support support) {
        List<String> imageUrls = support.getImages().stream()
                .map(SupportImage::getImageUrl)
                .collect(Collectors.toList());

        return new SupportResponse(
                support.getTicketId(),
                support.getName(),
                support.getEmail(),
                support.getSubject(),
                support.getMessage(),
                support.getOrderId(),
                support.getStatus(),
                support.getCreatedAt(),
                imageUrls
        );
    }
}
