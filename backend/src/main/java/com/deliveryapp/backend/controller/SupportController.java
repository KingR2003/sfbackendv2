package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.SupportRequest;
import com.deliveryapp.backend.dto.SupportResponse;
import com.deliveryapp.backend.service.SupportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    @Autowired
    private SupportService supportService;

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<SupportResponse> createSupportTicket(
            @Valid @ModelAttribute SupportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        SupportResponse response = supportService.createSupportTicket(request, images);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
