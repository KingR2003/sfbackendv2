package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.UserQueryRequest;
import com.deliveryapp.backend.dto.UserQueryResponse;
import com.deliveryapp.backend.entity.UserQuery;
import com.deliveryapp.backend.repository.UserQueryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserQueryService {

    @Autowired
    private UserQueryRepository userQueryRepository;

    public void saveQuery(UserQueryRequest request) {
        UserQuery query = new UserQuery();
        query.setFirstName(request.getFirstName());
        query.setLastName(request.getLastName());
        query.setEmail(request.getEmail());
        query.setSubject(request.getSubject());
        query.setMessage(request.getMessage());
        userQueryRepository.save(query);
    }

    public List<UserQueryResponse> getAllQueries() {
        return userQueryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private UserQueryResponse mapToResponse(UserQuery query) {
        return UserQueryResponse.builder()
                .id(query.getId())
                .firstName(query.getFirstName())
                .lastName(query.getLastName())
                .email(query.getEmail())
                .subject(query.getSubject())
                .message(query.getMessage())
                .createdAt(query.getCreatedAt())
                .build();
    }
}
