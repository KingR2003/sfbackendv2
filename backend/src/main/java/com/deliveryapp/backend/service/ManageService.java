package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.ManagePermissionsRequest;
import com.deliveryapp.backend.dto.ManageRoleRequest;
import com.deliveryapp.backend.dto.PermissionDto;
import com.deliveryapp.backend.entity.AppModule;
import com.deliveryapp.backend.entity.ModulePermission;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.AppModuleRepository;
import com.deliveryapp.backend.repository.ModulePermissionRepository;
import com.deliveryapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManageService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppModuleRepository appModuleRepository;

    @Autowired
    private ModulePermissionRepository modulePermissionRepository;

    private static final List<String> ADMIN_ROLES = Arrays.asList("ADMIN", "MANAGER", "STAFF", "INVENTORY", "SUPER ADMIN");
    private static final List<String> ASSIGNABLE_ROLES = Arrays.asList("ADMIN", "MANAGER", "STAFF", "INVENTORY");

    public List<User> getAdminMembers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && ADMIN_ROLES.contains(user.getRole().toUpperCase()))
                .collect(Collectors.toList());
    }

    @Transactional
    public User updateMemberRole(Long userId, ManageRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == null || !ADMIN_ROLES.contains(user.getRole().toUpperCase())) {
            throw new IllegalArgumentException("User is not a staff member/admin");
        }
        
        if ("SUPER ADMIN".equalsIgnoreCase(user.getRole()) && !"SUPER ADMIN".equalsIgnoreCase(request.getRole())) {
            throw new IllegalArgumentException("Cannot change the role of a SUPER ADMIN");
        }

        String newRole = request.getRole().toUpperCase();
        if (!ASSIGNABLE_ROLES.contains(newRole)) {
            throw new IllegalArgumentException("Invalid role. Valid roles: " + ASSIGNABLE_ROLES);
        }

        user.setRole(newRole);
        return userRepository.save(user);
    }

    public List<PermissionDto> getMemberPermissions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<AppModule> allModules = appModuleRepository.findAll();
        List<ModulePermission> userPermissions = modulePermissionRepository.findByUserId(userId);

        List<PermissionDto> responseList = new ArrayList<>();
        
        for (AppModule module : allModules) {
            if (!module.isActive()) continue;
            
            ModulePermission permission = userPermissions.stream()
                    .filter(p -> p.getModule().getId().equals(module.getId()))
                    .findFirst()
                    .orElse(null);

            if (permission != null) {
                responseList.add(new PermissionDto(
                        module.getId(),
                        module.getModuleName(),
                        permission.isViewAccess(),
                        permission.isCreateAccess(),
                        permission.isUpdateAccess(),
                        permission.isDeleteAccess()
                ));
            } else {
                responseList.add(new PermissionDto(
                        module.getId(),
                        module.getModuleName(),
                        false,
                        false,
                        false,
                        false
                ));
            }
        }
        return responseList;
    }

    @Transactional
    public List<PermissionDto> updateMemberPermissions(Long userId, ManagePermissionsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        for (PermissionDto permDto : request.getPermissions()) {
            AppModule module = appModuleRepository.findById(permDto.getModuleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + permDto.getModuleId()));

            ModulePermission permission = modulePermissionRepository.findByUserIdAndModuleId(userId, module.getId())
                    .orElseGet(() -> {
                        ModulePermission newPerm = new ModulePermission();
                        newPerm.setUser(user);
                        newPerm.setModule(module);
                        return newPerm;
                    });

            permission.setViewAccess(permDto.isViewAccess());
            permission.setCreateAccess(permDto.isCreateAccess());
            permission.setUpdateAccess(permDto.isUpdateAccess());
            permission.setDeleteAccess(permDto.isDeleteAccess());

            modulePermissionRepository.save(permission);
        }

        return getMemberPermissions(userId);
    }
}
