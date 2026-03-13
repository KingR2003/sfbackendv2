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

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        user.setUpdatedAt(java.time.LocalDateTime.now());

        return userRepository.save(user);
    }

    @Override
    public Optional<User> getUserByIdentifier(String identifier) {
        return userRepository.findByMobile(identifier)
                .or(() -> userRepository.findByEmail(identifier));
    }
}
