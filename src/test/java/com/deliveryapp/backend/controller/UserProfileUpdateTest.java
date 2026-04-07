package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.UpdateProfileRequest;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UserProfileUpdateTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setMobile("1234567890");
        mockUser.setEmail("test@example.com");
        mockUser.setName("Test User");
    }

    @Test
    @WithMockUser(username = "1234567890", roles = "CUSTOMER")
    void testPartialProfileUpdateSucceeds() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("Updated Name");
        // mobile and email are missing

        when(userService.updateProfile(anyString(), any(UpdateProfileRequest.class))).thenReturn(mockUser);

        mockMvc.perform(put("/api/v1/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"));
    }

    @Test
    @WithMockUser(username = "1234567890", roles = "CUSTOMER")
    void testPartialProfileUpdateWithGenderSucceeds() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setGender("Male");
        // mobile, email, name are missing

        when(userService.updateProfile(anyString(), any(UpdateProfileRequest.class))).thenReturn(mockUser);

        mockMvc.perform(put("/api/v1/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"));
    }
}
