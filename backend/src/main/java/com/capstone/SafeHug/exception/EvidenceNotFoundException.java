package com.capstone.SafeHug.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 증거 자료를 찾을 수 없을 때 발생하는 예외 클래스
 * 증거 자료 조회 시 해당 ID의 자료가 존재하지 않을 경우 발생합니다.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class EvidenceNotFoundException extends RuntimeException {
    public EvidenceNotFoundException(String message) {
        super(message);
    }

    public EvidenceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
} 