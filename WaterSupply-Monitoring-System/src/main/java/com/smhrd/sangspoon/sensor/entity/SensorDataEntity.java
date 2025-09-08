package com.smhrd.sangspoon.sensor.entity;

import com.smhrd.sangspoon.site.entity.SiteEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(name = "sensor_data")
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
public class SensorDataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime receivedAt;
    private String rawData; // 원본 프로토콜

    @ManyToOne
    @JoinColumn(name = "site_management_code", nullable = true)
    private SiteEntity site;
}
