package com.smhrd.sangspoon.sensor.repository;

import com.smhrd.sangspoon.sensor.entity.ParsedDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParsedDataRepository extends JpaRepository<ParsedDataEntity, Long> {
    
    // 특정 현장의 센서 데이터를 생성 시간 역순으로 조회
    List<ParsedDataEntity> findBySiteIdOrderByCreatedAtDesc(String siteId);
    
    // 특정 현장의 최신 센서 데이터 조회
    ParsedDataEntity findFirstBySiteIdOrderByCreatedAtDesc(String siteId);
    
    // 모든 센서 데이터를 생성 시간 역순으로 조회
    List<ParsedDataEntity> findAllByOrderByCreatedAtDesc();
    
    // 🎯 데이터 중복 체크를 위한 메서드 - 특정 시간 범위 내에 데이터가 있는지 확인
    boolean existsBySiteIdAndCreatedAtBetween(String siteId, LocalDateTime startTime, LocalDateTime endTime);
    
    // PDF 생성을 위한 메서드들
    Optional<ParsedDataEntity> findTopBySiteIdOrderByCreatedAtDesc(String siteId);
    
    List<ParsedDataEntity> findBySiteIdAndCreatedAtAfterOrderByCreatedAtDesc(String siteId, LocalDateTime after);
}
