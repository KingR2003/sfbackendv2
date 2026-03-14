package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    User createUser(User user);

    Optional<User> getUserById(Long id);

    List<User> getAllUsers();

    User updateUser(Long id, User user);

    void deleteUser(Long id);

    User updateProfile(String identifier, com.deliveryapp.backend.dto.UpdateProfileRequest request);

    User adminUpdateUser(Long id, com.deliveryapp.backend.dto.AdminUserUpdateRequest request);

    Optional<User> getUserByIdentifier(String identifier);
    
    User activateUser(Long id);
    
    User deactivateUser(Long id);

    List<User> getAllCustomers();

    User updateUserStatus(Long id, String status);
}
