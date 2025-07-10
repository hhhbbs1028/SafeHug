package com.capstone.SafeHug.service;

import com.capstone.SafeHug.config.ChatGPTConfig;
import com.capstone.SafeHug.dto.request.ChatbotRequest;
import com.capstone.SafeHug.dto.response.ChatbotResponse;
import com.capstone.SafeHug.entity.ChatbotLog;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.exception.ChatbotException;
import com.capstone.SafeHug.repository.ChatbotLogRepository;
import com.capstone.SafeHug.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatbotService {

    private static final int MAX_RETRY_COUNT = 2;
    private static final long INITIAL_RETRY_DELAY = 2000;
    private static final long MAX_RETRY_DELAY = 5000;

    // 민감 상황 감지를 위한 키워드 목록
    private static final List<String> CRISIS_KEYWORDS = Arrays.asList(
        "자살", "죽고싶다", "끝내고싶다", "더이상", "힘들다",
        "폭력", "폭행", "협박", "위협", "스토킹",
        "성폭력", "성추행", "성희롱", "성폭행",
        "긴급", "위험", "도와주세요", "구해주세요"
    );

    // 위기 상황별 대응 프롬프트
    private static final Map<String, String> CRISIS_PROMPTS = new HashMap<>();
    static {
        CRISIS_PROMPTS.put("SUICIDE", 
            "당신은 자살 위기 상황에 처한 사람을 돕는 전문 상담사입니다. " +
            "공감과 이해를 바탕으로 대화하며, 전문가의 도움을 받을 수 있도록 안내합니다. " +
            "위기 상황에서는 즉시 전문가의 도움을 받을 수 있도록 안내하고, " +
            "자살예방상담전화 1393이나 응급실을 방문하도록 권장합니다.");
        
        CRISIS_PROMPTS.put("VIOLENCE",
            "당신은 폭력 상황에 처한 사람을 돕는 전문 상담사입니다. " +
            "안전을 최우선으로 고려하며, 즉시 경찰(112)이나 여성긴급전화(1366)에 연락하도록 안내합니다. " +
            "증거 수집과 법적 대응 방법에 대해 안내하며, 전문가의 도움을 받을 수 있도록 지원합니다.");
        
        CRISIS_PROMPTS.put("SEXUAL_VIOLENCE",
            "당신은 성폭력 피해자를 돕는 전문 상담사입니다. " +
            "피해자의 감정을 공감하며, 성폭력상담전화(1366)나 경찰(112)에 즉시 연락하도록 안내합니다. " +
            "증거 수집과 법적 대응 방법에 대해 안내하며, 전문가의 도움을 받을 수 있도록 지원합니다.");
    }

    // 기본 시스템 프롬프트
    private static final String DEFAULT_SYSTEM_PROMPT = 
        "당신은 성폭력 피해자를 돕는 전문 상담사입니다. " +
        "공감과 이해를 바탕으로 대화하며, 전문가의 도움을 받을 수 있도록 안내합니다. " +
        "위기 상황에서는 즉시 전문가의 도움을 받을 수 있도록 안내하고, " +
        "필요한 경우 경찰(112), 여성긴급전화(1366), 자살예방상담전화(1393) 등에 연락하도록 권장합니다.";

    @Autowired
    private ChatGPTConfig chatGPTConfig;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ChatbotLogRepository chatbotLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public ChatbotResponse processMessage(ChatbotRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new ChatbotException("메시지가 비어있습니다.");
        }

        if (request.getMessage().trim().length() > 500) {
            throw new ChatbotException("메시지는 최대 500자까지 입력할 수 있습니다.");
        }
        log.info("=== Chatbot 요청 시작 ===");
        log.info("요청 메시지: {}", request.getMessage());
        log.info("세션 ID: {}", request.getSessionId());
        log.info("사용자 ID: {}", request.getUserId());
        log.info("🔥 현재 적용된 OpenAI API 키: {}", chatGPTConfig.getApiKey());

        // 민감 상황 감지
        String crisisType = detectCrisisSituation(request.getMessage());
        String systemPrompt = crisisType != null ? CRISIS_PROMPTS.get(crisisType) : DEFAULT_SYSTEM_PROMPT;

        int retryCount = 0;
        long retryDelay = INITIAL_RETRY_DELAY;

        while (retryCount <= MAX_RETRY_COUNT) {
            try {
                // ChatGPT API 요청 헤더 설정
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(chatGPTConfig.getApiKey());
                headers.set("Accept-Charset", "UTF-8");

                // ChatGPT API 요청 본문 설정
                Map<String, Object> requestBody = new LinkedHashMap<>();
                requestBody.put("model", "gpt-3.5-turbo");
                
                List<Map<String, String>> messages = new ArrayList<>();
                
                // 시스템 프롬프트 추가
                Map<String, String> systemMessage = new LinkedHashMap<>();
                systemMessage.put("role", "system");
                systemMessage.put("content", systemPrompt);
                messages.add(systemMessage);
                
                // 사용자 메시지 추가
                Map<String, String> userMessage = new LinkedHashMap<>();
                userMessage.put("role", "user");
                userMessage.put("content", request.getMessage());
                messages.add(userMessage);
                
                requestBody.put("messages", messages);
                requestBody.put("temperature", 0.7); // 더 자연스러운 대화를 위해 temperature 조정
                requestBody.put("max_tokens", 500); // 더 긴 응답을 위해 토큰 수 증가
                requestBody.put("presence_penalty", 0.3);
                requestBody.put("frequency_penalty", 0.2);

                // 요청 내용 로깅
                log.info("=== ChatGPT API 요청 내용 ===");
                log.info("API URL: {}", chatGPTConfig.getApiUrl());
                String requestJson = objectMapper.writeValueAsString(requestBody);
                log.info("요청 본문: {}", requestJson);

                // ChatGPT API 호출
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                Map<String, Object> response = restTemplate.postForObject(
                    chatGPTConfig.getApiUrl(),
                    entity,
                    Map.class
                );

                // 응답 내용 로깅
                log.info("=== ChatGPT API 응답 내용 ===");
                log.info("응답: {}", objectMapper.writeValueAsString(response));

                if (response == null) {
                    throw new ChatbotException("ChatGPT API 응답이 없습니다.");
                }

                // 응답 처리
                String content = extractResponseFromGPT(response);
                
                // 응답 내용 검증
                if (content == null || content.trim().isEmpty()) {
                    throw new ChatbotException("ChatGPT 응답 내용이 비어있습니다.");
                }

                // 응답 내용 로깅
                log.info("=== ChatGPT API 응답 처리 완료 ===");
                log.info("처리된 응답: {}", content);

                // 동적 옵션 생성
                List<String> options = generateOptions(content);

                // 응답 타입 설정
                String type = "bot";

                // 채팅 로그 저장
                ChatbotLog chatbotLog = new ChatbotLog();
                chatbotLog.setMessage(request.getMessage());
                chatbotLog.setResponse(content);
                chatbotLog.setSessionId(request.getSessionId());
                if (request.getUserId() != null) {
                    chatbotLog.setUser(userRepository.findById(request.getUserId()).orElse(null));
                }
                chatbotLog.setCreatedAt(LocalDateTime.now());
                chatbotLogRepository.save(chatbotLog);

                return new ChatbotResponse(content, options, type);

            } catch (HttpClientErrorException e) {
                log.error("=== ChatGPT API HTTP 오류 ===");
                log.error("오류 발생 시간: {}", LocalDateTime.now());
                log.error("상태 코드: {}", e.getStatusCode());
                log.error("상태 텍스트: {}", e.getStatusText());
                log.error("오류 응답: {}", e.getResponseBodyAsString());

                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    if (retryCount < MAX_RETRY_COUNT) {
                        log.info("요청 제한 도달. {}번째 재시도...", retryCount + 1);
                        try {
                            TimeUnit.MILLISECONDS.sleep(retryDelay);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new ChatbotException("요청 처리 중 오류가 발생했습니다.");
                        }
                        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
                        retryCount++;
                        continue;
                    }
                    throw new ChatbotException("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                }

                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    throw new ChatbotException("API 인증에 실패했습니다. 관리자에게 문의해주세요.");
                }

                if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                    String errorResponse = e.getResponseBodyAsString();
                    if (errorResponse.contains("insufficient_quota")) {
                        throw new ChatbotException("API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
                    }
                }

                throw new ChatbotException("ChatGPT API 호출 중 오류가 발생했습니다: " + e.getStatusText());

            } catch (ResourceAccessException e) {
                log.error("=== ChatGPT API 연결 실패 ===");
                log.error("오류 발생 시간: {}", LocalDateTime.now());
                log.error("오류 메시지: {}", e.getMessage());
                log.error("오류 원인: {}", e.getCause());
                
                if (e.getCause() instanceof java.net.SocketTimeoutException) {
                    if (retryCount < MAX_RETRY_COUNT) {
                        log.info("타임아웃 발생. {}번째 재시도...", retryCount + 1);
                        try {
                            TimeUnit.MILLISECONDS.sleep(retryDelay);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new ChatbotException("요청 처리 중 오류가 발생했습니다.");
                        }
                        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
                        retryCount++;
                        continue;
                    }
                    throw new ChatbotException("서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
                }
                
                throw new ChatbotException("서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.");

            } catch (Exception e) {
                log.error("=== ChatGPT API 예상치 못한 오류 ===");
                log.error("오류 발생 시간: {}", LocalDateTime.now());
                log.error("오류 메시지: {}", e.getMessage());
                log.error("오류 원인: {}", e.getCause());
                throw new ChatbotException("ChatGPT API 호출 중 오류가 발생했습니다: " + e.getMessage());
            }
        }

        throw new ChatbotException("요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }

    private String extractResponseFromGPT(Map<String, Object> response) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new ChatbotException("ChatGPT 응답에 choices가 없습니다.");
            }
            
            Map<String, Object> choice = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) choice.get("message");
            if (message == null) {
                throw new ChatbotException("ChatGPT 응답에 message가 없습니다.");
            }
            
            String content = (String) message.get("content");
            if (content == null || content.trim().isEmpty()) {
                throw new ChatbotException("ChatGPT 응답 내용이 비어있습니다.");
            }

            // 토큰 사용량 로깅
            Map<String, Object> usage = (Map<String, Object>) response.get("usage");
            if (usage != null) {
                log.info("=== 토큰 사용량 ===");
                log.info("프롬프트 토큰: {}", usage.get("prompt_tokens"));
                log.info("완성 토큰: {}", usage.get("completion_tokens"));
                log.info("총 토큰: {}", usage.get("total_tokens"));
            }
            
            return content;
        } catch (Exception e) {
            log.error("ChatGPT 응답 처리 중 오류 발생: {}", e.getMessage());
            throw new ChatbotException("ChatGPT 응답 처리 중 오류가 발생했습니다.", e);
        }
    }

    private String detectCrisisSituation(String message) {
        String lowerMessage = message.toLowerCase();
        
        // 자살 위기 감지
        if (CRISIS_KEYWORDS.stream().anyMatch(keyword -> 
            lowerMessage.contains(keyword) && 
            (keyword.equals("자살") || keyword.equals("죽고싶다") || keyword.equals("끝내고싶다")))) {
            return "SUICIDE";
        }
        
        // 폭력 상황 감지
        if (CRISIS_KEYWORDS.stream().anyMatch(keyword -> 
            lowerMessage.contains(keyword) && 
            (keyword.equals("폭력") || keyword.equals("폭행") || keyword.equals("협박") || keyword.equals("위협")))) {
            return "VIOLENCE";
        }
        
        // 성폭력 상황 감지
        if (CRISIS_KEYWORDS.stream().anyMatch(keyword -> 
            lowerMessage.contains(keyword) && 
            (keyword.equals("성폭력") || keyword.equals("성추행") || keyword.equals("성희롱") || keyword.equals("성폭행")))) {
            return "SEXUAL_VIOLENCE";
        }
        
        return null;
    }

    private List<String> generateOptions(String response) {
        List<String> options = new ArrayList<>();
        
        // 기본 옵션
        options.add("다른 질문이 있어요");
        options.add("상담 종료하기");
        
        // 위기 상황 감지 시 긴급 지원 옵션 추가
        if (response.contains("자살") || response.contains("죽고싶다")) {
            options.add("자살예방상담전화(1393) 연결하기");
            options.add("응급실 방문 안내받기");
        }
        if (response.contains("폭력") || response.contains("협박")) {
            options.add("경찰(112) 신고하기");
            options.add("여성긴급전화(1366) 연결하기");
        }
        if (response.contains("성폭력") || response.contains("성추행")) {
            options.add("성폭력상담전화(1366) 연결하기");
            options.add("증거 수집 방법 안내받기");
        }
        
        // 일반 상담 옵션
        if (response.contains("법률") || response.contains("변호사")) {
            options.add("법률 상담이 필요해요");
        }
        if (response.contains("심리") || response.contains("상담")) {
            options.add("심리 상담이 필요해요");
        }
        
        // 중복 제거 및 최대 4개 옵션으로 제한
        return options.stream()
            .distinct()
            .limit(4)
            .collect(Collectors.toList());
    }
} 