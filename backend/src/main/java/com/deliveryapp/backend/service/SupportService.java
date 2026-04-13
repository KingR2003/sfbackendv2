package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.SupportRequest;
import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.dto.GeneralQueryRequest;
import com.deliveryapp.backend.dto.OrderQueryRequest;
import com.deliveryapp.backend.dto.AdminSupportOrderDetailsResponse;
import com.deliveryapp.backend.entity.Support;
import com.deliveryapp.backend.entity.SupportImage;
import com.deliveryapp.backend.entity.StatusLogSupport;
import com.deliveryapp.backend.entity.TicketStatus;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.SupportRepository;
import com.deliveryapp.backend.repository.StatusLogSupportRepository;
import com.deliveryapp.backend.repository.UserRepository;
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
    private StatusLogSupportRepository statusLogSupportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private OrderService orderService;

    private void logStatusChange(Support support, TicketStatus newStatus) {
        StatusLogSupport log = new StatusLogSupport();
        log.setSupportId(support.getId());
        log.setStatus(newStatus);
        statusLogSupportRepository.save(log);
    }

    @Transactional
    public SupportResponse createGeneralQuery(GeneralQueryRequest request, List<MultipartFile> images) {
        Support support = new Support();
        support.setTicketId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        support.setName(request.getName());
        support.setEmail(request.getEmail());
        support.setSubject(request.getSubject());
        support.setMessage(request.getMessage());
        support.setStatus(TicketStatus.OPEN);

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
        logStatusChange(savedSupport, TicketStatus.OPEN);
        return mapToResponse(savedSupport);
    }

    @Transactional
    public SupportResponse createOrderQuery(String username, OrderQueryRequest request, List<MultipartFile> images) {
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByMobile(username)
                        .orElseThrow(() -> new RuntimeException("User not found")));

        Support support = new Support();
        support.setTicketId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        support.setName(user.getName());
        support.setEmail(user.getEmail());
        support.setSubject(request.getSubject());
        support.setMessage(request.getDescription());
        support.setOrderId(request.getOrderId());
        support.setStatus(TicketStatus.OPEN);

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
        logStatusChange(savedSupport, TicketStatus.OPEN);
        return mapToResponse(savedSupport);
    }

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

    @Transactional
    public SupportResponse updateStatus(String ticketId, com.deliveryapp.backend.dto.UpdateTicketStatusRequest request) {
        Support support = supportRepository.findByTicketId(ticketId);
        if (support == null) {
            throw new RuntimeException("Support ticket not found");
        }
        support.setStatus(request.getStatus());
        Support savedSupport = supportRepository.save(support);
        logStatusChange(savedSupport, request.getStatus());
        return mapToResponse(savedSupport);
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

    public AdminSupportOrderDetailsResponse getSupportWithOrderDetails(String ticketId) {
        Support support = supportRepository.findByTicketId(ticketId);
        if (support == null) {
            throw new RuntimeException("Support ticket not found");
        }

        List<String> imageUrls = support.getImages().stream()
                .map(SupportImage::getImageUrl)
                .collect(Collectors.toList());

        if (support.getOrderId() == null) {
            return AdminSupportOrderDetailsResponse.fromSupportAndOrder(
                    support, null, null, null, null, imageUrls);
        }

        try {
            Long orderId = Long.parseLong(support.getOrderId());
            com.deliveryapp.backend.dto.OrderDetailsResponse orderDetails = orderService.getOrderDetailsWithItems(orderId);

            return AdminSupportOrderDetailsResponse.fromSupportAndOrder(
                    support,
                    orderDetails.getOrder(),
                    orderDetails.getCustomer(),
                    orderDetails.getShippingAddress(),
                    orderDetails.getItems(),
                    imageUrls);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid order ID format");
        }
    }

    public List<AdminSupportOrderDetailsResponse> getSupportTicketsByOrderId(String orderId) {
        List<Support> supports = supportRepository.findByOrderId(orderId);

        try {
            Long orderIdLong = Long.parseLong(orderId);
            com.deliveryapp.backend.dto.OrderDetailsResponse orderDetails = orderService.getOrderDetailsWithItems(orderIdLong);

            return supports.stream().map(support -> {
                List<String> imageUrls = support.getImages().stream()
                        .map(SupportImage::getImageUrl)
                        .collect(Collectors.toList());

                return AdminSupportOrderDetailsResponse.fromSupportAndOrder(
                        support,
                        orderDetails.getOrder(),
                        orderDetails.getCustomer(),
                        orderDetails.getShippingAddress(),
                        orderDetails.getItems(),
                        imageUrls);
            }).collect(Collectors.toList());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid order ID format");
        }
    }
}
