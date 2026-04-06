package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminMemberControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testActivateUser() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setStatus("ACTIVE");
        user.setActive(true);

        when(userService.activateUser(anyLong())).thenReturn(user);

        mockMvc.perform(put("/api/v1/admin/members/1/activate")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User activated successfully"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testDeactivateUser() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setStatus("INACTIVE");
        user.setActive(false);

        when(userService.deactivateUser(anyLong())).thenReturn(user);

        mockMvc.perform(put("/api/v1/admin/members/1/deactivate")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deactivated successfully"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    public void testActivateUserAsCustomerFails() throws Exception {
        mockMvc.perform(put("/api/v1/admin/members/1/activate")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testUpdateMember() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("Updated Name");
        user.setEmail("updated@example.com");
        user.setMobile("9876543210");

        when(userService.adminUpdateUser(anyLong(), any())).thenReturn(user);

        String json = "{\"name\":\"Updated Name\", \"email\":\"updated@example.com\", \"mobile\":\"9876543210\"}";

        mockMvc.perform(put("/api/v1/admin/members/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Member updated successfully"))
                .andExpect(jsonPath("$.member.name").value("Updated Name"));
    }
}
