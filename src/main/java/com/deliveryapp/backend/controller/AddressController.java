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

    @PostMapping
    public ResponseEntity<Object> addAddress(@RequestBody Address address) {
        // Assuming your setup allows looking up user by identifier (email/mobile)
        // For now, if address.userId is not set, we might need a lookup service.
        // Let's assume the client sends the userId for now OR we inject it if we have
        // User object.
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
