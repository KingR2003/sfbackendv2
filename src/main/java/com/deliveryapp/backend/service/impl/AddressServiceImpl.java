package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.Address;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.AddressRepository;
import com.deliveryapp.backend.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Override
    public Address addAddress(Address address) {
        if (address.getIsDefault() != null && address.getIsDefault()) {
            resetDefaultAddresses(address.getUserId());
        } else if (addressRepository.findByUserId(address.getUserId()).isEmpty()) {
            address.setIsDefault(true);
        }
        return addressRepository.save(address);
    }

    @Override
    public List<Address> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    @Override
    public Address getAddressById(Long id) {
        return addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + id));
    }

    @Override
    public Address updateAddress(Long id, Address addressDetails) {
        Address address = getAddressById(id);

        if (addressDetails.getIsDefault() != null && addressDetails.getIsDefault() && !address.getIsDefault()) {
            resetDefaultAddresses(address.getUserId());
        }

        address.setBuildingNo(addressDetails.getBuildingNo());
        address.setBuildingName(addressDetails.getBuildingName());
        address.setStreetNo(addressDetails.getStreetNo());
        address.setAreaName(addressDetails.getAreaName());
        address.setCity(addressDetails.getCity());
        address.setState(addressDetails.getState());
        address.setPincode(addressDetails.getPincode());
        address.setIsDefault(addressDetails.getIsDefault());
        address.setAddressType(addressDetails.getAddressType());

        return addressRepository.save(address);
    }

    @Override
    public void deleteAddress(Long id) {
        Address address = getAddressById(id);
        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public void setDefaultAddress(Long userId, Long addressId) {
        resetDefaultAddresses(userId);
        Address address = getAddressById(addressId);
        address.setIsDefault(true);
        addressRepository.save(address);
    }

    private void resetDefaultAddresses(Long userId) {
        List<Address> addresses = addressRepository.findByUserId(userId);
        for (Address addr : addresses) {
            if (addr.getIsDefault() != null && addr.getIsDefault()) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}
