package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.UpdateTicketStatusRequest;
import com.deliveryapp.backend.dto.UserQueryRequest;
import com.deliveryapp.backend.dto.UserQueryResponse;
import com.deliveryapp.backend.entity.TicketStatus;
import com.deliveryapp.backend.entity.UserQuery;
import com.deliveryapp.backend.repository.UserQueryRepository;
import jakarta.persistence.EntityNotFoundException;
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
        query.setStatus(TicketStatus.OPEN);

        // Save first to get the generated ID, then set the human-readable ticketId
        UserQuery saved = userQueryRepository.save(query);
        saved.setTicketId(String.format("TKT-%05d", saved.getId()));
        userQueryRepository.save(saved);
    }

    public List<UserQueryResponse> getAllQueries() {
        return userQueryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserQueryResponse updateStatus(Long id, UpdateTicketStatusRequest request) {
        UserQuery query = userQueryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found with id: " + id));
        query.setStatus(request.getStatus());
        UserQuery updated = userQueryRepository.save(query);
        return mapToResponse(updated);
    }

    private UserQueryResponse mapToResponse(UserQuery query) {
        return UserQueryResponse.builder()
                .id(query.getId())
                .ticketId(query.getTicketId())
                .firstName(query.getFirstName())
                .lastName(query.getLastName())
                .email(query.getEmail())
                .subject(query.getSubject())
                .message(query.getMessage())
                .status(query.getStatus())
                .createdAt(query.getCreatedAt())
                .updatedAt(query.getUpdatedAt())
                .build();
    }
}
