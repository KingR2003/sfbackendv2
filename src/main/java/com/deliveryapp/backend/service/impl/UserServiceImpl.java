package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User updateUser(Long id, User user) {
        if (userRepository.existsById(id)) {
            user.setId(id);
            return userRepository.save(user);
        }
        return null;
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public User updateProfile(String identifier, com.deliveryapp.backend.dto.UpdateProfileRequest request) {
        // Try finding by mobile (primary for customers) then by email
        User user = userRepository.findByMobile(identifier)
                .orElseGet(() -> userRepository.findByEmail(identifier)
                        .orElseThrow(() -> new RuntimeException("User not found with identifier: " + identifier)));

        // Check uniqueness if email is changing
        if (request.getEmail() != null && !request.getEmail().isBlank() && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already in use by another user");
            }
            user.setEmail(request.getEmail());
        }

        // Check uniqueness if mobile is changing
        if (request.getMobile() != null && !request.getMobile().isBlank() && !request.getMobile().equals(user.getMobile())) {
            if (userRepository.findByMobile(request.getMobile()).isPresent()) {
                throw new RuntimeException("Mobile number already in use by another user");
            }
            user.setMobile(request.getMobile());
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }

        if (request.getGender() != null && !request.getGender().isBlank()) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        user.setUpdatedAt(java.time.LocalDateTime.now());

        return userRepository.save(user);
    }

    @Override
    public User adminUpdateUser(Long id, com.deliveryapp.backend.dto.AdminUserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Uniqueness check for email
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already in use by another user");
            }
            user.setEmail(request.getEmail());
        }

        // Uniqueness check for mobile
        if (request.getMobile() != null && !request.getMobile().equals(user.getMobile())) {
            if (userRepository.findByMobile(request.getMobile()).isPresent()) {
                throw new RuntimeException("Mobile number already in use by another user");
            }
            user.setMobile(request.getMobile());
        }

        user.setName(request.getName());
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole().toUpperCase());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus().toUpperCase());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        user.setUpdatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    public Optional<User> getUserByIdentifier(String identifier) {
        return userRepository.findByMobile(identifier)
                .or(() -> userRepository.findByEmail(identifier));
    }

    @Override
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setStatus("ACTIVE");
        user.setActive(true);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    public User deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setStatus("INACTIVE");
        user.setActive(false);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }
}
