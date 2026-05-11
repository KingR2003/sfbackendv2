package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.UserQueryRequest;
import com.deliveryapp.backend.dto.UserQueryResponse;

import java.util.List;

public interface UserQueryService {
    UserQueryResponse createQuery(UserQueryRequest request);
    List<UserQueryResponse> getAllQueries();
    UserQueryResponse getQueryById(Long id);
    UserQueryResponse updateStatus(Long id, String status);
}
