package com.capstone.SafeHug.service;

import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class PasswordResetTokenService {
    private final ConcurrentHashMap<String, TokenInfo> resetTokens = new ConcurrentHashMap<>();
    private static final long TOKEN_EXPIRATION_MINUTES = 30;

    public String generateToken(String email) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plus(TOKEN_EXPIRATION_MINUTES, ChronoUnit.MINUTES);
        resetTokens.put(token, new TokenInfo(email, expirationTime));
        return token;
    }

    public boolean validateToken(String token) {
        TokenInfo tokenInfo = resetTokens.get(token);
        if (tokenInfo == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(tokenInfo.expirationTime)) {
            resetTokens.remove(token);
            return false;
        }

        return true;
    }

    public String getEmailFromToken(String token) {
        TokenInfo tokenInfo = resetTokens.get(token);
        return tokenInfo != null ? tokenInfo.email : null;
    }

    public void removeToken(String token) {
        resetTokens.remove(token);
    }

    private static class TokenInfo {
        final String email;
        final LocalDateTime expirationTime;

        TokenInfo(String email, LocalDateTime expirationTime) {
            this.email = email;
            this.expirationTime = expirationTime;
        }
    }
} 