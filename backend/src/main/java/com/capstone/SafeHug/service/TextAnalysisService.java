package com.capstone.SafeHug.service;

import com.capstone.SafeHug.dto.common.MessageRisk;
import com.capstone.SafeHug.dto.response.AIAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import org.springframework.web.client.RestClientException;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;
@Slf4j
@Service
@RequiredArgsConstructor
public class TextAnalysisService {
    private final RestTemplate restTemplate;
    private final FileUploadService fileUploadService;
    
    @Value("${ai.server.url}")
    private String aiServerUrl;
    
    @Value("${cloud.aws.s3.bucketName}")
    private String bucketName;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    public AIAnalysisResponse analyzeIndividualMessages(String s3Path) {
        log.info("채팅 분석 시작 - S3 파일 경로: {}", s3Path);
        
        if (s3Path == null || s3Path.trim().isEmpty()) {
            throw new IllegalArgumentException("S3 파일 경로가 비어있습니다.");
        }

        try {
            // S3 URL에서 키만 추출
            String s3Key = s3Path;
            if (s3Path.startsWith("http")) {
                // URL에서 마지막 두 부분만 추출 (chat-files/파일명.txt)
                String[] parts = s3Path.split("/");
                if (parts.length >= 2) {
                    s3Key = parts[parts.length - 2] + "/" + parts[parts.length - 1];
                }
            }
            log.info("추출된 S3 키: {}", s3Key);

            // AI 서버에 분석 요청
            Map<String, String> request = new HashMap<>();
            request.put("s3_path", s3Key);
            request.put("bucket_name", bucketName);
            
            log.debug("AI 서버 요청 데이터: {}", request);
            
            // AI 서버 응답을 String으로 먼저 받기
            String rawResponse = restTemplate.postForObject(
                aiServerUrl + "/analyze",
                request,
                String.class
            );
            
            log.info("AI 서버 원본 응답: {}", rawResponse);
            
            // String을 AIAnalysisResponse로 변환
            ObjectMapper mapper = new ObjectMapper();
            AIAnalysisResponse response = mapper.readValue(rawResponse, AIAnalysisResponse.class);
            
            if (response == null) {
                log.error("AI 서버 응답이 null입니다.");
                throw new RuntimeException("AI 서버 응답이 null입니다.");
            }
            
            if (response.getMessages() == null) {
                log.error("AI 서버가 분석한 메시지가 없습니다.");
                throw new RuntimeException("AI 서버 응답의 analyses 필드가 null입니다.");
            }

            // 키워드 분석 결과 로깅
            if (response.getKeywords() != null && !response.getKeywords().isEmpty()) {
                log.info("키워드 분석 결과:");
                for (AIAnalysisResponse.KeywordAnalysis keyword : response.getKeywords()) {
                    log.info("- 키워드: {}, 빈도: {}, 위험도: {}", 
                        keyword.getKeyword(), keyword.getCount(), keyword.getRisk());
                }
            }
            
            log.info("채팅 분석 완료 - 총 메시지 수: {}, 위험 메시지 수: {}", 
                response.getMessages().size(),
                response.getMessages().stream()
                    .filter(message -> message.getRisks() != null && !message.getRisks().isEmpty())
                    .count());
            
            return response;
            
        } catch (RestClientException e) {
            log.error("AI 서버 통신 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("AI 서버 통신 실패", e);
        } catch (Exception e) {
            log.error("채팅 분석 중 예상치 못한 오류 발생: {}", e.getMessage());
            throw new RuntimeException("채팅 분석 실패", e);
        }
    }

    public String generateGPTResponse(String s3Path) {
        try {
            String chatContent = fileUploadService.downloadChatFile(s3Path);
            if (chatContent == null) {
                log.error("채팅 내용을 읽을 수 없습니다.");
                return "채팅 내용을 읽을 수 없습니다.";
            }

            // GPT 프롬프트 생성
            String prompt = String.format(
                "다음 채팅 내용을 분석해주세요:\n\n%s\n\n" +
                "아래와 같이 요약과 3가지의 이유 형식으로 작성해주세요:\n" +
                "요약: [전체 대화의 짧은 요약]\n" +
                "이유:\n" +
                "- [위험도 판단 이유 1]\n" +
                "- [위험도 판단 이유 2]\n" +
                "- [위험도 판단 이유 3]\n",
                chatContent
            );

            // OpenAI API 호출
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(60));
            
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage("system", "당신은 채팅 내용을 분석하고 요약하는 AI입니다."));
            messages.add(new ChatMessage("user", prompt));

            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                .model("gpt-4o-mini")
                .messages(messages)
                .maxTokens(300)
                .temperature(0.5)
                .presencePenalty(0.3)
                .frequencyPenalty(0.2)
                .build();

            String response = service.createChatCompletion(completionRequest)
                .getChoices().get(0).getMessage().getContent().trim();

            // UTF-8로 인코딩 보장
            byte[] bytes = response.getBytes("UTF-8");
            response = new String(bytes, "UTF-8");

            log.info("GPT 응답 생성 완료:\n{}", response);
            return response;

        } catch (Exception e) {
            log.error("GPT 응답 생성 중 오류 발생: {}", e.getMessage(), e);
            return "대화 분석 중 오류가 발생했습니다.";
        }
    }

    private String preprocessText(String text) {
        // 특수문자 제거, 공백 정규화 등 전처리
        return text.replaceAll("[^가-힣a-zA-Z0-9\\s]", " ")
                  .replaceAll("\\s+", " ")
                  .trim();
    }

}
