package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.SupportRequest;
import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.dto.AdminSupportReplyRequest;
import com.deliveryapp.backend.dto.SupportMessageDto;
import com.deliveryapp.backend.dto.GeneralQueryRequest;
import com.deliveryapp.backend.dto.OrderQueryRequest;
import com.deliveryapp.backend.dto.AdminSupportOrderDetailsResponse;
import com.deliveryapp.backend.entity.Support;
import com.deliveryapp.backend.entity.SupportImage;
import com.deliveryapp.backend.entity.SupportMessage;
import com.deliveryapp.backend.entity.StatusLogSupport;
import com.deliveryapp.backend.entity.TicketStatus;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.SupportMessageRepository;
import com.deliveryapp.backend.repository.SupportRepository;
import com.deliveryapp.backend.repository.StatusLogSupportRepository;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SupportService {

    private static final Logger logger = LoggerFactory.getLogger(SupportService.class);


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

    @Autowired
    private SupportMessageRepository supportMessageRepository;

    @Autowired
    private EmailService emailService;

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
        logger.info("Attempting to create order query for username: {}", username);
        
        User user = userRepository.findByEmail(username)
                .or(() -> {
                    logger.info("User not found by email, trying by mobile: {}", username);
                    return userRepository.findByMobile(username);
                })
                .or(() -> {
                    try {
                        logger.info("User not found by email or mobile, checking if username is an ID: {}", username);
                        Long id = Long.parseLong(username);
                        return userRepository.findById(id);
                    } catch (NumberFormatException e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> {
                    logger.error("User lookup failed for username: {}", username);
                    return new RuntimeException("User not found");
                });

        logger.info("Successfully loaded user for order query - ID: {}, Name: {}, Mobile: {}, Status: {}, Role: {}", 
                user.getId(), user.getName(), user.getMobile(), user.getStatus(), user.getRole());

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

    public List<AdminSupportOrderDetailsResponse> getAllSupportTicketsWithOrderDetails() {
        return supportRepository.findAll().stream().map(support -> {
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
            } catch (Exception e) {
                return AdminSupportOrderDetailsResponse.fromSupportAndOrder(
                        support, null, null, null, null, imageUrls);
            }
        }).collect(Collectors.toList());
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

    @Transactional
    public SupportMessageDto respondToTicket(String ticketId, AdminSupportReplyRequest request) {
        Support support = supportRepository.findByTicketId(ticketId);
        if (support == null) {
            throw new RuntimeException("Support ticket not found with ticketId: " + ticketId);
        }

        // 1. Save the reply to DB
        SupportMessage msg = new SupportMessage();
        msg.setSupport(support);
        msg.setSenderName(request.getAdminName() != null ? request.getAdminName() : "Support Team");
        msg.setMessage(request.getMessage());
        msg.setFromAdmin(true);
        SupportMessage saved = supportMessageRepository.save(msg);

        // 2. Send email to customer
        try {
            emailService.sendSupportReply(
                    support.getEmail(),
                    support.getTicketId(),
                    support.getSubject(),
                    request.getAdminName(),
                    request.getMessage()
            );
        } catch (Exception e) {
            logger.error("Failed to send email for ticket {}: {}", ticketId, e.getMessage());
            // Don't fail the whole request if only email fails
        }

        return SupportMessageDto.from(saved);
    }

    public List<SupportMessageDto> getMessages(String ticketId) {
        Support support = supportRepository.findByTicketId(ticketId);
        if (support == null) {
            throw new RuntimeException("Support ticket not found with ticketId: " + ticketId);
        }
        return supportMessageRepository.findBySupportIdOrderByCreatedAtAsc(support.getId())
                .stream()
                .map(SupportMessageDto::from)
                .collect(Collectors.toList());
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
