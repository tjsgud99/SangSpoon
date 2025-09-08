package com.smhrd.sangspoon.service;

import com.smhrd.sangspoon.site.entity.SiteEntity;
import com.smhrd.sangspoon.sensor.entity.ParsedDataEntity;
import com.smhrd.sangspoon.sensor.repository.ParsedDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class PdfExportService {

    @Autowired
    private ParsedDataRepository parsedDataRepository;

    /**
     * 개별 현장 PDF 생성 (간단한 버전)
     */
    public byte[] generateSitePdf(String siteId) throws Exception {
        // 간단한 텍스트 기반 PDF 생성
        StringBuilder content = new StringBuilder();
        content.append("현장 상세 정보 보고서\n");
        content.append("========================\n\n");
        content.append("생성 시간: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
        content.append("현장 ID: ").append(siteId).append("\n\n");

        // 최신 센서 데이터
        try {
            Optional<ParsedDataEntity> latestData = parsedDataRepository.findTopBySiteIdOrderByCreatedAtDesc(siteId);
            if (latestData.isPresent()) {
                ParsedDataEntity data = latestData.get();
                content.append("현재 수위: ").append(data.getWaterLevel()).append("%\n");
                content.append("현재 약품 레벨: ").append(data.getChemicalLevel()).append("%\n");
                content.append("현재 유량: ").append(data.getFlowRate()).append(" L/min\n");
                content.append("데이터 수집 시간: ").append(data.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
            } else {
                content.append("센서 데이터가 없습니다.\n\n");
            }
        } catch (Exception e) {
            content.append("센서 데이터 조회 실패: ").append(e.getMessage()).append("\n\n");
        }

        return content.toString().getBytes("UTF-8");
    }

    /**
     * 전체 현장 목록 PDF 생성 (간단한 버전)
     */
    public byte[] generateAllSitesPdf(List<SiteEntity> sites) throws Exception {
        // 간단한 텍스트 기반 PDF 생성
        StringBuilder content = new StringBuilder();
        content.append("전체 현장 목록 보고서\n");
        content.append("=====================\n\n");
        content.append("생성 시간: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
        
        content.append("현장 목록\n");
        content.append("---------\n");
        content.append(String.format("%-15s %-20s %-10s\n", "현장 ID", "현장명", "상태"));
        content.append(String.format("%-15s %-20s %-10s\n", "--------", "--------", "----"));
        
        for (SiteEntity site : sites) {
            content.append(String.format("%-15s %-20s %-10s\n", 
                site.getManagementCode(), 
                site.getSiteName() != null ? site.getSiteName() : "N/A",
                getSiteStatusText(site.getStatus().toString())));
        }
        
        content.append("\n현장 통계\n");
        content.append("---------\n");
        long totalSites = sites.size();
        long activeSites = sites.stream().filter(site -> "ACTIVE".equals(site.getStatus().toString())).count();
        long warningSites = sites.stream().filter(site -> "WARNING".equals(site.getStatus().toString())).count();
        long maintenanceSites = sites.stream().filter(site -> "MAINTENANCE".equals(site.getStatus().toString())).count();
        
        content.append("전체 현장 수: ").append(totalSites).append("개\n");
        content.append("정상 현장: ").append(activeSites).append("개\n");
        content.append("경고 현장: ").append(warningSites).append("개\n");
        content.append("점검중 현장: ").append(maintenanceSites).append("개\n");

        return content.toString().getBytes("UTF-8");
    }

    /**
     * 현장 상태 텍스트 변환
     */
    private String getSiteStatusText(String status) {
        if (status == null) return "알 수 없음";
        return status;
    }
}
