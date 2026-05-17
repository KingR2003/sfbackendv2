package com.deliveryapp.backend.config;

import com.deliveryapp.backend.security.ModulePermissionInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private ModulePermissionInterceptor modulePermissionInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Intercept all admin endpoints
        registry.addInterceptor(modulePermissionInterceptor)
                .addPathPatterns("/api/v1/admin/**");
    }
}
