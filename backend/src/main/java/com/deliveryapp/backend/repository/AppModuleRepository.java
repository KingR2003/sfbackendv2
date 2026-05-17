package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.AppModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppModuleRepository extends JpaRepository<AppModule, Long> {
    Optional<AppModule> findByModuleName(String moduleName);
}
