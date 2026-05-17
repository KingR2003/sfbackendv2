package com.deliveryapp.backend.security;

import com.deliveryapp.backend.entity.AppModule;
import com.deliveryapp.backend.entity.ModulePermission;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.AppModuleRepository;
import com.deliveryapp.backend.repository.ModulePermissionRepository;
import com.deliveryapp.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class ModulePermissionInterceptor implements HandlerInterceptor {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppModuleRepository appModuleRepository;

    @Autowired
    private ModulePermissionRepository modulePermissionRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        // 1. Skip paths that don't need module permission checking
        if (requestURI.startsWith("/api/v1/admin/auth") || requestURI.startsWith("/api/v1/manage")) {
            return true;
        }

        // 2. Identify the logged-in user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Unauthenticated users will be caught by Spring Security anyway, but just in case
            return true;
        }

        String username = auth.getName(); // email or mobile
        
        // Let's resolve the user from DB to check exact role
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByMobile(username);
        }

        if (userOpt.isEmpty()) {
            return true;
        }

        User user = userOpt.get();

        // 3. Super Admin bypasses everything
        if ("SUPER ADMIN".equalsIgnoreCase(user.getRole())) {
            return true;
        }

        // 4. Determine the module from the URI
        String expectedModuleName = resolveModuleNameFromUri(requestURI);
        if (expectedModuleName == null) {
            // Not a mapped admin path or module doesn't exist, proceed by default
            return true;
        }

        // 5. Query for the permission
        Optional<AppModule> moduleOpt = appModuleRepository.findByModuleName(expectedModuleName);
        if (moduleOpt.isEmpty()) {
            return true; // If module isn't loaded in DB yet, fail open
        }
        
        Optional<ModulePermission> permissionOpt = modulePermissionRepository.findByUserIdAndModuleId(user.getId(), moduleOpt.get().getId());
        
        if (permissionOpt.isEmpty()) {
            return sendForbiddenResponse(response);
        }

        ModulePermission permission = permissionOpt.get();

        // 6. Check boolean access flag based on HTTP Method
        boolean hasAccess = false;
        switch (method.toUpperCase()) {
            case "GET":
                hasAccess = permission.isViewAccess();
                break;
            case "POST":
                hasAccess = permission.isCreateAccess();
                break;
            case "PUT":
            case "PATCH":
                hasAccess = permission.isUpdateAccess();
                break;
            case "DELETE":
                hasAccess = permission.isDeleteAccess();
                break;
            default:
                hasAccess = true; // allow OPTIONS, HEAD etc.
                break;
        }

        if (!hasAccess) {
            return sendForbiddenResponse(response);
        }

        return true;
    }

    private String resolveModuleNameFromUri(String uri) {
        if (uri.startsWith("/api/v1/admin/categories")) return "Categories";
        if (uri.startsWith("/api/v1/admin/products")) return "Products";
        if (uri.startsWith("/api/v1/admin/orders")) return "Orders";
        if (uri.startsWith("/api/v1/admin/coupons")) return "Coupons";
        if (uri.startsWith("/api/v1/admin/members")) return "Members";
        if (uri.startsWith("/api/v1/admin/users")) return "Users";
        if (uri.startsWith("/api/v1/admin/analytics")) return "Analytics";
        if (uri.startsWith("/api/v1/admin/banners")) return "Banners";
        if (uri.startsWith("/api/v1/admin/support") || uri.startsWith("/api/v1/admin/user-queries")) return "Support";
        return null;
    }

    private boolean sendForbiddenResponse(HttpServletResponse response) throws Exception {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\": 403, \"message\": \"Access restricted: You don't have access to this\"}");
        return false;
    }
}
