package com.capstone.SafeHug.controller.login;

import com.capstone.SafeHug.dto.response.NaverUserInfoResponseDto;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.service.JwtService;
import com.capstone.SafeHug.service.UserService;
import com.capstone.SafeHug.service.login.NaverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping()
public class NaverLoginController {

    private final NaverService naverService;
    private final UserService userService;
    private final JwtService jwtService;

    @GetMapping("/login/naver")
    public ResponseEntity<String> getNaverLoginUrl() {
        String naverLoginUrl = naverService.getNaverLogin();
        return ResponseEntity.ok(naverLoginUrl);
    }

    @GetMapping("/naver/callback")
    public ResponseEntity<Map<String, Object>> callback(@RequestParam("code") String code) {
        log.info("Naver Login Callback - code: {}", code);

        try {
            // 1. 인증 코드로 액세스 토큰 요청
            String naverAccessToken = naverService.getAccessTokenFromNaver(code);
            log.info("Access Token received: {}", naverAccessToken);

            // 2. 액세스 토큰으로 사용자 정보 요청
            NaverUserInfoResponseDto userInfo = naverService.getUserInfo(naverAccessToken);
            log.info("User Info received: {}", userInfo);

            // 3. 사용자 정보를 기반으로 회원가입/로그인 처리
            User user = userService.processNaverUser(userInfo);
            log.info("User processed: {}", user);

            // 4. JWT 토큰 발급
            String accessToken = jwtService.generateToken(user.getEmail(), user.getId());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());
            log.info("JWT Tokens generated for user: {}", user.getEmail());

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
            log.error("Naver login failed", e);
            String errorRedirectUrl = "http://localhost:3000/login/error?message=" + e.getMessage();
            return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", errorRedirectUrl)
                .build();
        }
    }
}
