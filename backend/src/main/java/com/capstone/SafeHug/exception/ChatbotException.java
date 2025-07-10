package com.capstone.SafeHug.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 채팅봇 관련 예외를 처리하는 클래스
 * 채팅봇 응답 생성 중 발생하는 오류를 처리합니다.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ChatbotException extends RuntimeException {
    public ChatbotException(String message) {
        super(message);
    }

    public ChatbotException(String message, Throwable cause) {
        super(message, cause);
    }
} 