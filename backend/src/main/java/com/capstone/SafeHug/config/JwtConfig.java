package com.capstone.SafeHug.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import java.util.Base64;
import java.security.Key;
import java.util.Date;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@Getter
public class JwtConfig {

    private final String secret;
    private final Long expiration;
    private final Long refreshExpiration;

    public JwtConfig(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") Long expiration,
            @Value("${jwt.refresh-expiration:604800000}") Long refreshExpiration) {
        this.secret = secret;
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
        
        log.info("JwtConfig initialized with secret length: {}", secret.length());
        log.info("JwtConfig expiration: {}", expiration);
        log.info("JwtConfig refreshExpiration: {}", refreshExpiration);
    }

    /**
     * JWT 서명에 사용할 키를 생성합니다.
     * Base64로 디코딩된 비밀키를 HMAC-SHA 알고리즘에 맞는 키로 변환합니다.
     * 
     * @return Key 서명에 사용할 키
     */
    private Key getSigningKey() {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(secret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            log.error("Error creating signing key: {}", e.getMessage());
            throw new RuntimeException("JWT 서명 키 생성 실패", e);
        }
    }

    public String generateToken(String email, Long userId) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expiration);

            return Jwts.builder()
                    .setSubject(email)
                    .claim("userId", userId)
                    .setIssuedAt(now)
                    .setExpiration(expiryDate)
                    .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                    .compact();
        } catch (Exception e) {
            log.error("Token generation failed: {}", e.getMessage());
            throw new RuntimeException("JWT 토큰 생성 실패", e);
        }
    }

    /**
     * JWT 토큰을 검증하고 클레임을 추출합니다.
     * 
     * 검증 내용:
     * - 토큰 서명 유효성
     * - 토큰 만료 여부
     * - 토큰 형식
     * 
     * @param token 검증할 JWT 토큰
     * @return Claims 토큰에서 추출한 클레임
     * @throws RuntimeException 토큰 검증 실패 시
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new RuntimeException("JWT 토큰이 만료되었습니다.");
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            throw new RuntimeException("JWT 토큰 형식이 올바르지 않습니다: " + e.getMessage());
        } catch (io.jsonwebtoken.SignatureException e) {
            throw new RuntimeException("JWT 토큰 서명이 유효하지 않습니다.");
        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            throw new RuntimeException("JWT 토큰 검증 실패", e);
        }
    }
} 