package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.UserQueryRequest;
import com.deliveryapp.backend.service.UserQueryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/queries")
public class UserQueryController {

    @Autowired
    private UserQueryService userQueryService;

    @PostMapping
    public ResponseEntity<ApiResponse> submitQuery(@Valid @RequestBody UserQueryRequest request) {
        userQueryService.saveQuery(request);
        return new ResponseEntity<>(
                new ApiResponse(HttpStatus.CREATED.value(), "Query submitted successfully"),
                HttpStatus.CREATED);
    }
}
