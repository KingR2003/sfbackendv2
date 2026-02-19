package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ProductRequest;
import com.deliveryapp.backend.dto.ProductResponse;
import com.deliveryapp.backend.entity.Category;
import com.deliveryapp.backend.service.CategoryService;
import com.deliveryapp.backend.service.ProductService;
import com.deliveryapp.backend.security.CustomUserDetailsService;
import com.deliveryapp.backend.security.JwtAuthenticationEntryPoint;
import com.deliveryapp.backend.security.JwtAuthenticationFilter;
import com.deliveryapp.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = { CategoryController.class, ProductController.class })
@AutoConfigureMockMvc(addFilters = false)
public class ResponseStructureTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private ProductService productService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private DataSource dataSource;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testCreateCategory_ShouldReturnStatusAndMessage_NoData_NoSuccess() throws Exception {
        Category category = new Category();
        category.setId(1L);
        category.setName("Test");

        given(categoryService.createCategory(any(Category.class))).willReturn(category);

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.success").doesNotExist());
    }

    @Test
    public void testGetCategory_ShouldReturnStatusMessageData_NoSuccess() throws Exception {
        Category category = new Category();
        category.setId(1L);

        given(categoryService.getCategoryById(1L)).willReturn(Optional.of(category));

        mockMvc.perform(get("/api/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.success").doesNotExist());
    }

    @Test
    public void testCreateProduct_ShouldReturnStatusMessage_NoSuccess_NoData() throws Exception {
        ProductResponse response = new ProductResponse();
        response.setId(1L);

        given(productService.createProduct(any(ProductRequest.class))).willReturn(response);

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.success").doesNotExist())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    public void testGetProduct_ShouldReturnStatusMessageData_NoSuccess() throws Exception {
        ProductResponse response = new ProductResponse();
        response.setId(1L);

        given(productService.getProductById(1L)).willReturn(Optional.of(response));

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.success").doesNotExist());
    }
}
