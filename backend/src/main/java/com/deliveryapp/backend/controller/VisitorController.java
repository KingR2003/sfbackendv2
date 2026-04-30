package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.VisitorDto;
import com.deliveryapp.backend.entity.Visitor;
import com.deliveryapp.backend.repository.VisitorRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/visitors")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorRepository visitorRepository;

    @PostMapping("/track")
    public ResponseEntity<String> trackVisitor(@RequestBody VisitorDto visitorDto, HttpServletRequest request) {
        if (visitorDto.getSessionId() == null || visitorDto.getSessionId().isEmpty()) {
            return ResponseEntity.badRequest().body("Session ID is required");
        }

        Visitor visitor = new Visitor();
        visitor.setSessionId(visitorDto.getSessionId());
        visitor.setUserId(visitorDto.getUserId());
        visitor.setIpAddress(request.getRemoteAddr());
        visitor.setUserAgent(request.getHeader("User-Agent"));

        visitorRepository.save(visitor);
        
        return ResponseEntity.ok("Visitor tracked successfully");
    }
}
