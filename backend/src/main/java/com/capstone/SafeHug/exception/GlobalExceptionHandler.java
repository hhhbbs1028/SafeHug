package com.capstone.SafeHug.exception;

import com.capstone.SafeHug.dto.response.ChatbotResponse;
import com.capstone.SafeHug.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    // 에러 코드 상수
    private static final String ERROR_CODE_VALIDATION = "VALIDATION_ERROR";
    private static final String ERROR_CODE_ACCESS_DENIED = "ACCESS_DENIED";
    private static final String ERROR_CODE_AUTHENTICATION = "AUTHENTICATION_ERROR";
    private static final String ERROR_CODE_FILE_UPLOAD = "FILE_UPLOAD_ERROR";
    private static final String ERROR_CODE_USER_NOT_FOUND = "USER_NOT_FOUND";
    private static final String ERROR_CODE_EVIDENCE_NOT_FOUND = "EVIDENCE_NOT_FOUND";
    private static final String ERROR_CODE_INTERNAL = "INTERNAL_SERVER_ERROR";
    private static final String ERROR_CODE_INVALID_ARGUMENT = "INVALID_ARGUMENT";
    
    // 오류 메시지 상수
    private static final String DEFAULT_ERROR_MESSAGE = "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    private static final String VALIDATION_ERROR_MESSAGE = "입력하신 정보가 올바르지 않습니다. 다시 한 번 확인해주세요.";
    private static final String ACCESS_DENIED_MESSAGE = "해당 기능에 대한 접근 권한이 없습니다. 관리자에게 문의해주세요.";
    private static final String AUTHENTICATION_ERROR_MESSAGE = "로그인이 필요합니다. 다시 로그인해주세요.";
    private static final String FILE_UPLOAD_ERROR_MESSAGE = "파일 업로드 중 오류가 발생했습니다. 파일 크기와 형식을 확인해주세요.";
    private static final String USER_NOT_FOUND_MESSAGE = "해당 사용자를 찾을 수 없습니다. 회원가입이 필요합니다.";
    private static final String EVIDENCE_NOT_FOUND_MESSAGE = "요청하신 증거 자료를 찾을 수 없습니다. 다시 확인해주세요.";
    private static final String INVALID_ARGUMENT_MESSAGE = "잘못된 요청입니다. 입력값을 확인해주세요.";
    
    // 기본 버튼 옵션
    private static final List<String> DEFAULT_BUTTONS = Arrays.asList("다시 시도하기", "다른 도움이 필요해요");

    private String getStackTraceAsString(Exception e) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }

    private void logExceptionDetails(String type, Exception e, Map<String, Object> additionalInfo) {
        StackTraceElement[] stackTrace = e.getStackTrace();
        String location = stackTrace.length > 0 ? stackTrace[0].toString() : "위치 정보 없음";
        
        log.error("=== {} 발생 ===", type);
        log.error("발생 시간: {}", LocalDateTime.now());
        log.error("발생 위치: {}", location);
        log.error("오류 메시지: {}", e.getMessage());
        if (additionalInfo != null && !additionalInfo.isEmpty()) {
            log.error("추가 정보: {}", additionalInfo);
        }
        log.error("스택 트레이스:\n{}", getStackTraceAsString(e));
        log.error("=================");
    }

    // 챗봇 관련 예외 처리
    @ExceptionHandler(ChatbotException.class)
    public ResponseEntity<ChatbotResponse> handleChatbotException(ChatbotException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "ChatbotException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("ChatbotException", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ChatbotResponse(
                "죄송합니다. " + e.getMessage() + "\n다시 시도해주시거나 다른 방법을 선택해주세요.",
                DEFAULT_BUTTONS,
                "bot"
            ));
    }

    // 일반 API 응답을 위한 예외 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        List<String> errors = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.toList());
            
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("validationErrors", errors);
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("입력값 검증 실패", e, additionalInfo);
            
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ApiResponse<>(
                false,
                VALIDATION_ERROR_MESSAGE,
                null,
                ERROR_CODE_VALIDATION,
                errors
            ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "AccessDeniedException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("접근 권한 없음", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(new ApiResponse<>(
                false,
                ACCESS_DENIED_MESSAGE,
                null,
                ERROR_CODE_ACCESS_DENIED,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "AuthenticationException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("인증 실패", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(new ApiResponse<>(
                false,
                AUTHENTICATION_ERROR_MESSAGE,
                null,
                ERROR_CODE_AUTHENTICATION,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<ApiResponse<Void>> handleFileUploadException(FileUploadException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "FileUploadException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("파일 업로드 오류", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiResponse<>(
                false,
                FILE_UPLOAD_ERROR_MESSAGE,
                null,
                ERROR_CODE_FILE_UPLOAD,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFoundException(UserNotFoundException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "UserNotFoundException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("사용자 찾기 실패", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ApiResponse<>(
                false,
                USER_NOT_FOUND_MESSAGE,
                null,
                ERROR_CODE_USER_NOT_FOUND,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(EvidenceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEvidenceNotFoundException(EvidenceNotFoundException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "EvidenceNotFoundException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("증거 자료 찾기 실패", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ApiResponse<>(
                false,
                EVIDENCE_NOT_FOUND_MESSAGE,
                null,
                ERROR_CODE_EVIDENCE_NOT_FOUND,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(ValidationException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "ValidationException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("입력값 검증 실패", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ApiResponse<>(
                false,
                VALIDATION_ERROR_MESSAGE,
                null,
                ERROR_CODE_VALIDATION,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "IllegalArgumentException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("잘못된 인자", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ApiResponse<>(
                false,
                INVALID_ARGUMENT_MESSAGE,
                null,
                ERROR_CODE_INVALID_ARGUMENT,
                List.of(e.getMessage())
            ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        Map<String, Object> additionalInfo = new HashMap<>();
        additionalInfo.put("errorType", "UnexpectedException");
        additionalInfo.put("timestamp", LocalDateTime.now());
        
        logExceptionDetails("예상치 못한 오류", e, additionalInfo);
        
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiResponse<>(
                false,
                DEFAULT_ERROR_MESSAGE,
                null,
                ERROR_CODE_INTERNAL,
                List.of(e.getMessage())
            ));
    }
} 