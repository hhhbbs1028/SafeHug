package com.capstone.SafeHug.controller.login;

import com.capstone.SafeHug.dto.response.ApiResponse;
import com.capstone.SafeHug.dto.response.KakaoUserInfoResponseDto;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.service.JwtService;
import com.capstone.SafeHug.service.UserService;
import com.capstone.SafeHug.service.login.KakaoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping()
public class KakaoLoginController {

    private final KakaoService kakaoService;
    private final UserService userService;
    private final JwtService jwtService;

    @GetMapping("/login/kakao")
    public ResponseEntity<String> getKakaoLoginUrl() {
        String kakaoLoginUrl = kakaoService.getKakaoLogin();
        return ResponseEntity.ok(kakaoLoginUrl);
    }

    @GetMapping("/kakao/callback")
    public ResponseEntity<?> kakaoCallback(@RequestParam String code) {
        log.info("=== Kakao Login Callback Started ===");
        log.info("Received code: {}", code);
        
        try {
            // 1. 인증 코드로 액세스 토큰 요청
            String kakaoAccessToken = kakaoService.getAccessTokenFromKakao(code);
            log.info("Access Token received successfully");

            // 2. 액세스 토큰으로 사용자 정보 요청
            KakaoUserInfoResponseDto userInfo = kakaoService.getUserInfo(kakaoAccessToken);
            log.info("User Info received for ID: {}", userInfo.getId());

            // 3. 사용자 정보를 기반으로 회원가입/로그인 처리
            User user = userService.processKakaoUser(userInfo);
            log.info("User processed successfully - ID: {}, Email: {}", user.getId(), user.getEmail());

            // 4. JWT 토큰 발급
            String accessToken = jwtService.generateToken(user.getEmail(), user.getId());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());
            log.info("JWT Tokens generated successfully");

            // 5. 프론트엔드로 리다이렉트
            String redirectUrl = "http://localhost:3000/login/callback" +
                "?accessToken=" + accessToken +
                "&refreshToken=" + refreshToken +
                "&userId=" + user.getId() +
                "&userName=" + user.getName() +
                "&userEmail=" + user.getEmail() +
                "&socialType=" + user.getSocialType();

            return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", redirectUrl)
                .build();

        } catch (Exception e) {
            log.error("=== Kakao Login Callback Failed ===");
            String errorRedirectUrl = "http://localhost:3000/login/error?message=" + e.getMessage();
            return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", errorRedirectUrl)
                .build();
        }
    }
}