package com.smhrd.sangspoon.member.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name="member")
public class MemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;           // 이름
    
    @Column(nullable = false, unique = true)
    private String loginId;        // 아이디
    
    @Column(nullable = false, unique = true)
    private String email;          // 이메일
    
    @Column(nullable = false)
    private String phoneNumber;    // 전화번호
    
    @Column(nullable = false)
    private String password;       // 비밀번호
}

