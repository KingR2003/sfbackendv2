package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.Address;
import java.util.List;

public interface AddressService {
    Address addAddress(Address address);

    List<Address> getAddressesByUserId(Long userId);

    Address getAddressById(Long id);

    Address updateAddress(Long id, Address addressDetails);

    void deleteAddress(Long id);

    void setDefaultAddress(Long userId, Long addressId);
}
