package com.smhrd.sangspoon.site.entity;

import com.smhrd.sangspoon.member.entity.MemberEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "sites")
@Getter
@Setter
public class SiteEntity {

    @Id
    private String managementCode;

    private String siteName;
    private String contactNumber;
    private String manager; // 담당자 이름 -> DB 컬럼 'manager'
    private String tankType; // VARCHAR로 변경
    private double length; // 가로
    private double width; // 세로
    private double height; // 높이
    @Enumerated(EnumType.STRING)
    private Status status;

    @ManyToOne
    @JoinColumn(name = "member_id", nullable = true)
    private MemberEntity member;

    public enum Status {
        ACTIVE,        // 활성
        INACTIVE,      // 비활성
        MAINTENANCE    // 점검중
    }

    // 부피 계산 메서드
    public double calculateVolume() {
        if ("Circle".equals(tankType)) {
            // 원형 탱크: π * r² * h (r = width/2)
            double radius = width / 2;
            return Math.PI * radius * radius * height;
        } else if ("Square".equals(tankType)) {
            // 사각형 탱크: l * w * h
            return length * width * height;
        }
        return 0.0;
    }

    public boolean isCircle() {
        return "Circle".equals(tankType);
    }

    public boolean isSquare() {
        return "Square".equals(tankType);
    }
}
