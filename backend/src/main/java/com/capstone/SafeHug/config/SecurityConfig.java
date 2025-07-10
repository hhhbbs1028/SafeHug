package com.capstone.SafeHug.config;

import com.capstone.SafeHug.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Spring Security 설정 클래스
 * 
 * 이 클래스는 애플리케이션의 보안 관련 설정을 담당합니다.
 * 주요 기능:
 * 1. 인증/인가 규칙 설정
 * 2. CORS 설정
 * 3. JWT 필터 설정
 * 4. 비밀번호 암호화 설정
 * 
 * 보안 설정 상세:
 * - CSRF 보호 비활성화 (REST API이므로 불필요)
 * - 세션 관리: STATELESS (JWT 사용)
 * - 인증이 필요 없는 엔드포인트 설정
 * - JWT 기반 인증 필터 적용
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig implements WebMvcConfigurer {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(3600)
                .resourceChain(true);
    }

    /**
     * Spring Security의 필터 체인을 설정합니다.
     * 
     * 설정 내용:
     * 1. CORS 설정 적용
     * 2. CSRF 보호 비활성화
     * 3. 세션 관리: STATELESS
     * 4. URL별 접근 권한 설정
     * 5. JWT 인증 필터 추가
     * 
     * @param http HttpSecurity 객체
     * @return SecurityFilterChain
     * @throws Exception 설정 중 발생할 수 있는 예외
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println("=== SecurityFilterChain Loaded ===");
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/static/**", "/favicon.ico", "/error", "/.well-known/**").permitAll()
                .requestMatchers(
                    "/api/user/signup",          // 회원가입
                    "/api/user/login",           // 로그인
                    "/api/user/email-exists",    // 이메일 중복 확인
                    "/api/user/find-password",   // 비밀번호 찾기
                    "/api/user/reset-password",  // 비밀번호 재설정
                    "/api/user/refresh",         // 토큰 갱신
                    "/api/upload",               // 파일 업로드
                    "/api/upload/analysis/**",   // 분석 결과 조회
                    "/api/upload/chat",          // 채팅
                    "/api/chatbot/message",      // 챗봇 메시지
                    "/api/login/**",             // 소셜 로그인 관련
                    "/api/login/naver/callback", // 네이버 로그인 콜백
                    "/kakao/callback",           // 카카오 로그인 콜백
                    "/login/**"                  // 기타 로그인 관련
                ).permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\": \"인증이 필요합니다.\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\": \"접근이 거부되었습니다.\"}");
                }))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    /**
     * CORS(Cross-Origin Resource Sharing) 설정을 정의합니다.
     * 
     * 설정 내용:
     * 1. 허용할 출처(Origin) 설정
     * 2. 허용할 HTTP 메서드 설정
     * 3. 허용할 HTTP 헤더 설정
     * 4. 노출할 HTTP 헤더 설정
     * 5. 인증 정보(쿠키 등) 허용 설정
     * 6. preflight 요청의 캐시 시간 설정
     * 
     * @return CorsConfigurationSource CORS 설정 소스
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); // 프론트엔드 주소
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type",
            "Cache-Control",
            "Pragma",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // preflight 요청 캐시 시간 1시간
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * 비밀번호 암호화를 위한 PasswordEncoder 빈을 생성합니다.
     * 
     * BCrypt 알고리즘을 사용하여 비밀번호를 안전하게 해시화합니다.
     * 주요 특징:
     * - 단방향 해시 함수
     * - 솔트(salt) 자동 생성
     * - 작업 인자(work factor) 조정 가능
     * 
     * @return PasswordEncoder BCrypt 기반 비밀번호 인코더
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
