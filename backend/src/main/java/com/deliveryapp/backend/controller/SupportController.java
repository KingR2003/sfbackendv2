package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.SupportRequest;
import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.dto.GeneralQueryRequest;
import com.deliveryapp.backend.dto.OrderQueryRequest;
import com.deliveryapp.backend.service.SupportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/support")
public class SupportController {

    @Autowired
    private SupportService supportService;

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<com.deliveryapp.backend.dto.DataResponse<SupportResponse>> createSupportTicket(
            @Valid @ModelAttribute SupportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        SupportResponse response = supportService.createSupportTicket(request, images);
        return new ResponseEntity<>(
                new com.deliveryapp.backend.dto.DataResponse<>(HttpStatus.CREATED.value(), "Support ticket created successfully", response),
                HttpStatus.CREATED);
    }

    @PostMapping(value = "/general", consumes = { MediaType.APPLICATION_JSON_VALUE })
    public ResponseEntity<com.deliveryapp.backend.dto.DataResponse<SupportResponse>> createGeneralQuery(
            @Valid @RequestBody GeneralQueryRequest request) {
        SupportResponse response = supportService.createGeneralQuery(request, null);
        return new ResponseEntity<>(
                new com.deliveryapp.backend.dto.DataResponse<>(HttpStatus.CREATED.value(), "General query submitted successfully", response),
                HttpStatus.CREATED);
    }

    @PostMapping(value = "/order-query", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<com.deliveryapp.backend.dto.DataResponse<SupportResponse>> createOrderQuery(
            @Valid @ModelAttribute OrderQueryRequest request,
            @RequestPart(value = "image", required = false) List<MultipartFile> images) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        SupportResponse response = supportService.createOrderQuery(userEmail, request, images);
        return new ResponseEntity<>(
                new com.deliveryapp.backend.dto.DataResponse<>(HttpStatus.CREATED.value(), "Order query submitted successfully", response),
                HttpStatus.CREATED);
    }
}
