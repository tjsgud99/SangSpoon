package com.smhrd.sangspoon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WaterSupplyMonitoringSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(WaterSupplyMonitoringSystemApplication.class, args);
    }

}
