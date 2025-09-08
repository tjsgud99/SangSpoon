package com.smhrd.sangspoon.sensor.repository;

import com.smhrd.sangspoon.sensor.entity.SensorDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorDataEntity, Long> {
    // 기본 CRUD 메서드는 JpaRepository에서 제공
}
