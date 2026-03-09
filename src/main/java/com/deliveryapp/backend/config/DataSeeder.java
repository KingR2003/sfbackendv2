package com.deliveryapp.backend.config;

import com.deliveryapp.backend.entity.Banner;
import com.deliveryapp.backend.repository.BannerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final BannerRepository bannerRepository;

    public DataSeeder(BannerRepository bannerRepository) {
        this.bannerRepository = bannerRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (bannerRepository.count() == 0) {
            Banner b1 = new Banner();
            b1.setTitle("Summer Sale");
            b1.setDescription("Up to 50% off on all items");
            b1.setImageUrl("https://example.com/banners/summer.jpg");
            b1.setPriority(1);
            b1.setIsActive(true);
            b1.setStartDate(LocalDateTime.now());
            b1.setEndDate(LocalDateTime.now().plusMonths(1));

            Banner b2 = new Banner();
            b2.setTitle("Free Delivery");
            b2.setDescription("On orders over $30");
            b2.setImageUrl("https://example.com/banners/free-delivery.jpg");
            b2.setPriority(2);
            b2.setIsActive(true);
            b2.setStartDate(LocalDateTime.now());
            b2.setEndDate(LocalDateTime.now().plusMonths(2));

            bannerRepository.saveAll(List.of(b1, b2));
            System.out.println("Banner data initialized by DataSeeder");
        }
    }
}
