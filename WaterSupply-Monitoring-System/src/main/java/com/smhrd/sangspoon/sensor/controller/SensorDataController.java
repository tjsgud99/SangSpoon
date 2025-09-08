package com.smhrd.sangspoon.sensor.controller;

import com.smhrd.sangspoon.sensor.entity.ParsedDataEntity;
import com.smhrd.sangspoon.sensor.repository.ParsedDataRepository;
import com.smhrd.sangspoon.sensor.service.SensorDataScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sensor")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "false")
public class SensorDataController {

    @Autowired
    private SensorDataScheduler sensorDataScheduler;
    
    @Autowired
    private ParsedDataRepository parsedDataRepository;

    // 스케줄러 시작
    @PostMapping("/scheduler/start")
    public ResponseEntity<Map<String, String>> startScheduler() {
        sensorDataScheduler.start();
        return ResponseEntity.ok(Map.of("message", "센서 데이터 생성이 시작되었습니다."));
    }

    // 스케줄러 중지
    @PostMapping("/scheduler/stop")
    public ResponseEntity<Map<String, String>> stopScheduler() {
        sensorDataScheduler.stop();
        return ResponseEntity.ok(Map.of("message", "센서 데이터 생성이 중지되었습니다."));
    }

    // 스케줄러 상태 확인
    @GetMapping("/scheduler/status")
    public ResponseEntity<Map<String, Object>> getSchedulerStatus() {
        boolean isRunning = sensorDataScheduler.isRunning();
        return ResponseEntity.ok(Map.of(
            "isRunning", isRunning,
            "status", isRunning ? "실행 중" : "중지됨"
        ));
    }

    // 모든 센서 데이터 조회
    @GetMapping("/data")
    public ResponseEntity<List<ParsedDataEntity>> getAllSensorData() {
        List<ParsedDataEntity> data = parsedDataRepository.findAllByOrderByCreatedAtDesc();
        System.out.println("=== 센서 데이터 조회 로그 ===");
        System.out.println("전체 데이터 수: " + data.size());
        if (data.size() > 0) {
            System.out.println("최신 데이터 시간: " + data.get(0).getCreatedAt());
            System.out.println("가장 오래된 데이터 시간: " + data.get(data.size() - 1).getCreatedAt());
        }
        System.out.println("==========================");
        return ResponseEntity.ok(data);
    }

    // 특정 현장의 센서 데이터 조회
    @GetMapping("/data/{siteId}")
    public ResponseEntity<List<ParsedDataEntity>> getSensorDataBySite(@PathVariable String siteId) {
        List<ParsedDataEntity> data = parsedDataRepository.findBySiteIdOrderByCreatedAtDesc(siteId);
        return ResponseEntity.ok(data);
    }

    // 특정 현장의 최신 센서 데이터 조회
    @GetMapping("/data/{siteId}/latest")
    public ResponseEntity<ParsedDataEntity> getLatestSensorDataBySite(@PathVariable String siteId) {
        ParsedDataEntity data = parsedDataRepository.findFirstBySiteIdOrderByCreatedAtDesc(siteId);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(data);
    }
}
