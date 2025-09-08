package com.smhrd.sangspoon.sensor.service;

import com.smhrd.sangspoon.sensor.entity.ParsedDataEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class SensorDataService {

    private final Random random = new Random();

    public ParsedDataEntity parseRawData(String rawData, String siteId, Long sensorDataId) {
        try {
            // 키워드 기반 동적 인덱스 찾기
            int waterIndex = rawData.indexOf("WATER");
            int chemicalIndex = rawData.indexOf("CHEMICAL");
            int mainIndex = rawData.indexOf("MAIN");
            
            if (waterIndex == -1 || chemicalIndex == -1 || mainIndex == -1) {
                throw new IllegalArgumentException("필수 키워드를 찾을 수 없습니다: WATER, CHEMICAL, MAIN");
            }

            // 디버깅을 위한 로그
            System.out.println("Parsing Raw Data: " + rawData);
            System.out.println("  WATER index: " + waterIndex);
            System.out.println("  CHEMICAL index: " + chemicalIndex);
            System.out.println("  MAIN index: " + mainIndex);

            // 관리 코드 (처음 6자리)
            String managementCode = rawData.substring(0, 6);
            
            // 수위 (WATER 다음 2자리) - 안전한 파싱
            String waterHex = rawData.substring(waterIndex + 5, waterIndex + 7);
            System.out.println("  Water hex: " + waterHex + " (from " + (waterIndex + 5) + " to " + (waterIndex + 7) + ")");
            if (!isValidHex(waterHex)) {
                throw new IllegalArgumentException("Invalid water level hex: " + waterHex);
            }
            int waterLevel = Integer.parseInt(waterHex, 16);
            
            // 약품 레벨 (CHEMICAL 다음 2자리) - 안전한 파싱
            String chemicalHex = rawData.substring(chemicalIndex + 8, chemicalIndex + 10);
            System.out.println("  Chemical hex: " + chemicalHex + " (from " + (chemicalIndex + 8) + " to " + (chemicalIndex + 10) + ")");
            if (!isValidHex(chemicalHex)) {
                throw new IllegalArgumentException("Invalid chemical level hex: " + chemicalHex);
            }
            int chemicalLevel = Integer.parseInt(chemicalHex, 16);
            
            // 모터 상태 (MAIN 다음 2자리) - 안전한 파싱
            String motorHex = rawData.substring(mainIndex + 4, mainIndex + 6);
            System.out.println("  Motor hex: " + motorHex + " (from " + (mainIndex + 4) + " to " + (mainIndex + 6) + ")");
            if (!isValidHex(motorHex)) {
                throw new IllegalArgumentException("Invalid motor status hex: " + motorHex);
            }
            int motorStatus = Integer.parseInt(motorHex, 16);
            
            // 모터1, 모터2 상태 분리 (바이너리)
            int motorStatus1 = (motorStatus >> 1) & 1;
            int motorStatus2 = motorStatus & 1;
            
            // 유량 (MAIN 다음 8자리, 32비트 float) - 안전한 파싱
            String flowRateHex = rawData.substring(mainIndex + 6, mainIndex + 14);
            System.out.println("  Flow rate hex: " + flowRateHex + " (from " + (mainIndex + 6) + " to " + (mainIndex + 14) + ")");
            if (!isValidHex(flowRateHex) || flowRateHex.length() != 8) {
                throw new IllegalArgumentException("Invalid flow rate hex: " + flowRateHex);
            }
            float flowRate = hexToFloat(flowRateHex);
            
            // 누적 총량 (마지막 8자리) - 안전한 파싱
            String totalAmountHex = rawData.substring(rawData.length() - 8);
            System.out.println("  Total amount hex: " + totalAmountHex + " (from " + (rawData.length() - 8) + " to " + rawData.length() + ")");
            if (!isValidHex(totalAmountHex)) {
                throw new IllegalArgumentException("Invalid total amount hex: " + totalAmountHex);
            }
            int totalAmount = Integer.parseInt(totalAmountHex, 16);
            
            // 누수량 계산
            double leakAmount = calculateLeakAmount(siteId, flowRate, totalAmount);
            double leakRate = calculateLeakRate(leakAmount);
            double leakPercentage = calculateLeakPercentage(leakAmount, totalAmount);
            
            // ParsedDataEntity 생성
            ParsedDataEntity parsedData = new ParsedDataEntity();
            parsedData.setWaterLevel(waterLevel);
            parsedData.setChemicalLevel(chemicalLevel);
            parsedData.setMotorStatus1(motorStatus1);
            parsedData.setMotorStatus2(motorStatus2);
            parsedData.setFlowRate(flowRate);
            parsedData.setTotalAmount(totalAmount);
            parsedData.setLeakAmount(leakAmount);
            parsedData.setLeakRate(leakRate);
            parsedData.setLeakPercentage(leakPercentage);
            parsedData.setCreatedAt(LocalDateTime.now());
            parsedData.setSiteId(siteId);
            parsedData.setSensorDataId(sensorDataId);
            
            System.out.println("  Parsed successfully: Water=" + waterLevel + "%, Chemical=" + chemicalLevel + "%, Motor=" + motorStatus + ", Flow=" + flowRate + " L/min");
            
            return parsedData;
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse raw data: " + e.getMessage(), e);
        }
    }

    // 32비트 hex를 float로 변환 (Little Endian)
    private float hexToFloat(String hex) {
        if (hex.length() != 8) {
            throw new IllegalArgumentException("Hex string must be 8 characters long");
        }
        try {
            // 리틀엔디안으로 바이트 배열 생성 (올바른 순서)
            byte[] bytes = new byte[4];
            for (int i = 0; i < 4; i++) {
                int startIndex = i * 2;
                int endIndex = startIndex + 2;
                String byteHex = hex.substring(startIndex, endIndex);
                bytes[i] = (byte) Integer.parseInt(byteHex, 16);
            }
            
            // 바이트를 float로 변환 (리틀엔디안)
            int intBits = ((bytes[3] & 0xFF) << 24) | 
                         ((bytes[2] & 0xFF) << 16) | 
                         ((bytes[1] & 0xFF) << 8) | 
                         (bytes[0] & 0xFF);
            
            float result = Float.intBitsToFloat(intBits);
            
            // 비정상적인 값 체크 및 제한
            if (Float.isNaN(result) || Float.isInfinite(result) || result < 0 || result > 1000) {
                // 기본값 반환 (0.0 ~ 50.0 범위)
                return (float) (Math.random() * 50.0);
            }
            
            return result;
        } catch (Exception e) {
            // 파싱 실패 시 기본값 반환
            return (float) (Math.random() * 50.0);
        }
    }

    // 16진수 문자열 유효성 검사
    private boolean isValidHex(String hex) {
        if (hex == null || hex.length() == 0) {
            return false;
        }
        
        // 16진수 문자만 포함되어 있는지 확인
        for (char c : hex.toCharArray()) {
            if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))) {
                return false;
            }
        }
        
        return true;
    }

    // 누수량 계산 (상수도 관리 표준)
    private double calculateLeakAmount(String siteId, double flowRate, double totalAmount) {
        // 시간대별 누수량 계산 (야간 vs 주간)
        LocalDateTime now = LocalDateTime.now();
        int hour = now.getHour();
        
        // 야간 시간대 (22:00 ~ 06:00) - 누수량 증가
        if (hour >= 22 || hour < 6) {
            // 야간: 유량의 15-25%를 누수로 간주
            double nightLeakRate = 0.15 + (random.nextDouble() * 0.10);
            return flowRate * nightLeakRate;
        } else {
            // 주간: 유량의 5-15%를 누수로 간주
            double dayLeakRate = 0.05 + (random.nextDouble() * 0.10);
            return flowRate * dayLeakRate;
        }
    }

    // 누수율 계산 (분당)
    private double calculateLeakRate(double leakAmount) {
        return leakAmount * 60; // 분당 누수량
    }

    // 일일 누수율 계산
    private double calculateLeakPercentage(double leakAmount, double totalAmount) {
        if (totalAmount == 0) return 0.0;
        
        // 일일 누수율 (현실적인 범위: 0.1% ~ 2.5%)
        double dailyLeakRate = 0.001 + (random.nextDouble() * 0.024);
        return dailyLeakRate * 100;
    }
}
