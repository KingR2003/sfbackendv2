package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.UserQueryRequest;
import com.deliveryapp.backend.dto.UserQueryResponse;
import com.deliveryapp.backend.entity.UserQuery;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserQueryRepository;
import com.deliveryapp.backend.service.UserQueryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserQueryServiceImpl implements UserQueryService {

    @Autowired
    private UserQueryRepository userQueryRepository;

    @Override
    public UserQueryResponse createQuery(UserQueryRequest request) {
        UserQuery userQuery = new UserQuery();
        BeanUtils.copyProperties(request, userQuery);
        UserQuery saved = userQueryRepository.save(userQuery);
        return mapToResponse(saved);
    }

    @Override
    public List<UserQueryResponse> getAllQueries() {
        return userQueryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserQueryResponse getQueryById(Long id) {
        UserQuery userQuery = userQueryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User query not found with id: " + id));
        return mapToResponse(userQuery);
    }

    @Override
    public UserQueryResponse updateStatus(Long id, String status) {
        UserQuery userQuery = userQueryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User query not found with id: " + id));
        userQuery.setStatus(status);
        UserQuery updated = userQueryRepository.save(userQuery);
        return mapToResponse(updated);
    }

    private UserQueryResponse mapToResponse(UserQuery entity) {
        UserQueryResponse response = new UserQueryResponse();
        BeanUtils.copyProperties(entity, response);
        return response;
    }
}
