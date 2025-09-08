package com.smhrd.sangspoon.member.controller;

import com.smhrd.sangspoon.member.entity.MemberEntity;
import com.smhrd.sangspoon.member.service.MemberService;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
public class MemberApiController {

    @Autowired
    private MemberService memberService;

    // 회원가입 API
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> requestData) {
        Map<String, Object> response = new HashMap<>();
        
        // 요청 로그는 필요 시 로거를 사용하세요
        
        try {
            // Map에서 MemberEntity로 변환
            MemberEntity member = new MemberEntity();
            member.setName(requestData.get("name"));
            member.setLoginId(requestData.get("loginId"));
            member.setEmail(requestData.get("email"));
            member.setPhoneNumber(requestData.get("phoneNumber"));
            member.setPassword(requestData.get("password"));
            
            // 디버그 로그는 로거 사용 권장
            
            memberService.registerMember(member);
            response.put("success", true);
            response.put("message", "회원가입이 완료되었습니다.");
            // 디버그 로그는 로거 사용 권장
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            // 내부 에러 상세는 로깅으로만 남기고 응답은 간략화
            response.put("success", false);
            response.put("message", "서버 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }

    // 로그인 API
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest,
                                                     HttpSession session,
                                                     HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        String loginId = loginRequest.get("loginId");
        String password = loginRequest.get("password");
        
        MemberEntity member = memberService.login(loginId, password);
        
        if (member != null) {
            // 항상 새 세션을 발급하여 이전 로그인 상태와 혼동 방지
            try { session.invalidate(); } catch (IllegalStateException ignore) {}
            HttpSession newSession = request.getSession(true);
            newSession.setAttribute("loginMember", member);
            response.put("success", true);
            response.put("message", "로그인 성공");
            response.put("member", member);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "아이디 혹은 비밀번호가 잘못되었습니다.");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 로그아웃 API
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        
        session.removeAttribute("loginMember");
        response.put("success", true);
        response.put("message", "로그아웃 되었습니다.");
        
        return ResponseEntity.ok(response);
    }

    // 현재 로그인 사용자 정보 조회 API
    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentUser(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        
        MemberEntity loginMember = (MemberEntity) session.getAttribute("loginMember");
        
        if (loginMember != null) {
            response.put("success", true);
            response.put("member", loginMember);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(401).body(response);
        }
    }
}