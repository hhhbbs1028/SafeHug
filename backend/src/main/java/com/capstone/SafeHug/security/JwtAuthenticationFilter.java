package com.capstone.SafeHug.security;

import com.capstone.SafeHug.config.JwtConfig;
import com.capstone.SafeHug.service.TokenBlacklistService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtConfig jwtConfig;
    private final TokenBlacklistService tokenBlacklistService;
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/upload") || 
               path.startsWith("/api/upload/analysis") ||
               path.startsWith("/api/upload/chat") ||
               path.startsWith("/api/user/login") || 
               path.startsWith("/api/user/signup") || 
               path.startsWith("/api/user/delete") ||
               path.startsWith("/api/chatbot/message") ||
               path.startsWith("/api/user/refresh");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = extractToken(request);
        
        if (token != null) {
            try {
                // 블랙리스트 체크
                if (tokenBlacklistService.isBlacklisted(token)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\": \"토큰이 블랙리스트에 등록되어 있습니다.\"}");
                    return;
                }

                Claims claims = jwtConfig.validateToken(token);
                String email = claims.getSubject();
                Long userId = claims.get("userId", Long.class);
                
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                );
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException e) {
                logger.error("JWT token validation failed", e);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"" + e.getMessage() + "\"}");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7).trim();
            
            // 토큰 형식 검증
            if (token.isEmpty()) {
                log.error("토큰이 비어있습니다.");
                return null;
            }
            
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                log.error("잘못된 JWT 토큰 형식: 마침표 개수 = {}", parts.length);
                return null;
            }
            
            // 각 부분이 비어있지 않은지 확인
            for (int i = 0; i < parts.length; i++) {
                if (parts[i].isEmpty()) {
                    log.error("JWT 토큰의 {}번째 부분이 비어있습니다.", i + 1);
                    return null;
                }
            }
            
            return token;
        }
        return null;
    }
} 