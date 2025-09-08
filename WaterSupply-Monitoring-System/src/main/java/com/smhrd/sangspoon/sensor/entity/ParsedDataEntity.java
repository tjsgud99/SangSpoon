package com.smhrd.sangspoon.sensor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(name = "parsed_data")
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
public class ParsedDataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "water_level")
    private double waterLevel;
    
    @Column(name = "chemical_level")
    private double chemicalLevel;
    
    @Column(name = "motor_status1")
    private int motorStatus1;
    
    @Column(name = "motor_status2")
    private int motorStatus2;
    
    @Column(name = "flow_rate")
    private double flowRate;
    
    @Column(name = "total_amount")
    private double totalAmount;
    
    // 누수량 관련 필드들
    @Column(name = "leak_amount")
    private double leakAmount;
    
    @Column(name = "leak_rate")
    private double leakRate;
    
    @Column(name = "leak_percentage")
    private double leakPercentage;
    
    // 생성 시간 및 현장 ID
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "site_id")
    private String siteId;
    
    // sensor_data와의 관계 (DB 테이블 구조와 일치)
    @Column(name = "sensor_data_id")
    private Long sensorDataId;
}
