package com.deliveryapp.backend.config;

import com.deliveryapp.backend.entity.AppModule;
import com.deliveryapp.backend.repository.AppModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class ModuleSeeder implements CommandLineRunner {

    @Autowired
    private AppModuleRepository appModuleRepository;

    @Override
    public void run(String... args) throws Exception {
        List<String> modules = Arrays.asList(
                "Categories",
                "Products",
                "Orders",
                "Coupons",
                "Payments",
                "Members",
                "Users",
                "Analytics",
                "Banners",
                "Support"
        );

        for (String moduleName : modules) {
            appModuleRepository.findByModuleName(moduleName).orElseGet(() -> {
                AppModule newModule = new AppModule();
                newModule.setModuleName(moduleName);
                newModule.setDescription("Module for " + moduleName);
                newModule.setActive(true);
                return appModuleRepository.save(newModule);
            });
        }
    }
}
