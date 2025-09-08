package com.smhrd.sangspoon.site.controller;

import com.smhrd.sangspoon.service.PdfExportService;
import com.smhrd.sangspoon.site.entity.SiteEntity;
import com.smhrd.sangspoon.site.repository.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PdfController {

    @Autowired
    private PdfExportService pdfExportService;

    @Autowired
    private SiteRepository siteRepository;

    /**
     * 개별 현장 PDF 다운로드
     */
    @GetMapping("/api/pdf/site/{siteId}")
    public ResponseEntity<ByteArrayResource> downloadSitePdf(@PathVariable String siteId) {
        try {
            byte[] pdfBytes = pdfExportService.generateSitePdf(siteId);
            
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            
            HttpHeaders headers = new HttpHeaders();
                                    headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=site_" + siteId + "_report.pdf");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.TEXT_PLAIN)
                    .contentLength(pdfBytes.length)
                    .body(resource);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 전체 현장 목록 PDF 다운로드
     */
    @GetMapping("/api/pdf/all-sites")
    public ResponseEntity<ByteArrayResource> downloadAllSitesPdf() {
        try {
            List<SiteEntity> sites = siteRepository.findAll();
            byte[] pdfBytes = pdfExportService.generateAllSitesPdf(sites);
            
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            
            HttpHeaders headers = new HttpHeaders();
                                    headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=all_sites_report.pdf");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(resource);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
