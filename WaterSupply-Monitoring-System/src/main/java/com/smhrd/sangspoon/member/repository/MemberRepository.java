package com.smhrd.sangspoon.member.repository;

import com.smhrd.sangspoon.member.entity.MemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<MemberEntity, Long> {

    // 아이디 일치 확인
    MemberEntity findByLoginId(String loginId);

    // 이메일 중복 체크
    MemberEntity findByEmail(String email);
    
    // 전화번호 중복 체크
    MemberEntity findByPhoneNumber(String phoneNumber);
}
