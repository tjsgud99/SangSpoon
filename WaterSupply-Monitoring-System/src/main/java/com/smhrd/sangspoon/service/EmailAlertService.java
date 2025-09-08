package com.smhrd.sangspoon.service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

@Service
public class EmailAlertService {

    private final JavaMailSender mailSender;

    public EmailAlertService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // 보내는 주소는 인증계정과 동일해야 함
    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${alert.email.enabled:false}")
    private boolean emailEnabled;

    // 기본 수신자(프론트에서 to를 안보내면 fallback)
    @Value("${alert.email.recipients:}")
    private String defaultRecipients;

    @PostConstruct
    void init() {
        System.out.println("[EmailAlertService] from=" + fromAddress + ", enabled=" + emailEnabled);
    }

    /* ========= 공용 전송 ========== */
    public void sendGeneric(String to, String subject, String html, String text) throws Exception {
        if (!emailEnabled) return;

        String[] recipients = parseRecipients(
                (to == null || to.isBlank()) ? defaultRecipients : to
        );
        if (recipients.length == 0) {
            throw new IllegalArgumentException("수신자(to)가 비어있습니다.");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                message, MimeMessageHelper.MULTIPART_MODE_NO, StandardCharsets.UTF_8.name()
        );

        helper.setFrom(new InternetAddress(fromAddress, "상수도 모니터 알림", StandardCharsets.UTF_8.name()));
        helper.setTo(recipients);
        helper.setSubject(subject);

        boolean isHtml = html != null && !html.isBlank();
        String body = isHtml ? html : (text == null ? "" : text);
        helper.setText(body, isHtml);

        mailSender.send(message);
    }

    /* 큰 변화 알림  */
    public void sendLargeChangeAlert(String siteId,
                                     float waterLevelChange,
                                     float chemicalLevelChange,
                                     float flowRateChange,
                                     float newWaterLevel,
                                     float newChemicalLevel,
                                     float newFlowRate) {
        if (!emailEnabled) return;

        try {
            StringBuilder reasons = new StringBuilder();
            if (Math.abs(waterLevelChange) > 10) reasons.append("수위, ");
            if (Math.abs(chemicalLevelChange) > 10) reasons.append("약품, ");
            if (Math.abs(flowRateChange) > 10) reasons.append("유량, ");
            String alertReason = reasons.length() > 0
                    ? reasons.substring(0, reasons.length() - 2)
                    : "변화";

            String subject = "🚨 긴급 알림: 현장 " + siteId + " - " + alertReason + " 이상 감지";

            // HTML 본문
            String html = """
                <h2>현장 %s에서 <span style="color:#d00">%s</span> 이상이 감지되었습니다!</h2>
                <p><b>발생 시간:</b> %s</p>
                <p><b>현장 ID:</b> %s</p>
                <p><b>알림 사유:</b> %s</p>
                <h3>상세 변화량</h3>
                <pre style="font-size:14px">%s%s%s</pre>
                <p>즉시 확인이 필요합니다.</p>
                <p style="color:#888;font-size:12px">이 메일은 자동으로 발송되었습니다.</p>
            """.formatted(
                    siteId,
                    alertReason,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    siteId,
                    alertReason,
                    getChangeDescription("수위", waterLevelChange, newWaterLevel, "%", Math.abs(waterLevelChange) > 10),
                    getChangeDescription("약품", chemicalLevelChange, newChemicalLevel, "%", Math.abs(chemicalLevelChange) > 10),
                    getChangeDescription("유량", flowRateChange, newFlowRate, "L/min", Math.abs(flowRateChange) > 10)
            );

            sendGeneric(defaultRecipients, subject, html, null);
            System.out.println("🚨 이메일 알림 전송 완료: " + defaultRecipients + " (원인: " + alertReason + ")");
        } catch (Exception e) {
            System.err.println("이메일 알림 전송 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getChangeDescription(String sensorName, float change, float current, String unit, boolean isAlert) {
        String flag = isAlert ? "← 큰 변화 감지!" : "";
        return "%s: %.1f%s (현재: %.1f%s) %s%n".formatted(sensorName, change, unit, current, unit, flag);
    }

    private String[] parseRecipients(String s) {
        if (s == null) return new String[0];
        return Arrays.stream(s.split("[,;]"))
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .toArray(String[]::new);
    }
}
