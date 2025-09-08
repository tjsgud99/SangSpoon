package com.smhrd.sangspoon.web;

import com.smhrd.sangspoon.service.EmailAlertService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailAlertService emailService;

    public EmailController(EmailAlertService emailService) {
        this.emailService = emailService;
    }

    public static class EmailSendRequest {
        @NotBlank public String to;
        @NotBlank public String subject;
        public String html;
        public String text;
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody EmailSendRequest req) {
        try {
            emailService.sendGeneric(req.to, req.subject, req.html, req.text);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }
}
