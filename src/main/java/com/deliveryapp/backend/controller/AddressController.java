package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.Address;
import com.deliveryapp.backend.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/addresses")
public class AddressController {

    @Autowired
    private AddressService addressService;

    @Autowired
    private com.deliveryapp.backend.repository.UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Object> addAddress(@RequestBody Address address) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String username = auth.getName();
            com.deliveryapp.backend.entity.User user = userRepository.findByEmail(username)
                    .orElseGet(() -> userRepository.findByMobile(username).orElse(null));
            if (user != null) {
                address.setUserId(user.getId());
            }
        }
        
        Address created = addressService.addAddress(address);
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.CREATED.value());
        response.put("message", "Address added successfully");
        response.put("address", created);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Object> getAddressesByUserId(@PathVariable Long userId) {
        List<Address> addresses = addressService.getAddressesByUserId(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Addresses retrieved successfully");
        response.put("addresses", addresses);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getAddressById(@PathVariable Long id) {
        Address address = addressService.getAddressById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Address found");
        response.put("address", address);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateAddress(@PathVariable Long id, @RequestBody Address addressDetails) {
        Address updated = addressService.updateAddress(id, addressDetails);
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Address updated successfully");
        response.put("address", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Address deleted successfully"));
    }

    @PostMapping("/{id}/default")
    public ResponseEntity<ApiResponse> setDefaultAddress(@PathVariable Long id, @RequestParam Long userId) {
        addressService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Default address set successfully"));
    }
}
