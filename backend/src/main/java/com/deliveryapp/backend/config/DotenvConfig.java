package com.deliveryapp.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.File;

@Configuration
public class DotenvConfig {

    @PostConstruct
    public void init() {
        // Look for .env in the root project directory (one level up from 'backend')
        // or in the current working directory.
        Dotenv dotenv = null;
        
        File rootDotEnv = new File("../.env");
        File currentDotEnv = new File(".env");

        if (rootDotEnv.exists()) {
            dotenv = Dotenv.configure().directory("../").load();
        } else if (currentDotEnv.exists()) {
            dotenv = Dotenv.configure().directory("./").load();
        }

        if (dotenv != null) {
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        }
    }
}
