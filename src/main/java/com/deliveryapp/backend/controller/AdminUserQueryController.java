package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.DataResponse;
import com.deliveryapp.backend.dto.UserQueryResponse;
import com.deliveryapp.backend.service.UserQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/queries")
public class AdminUserQueryController {

    @Autowired
    private UserQueryService userQueryService;

    @GetMapping
    public ResponseEntity<DataResponse<List<UserQueryResponse>>> getAllQueries() {
        List<UserQueryResponse> queries = userQueryService.getAllQueries();
        return ResponseEntity.ok(
                new DataResponse<>(HttpStatus.OK.value(), "Queries retrieved successfully", queries));
    }
}
