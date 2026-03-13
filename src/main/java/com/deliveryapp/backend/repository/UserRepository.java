package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    java.util.Optional<User> findByEmail(String email);

    java.util.Optional<User> findByMobile(String mobile);
}
