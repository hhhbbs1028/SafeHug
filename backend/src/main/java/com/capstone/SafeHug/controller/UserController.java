package com.capstone.SafeHug.controller;

import com.capstone.SafeHug.dto.request.UserRequestDTO;
import com.capstone.SafeHug.dto.response.ApiResponse;
import com.capstone.SafeHug.dto.response.ResetPasswordEmailResponse;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.service.JwtService;
import com.capstone.SafeHug.service.TokenBlacklistService;
import com.capstone.SafeHug.service.UserService;
import com.capstone.SafeHug.service.EmailService;
import com.capstone.SafeHug.service.PasswordResetTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import io.jsonwebtoken.Claims;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final PasswordResetTokenService passwordResetTokenService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@RequestBody UserRequestDTO dto) {
        try {
            User user = userService.signup(dto);
            return ResponseEntity.ok(ApiResponse.success("회원가입이 완료되었습니다.", null));
        } catch (Exception e) {
            log.error("회원가입 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("회원가입에 실패했습니다.", "SIGNUP_FAILED", List.of(e.getMessage())));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody UserRequestDTO dto) {
        try {
            // 1. 사용자 인증
            User user = userService.login(dto.getEmail(), dto.getPassword());
            log.info("User authenticated: {}", user.getEmail());

            // 2. JWT 토큰 발급
            String accessToken = jwtService.generateToken(user.getEmail(), user.getId());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());
            log.info("JWT Tokens generated for user: {}", user.getEmail());

            // 3. 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("token", accessToken);
            response.put("refreshToken", refreshToken);
            response.put("user", user);

            return ResponseEntity.ok(ApiResponse.success("로그인 성공", response));
        } catch (Exception e) {
            log.error("로그인 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("로그인에 실패했습니다.", "LOGIN_FAILED", List.of(e.getMessage())));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            // JWT 토큰에서 사용자 ID 추출
            String token = authHeader.substring(7); // "Bearer " 제거
            Long userId = jwtService.extractUserId(token);

            // 사용자 정보 조회
            User user = userService.findById(userId);

            // 응답 생성
            Map<String, Object> response = new HashMap<>();
            response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "socialType", user.getSocialType()
            ));

            return ResponseEntity.ok(ApiResponse.success("사용자 정보 조회 성공", response));
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("사용자 정보 조회에 실패했습니다.", "USER_INFO_FAILED", List.of(e.getMessage())));
        }
    }

    @PostMapping("/email-exists")
    public ResponseEntity<ApiResponse<Boolean>> existsEmail(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            Optional<User> user = userService.findByEmail(email);
            // 이메일이 존재하면 false (사용 불가), 존재하지 않으면 true (사용 가능)
            return ResponseEntity.ok(ApiResponse.success("이메일 중복 확인이 완료되었습니다.", user.isEmpty()));
        } catch (Exception e) {
            log.error("이메일 중복 체크 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("이메일 중복 확인에 실패했습니다.", "EMAIL_CHECK_FAILED", List.of(e.getMessage())));
        }
    }

    @PostMapping("/find-password")
    public ResponseEntity<ApiResponse<Void>> findPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            Optional<User> user = userService.findByEmail(email);
            
            if (user.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success("이메일이 전송되었습니다.", null));
            }

            // 비밀번호 재설정 토큰 생성
            String resetToken = passwordResetTokenService.generateToken(email);
            
            // 이메일 전송
            emailService.sendPasswordResetEmail(email, resetToken);
            
            return ResponseEntity.ok(ApiResponse.success("이메일이 전송되었습니다.", null));
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 전송 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("비밀번호 재설정 이메일 전송에 실패했습니다.", "EMAIL_SEND_FAILED", List.of(e.getMessage())));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");
            String newPassword = body.get("newPassword");

            if (!passwordResetTokenService.validateToken(token)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("유효하지 않거나 만료된 토큰입니다.", "INVALID_TOKEN", null));
            }

            String email = passwordResetTokenService.getEmailFromToken(token);
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 비밀번호 업데이트
            userService.updatePassword(user.getId(), newPassword);
            
            // 사용된 토큰 제거
            passwordResetTokenService.removeToken(token);

            return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 변경되었습니다.", null));
        } catch (Exception e) {
            log.error("비밀번호 재설정 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("비밀번호 재설정에 실패했습니다.", "PASSWORD_RESET_FAILED", List.of(e.getMessage())));
        }
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            // JWT 토큰에서 사용자 ID 추출
            String token = authHeader.substring(7); // "Bearer " 제거
            Long userId = jwtService.extractUserId(token);

            // 요청 본문에서 비밀번호 추출
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("현재 비밀번호와 새 비밀번호를 모두 입력해주세요.", "INVALID_REQUEST", null));
            }

            // 비밀번호 변경
            userService.changePassword(userId, currentPassword, newPassword);
            
            return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 변경되었습니다.", null));
        } catch (Exception e) {
            log.error("비밀번호 변경 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("비밀번호 변경에 실패했습니다.", "PASSWORD_CHANGE_FAILED", List.of(e.getMessage())));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // "Bearer " 제거
            Claims claims = jwtService.validateToken(token);
            long expirationTime = claims.getExpiration().getTime();
            
            // 토큰을 블랙리스트에 추가
            tokenBlacklistService.blacklistToken(token, expirationTime);
            
            return ResponseEntity.ok(ApiResponse.success("로그아웃이 완료되었습니다.", null));
        } catch (Exception e) {
            log.error("로그아웃 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("로그아웃에 실패했습니다.", "LOGOUT_FAILED", List.of(e.getMessage())));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refreshToken(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String refreshToken = authHeader.substring(7); // "Bearer " 제거
            
            // 리프레시 토큰 검증
            if (!jwtService.isRefreshToken(refreshToken)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("유효하지 않은 리프레시 토큰입니다.", "INVALID_REFRESH_TOKEN", null));
            }

            // 리프레시 토큰에서 사용자 정보 추출
            String email = jwtService.extractEmail(refreshToken);
            Long userId = jwtService.extractUserId(refreshToken);

            // 새로운 액세스 토큰 발급
            String newAccessToken = jwtService.generateToken(email, userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", newAccessToken);
            
            return ResponseEntity.ok(ApiResponse.success("토큰이 재발급되었습니다.", response));
        } catch (Exception e) {
            log.error("토큰 재발급 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("토큰 재발급에 실패했습니다.", "REFRESH_FAILED", List.of(e.getMessage())));
        }
    }

    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponse<Void>> withdrawUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            // JWT 토큰에서 사용자 ID 추출
            String token = authHeader.substring(7); // "Bearer " 제거
            Long userId = jwtService.extractUserId(token);

            // 비밀번호 확인
            String password = body.get("password");
            if (password == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("비밀번호를 입력해주세요.", "INVALID_REQUEST", null));
            }

            // 회원 탈퇴 처리
            userService.withdrawUser(userId, password);
            
            // 토큰을 블랙리스트에 추가
            Claims claims = jwtService.validateToken(token);
            long expirationTime = claims.getExpiration().getTime();
            tokenBlacklistService.blacklistToken(token, expirationTime);
            
            return ResponseEntity.ok(ApiResponse.success("회원 탈퇴가 완료되었습니다.", null));
        } catch (Exception e) {
            log.error("회원 탈퇴 실패", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("회원 탈퇴에 실패했습니다.", "WITHDRAW_FAILED", List.of(e.getMessage())));
        }
    }
}
