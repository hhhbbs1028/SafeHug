package com.capstone.SafeHug.service;

import com.capstone.SafeHug.common.RiskLevel;
import com.capstone.SafeHug.common.RiskType;
import com.capstone.SafeHug.dto.common.ChatReport;
import com.capstone.SafeHug.dto.response.AIAnalysisResponse;
import com.capstone.SafeHug.dto.common.AiRisk;
import com.capstone.SafeHug.dto.common.MessageRisk;
import com.capstone.SafeHug.dto.response.chat.ChatAnalysisResponse;
import com.capstone.SafeHug.dto.response.chat.GptAnalysisResponse;
import com.capstone.SafeHug.dto.response.evidence.MyEvidenceResponse;
import com.capstone.SafeHug.dto.request.evidence.EvidenceFilterRequest;
import com.capstone.SafeHug.dto.request.PdfCreateRequest;
import com.capstone.SafeHug.dto.request.PdfGenerationRequest;
import com.capstone.SafeHug.dto.response.evidence.EvidencePdfResponse;
import com.capstone.SafeHug.entity.*;
import com.capstone.SafeHug.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.waiters.WaiterResponse;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static java.lang.String.valueOf;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatAnalysisService {
    private final ChatAnalysisRepository chatAnalysisRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatUploadRepository chatUploadRepository;
    private final KeywordAnalysisRepository keywordAnalysisRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final TextAnalysisService textAnalysisService;
    private final EvidenceRecordRepository evidenceRecordRepository;
    private final EvidenceService evidenceService;

    // PC 메시지 형식: [이름] [오전/오후 HH:mm] 메시지
    private static final Pattern PC_MESSAGE_PATTERN = Pattern.compile("\\[(.*?)\\]\\s*\\[(오전|오후)\\s*(\\d{1,2}:\\d{2})\\]\\s*(.*?)(?=\\n|$)");

    // Mobile 메시지 형식: YYYY년 MM월 DD일 오전/오후 HH:mm, 이름 : 메시지
    private static final Pattern MOBILE_MESSAGE_PATTERN = Pattern.compile("(\\d{4}년 \\d{1,2}월 \\d{1,2}일 (오전|오후) \\d{1,2}:\\d{2}),\\s*(.*?)\\s*:\\s*(.*?)(?=\\n\\d{4}년|$)");

    // PC 날짜 구분선 형식: --------------- YYYY년 MM월 DD일 요일 ---------------
    private static final Pattern PC_DATE_PATTERN = Pattern.compile("--------------- (\\d{4}년 \\d{1,2}월 \\d{1,2}일 \\S+요일) ---------------");

    // PC 채팅방 정보 형식: 이름 님과 카카오톡 대화\n저장한 날짜 : YYYY-MM-DD HH:mm:ss
    private static final Pattern PC_CHATROOM_INFO_PATTERN = Pattern.compile("(.*?) 님과 카카오톡 대화\\n저장한 날짜 : (\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})");

    // Mobile 채팅방 정보 형식: 이름 님과 카카오톡 대화\n저장한 날짜 : YYYY년 MM월 DD일 오전/오후 HH:mm
    private static final Pattern MOBILE_CHATROOM_INFO_PATTERN = Pattern.compile("(.*?) 님과 카카오톡 대화\\n저장한 날짜 : (\\d{4}년 \\d{1,2}월 \\d{1,2}일 (오전|오후) \\d{1,2}:\\d{2})");

    private static final DateTimeFormatter PC_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 M월 d일 EEEE", java.util.Locale.KOREAN);
    private static final DateTimeFormatter MOBILE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 M월 d일 a h:mm", java.util.Locale.KOREAN);

    private enum ChatFormat {
        PC, MOBILE, UNKNOWN
    }

    @Transactional
    public ChatAnalysisResponse analyzeChat(Long chatUploadId, String userName) {
        // 1. 채팅 파일 정보 조회
        Optional<ChatUpload> byId = chatUploadRepository.findById(chatUploadId);
        ChatUpload chatUpload = byId
                .orElseThrow(() -> new RuntimeException("Chat upload not found"));

        // 2. AWS에서 채팅 파일 다운로드
        String chatContent = fileUploadService.downloadChatFile(chatUpload.getFilePath());
        if (chatContent == null || chatContent.trim().isEmpty()) {
            throw new RuntimeException("채팅 파일을 읽을 수 없습니다.");
        }

        // 3. 채팅 메시지 파싱 및 저장
        List<ChatMessage> parsedMessages = parseChatMessages(chatContent, chatUpload);
        chatMessageRepository.saveAll(parsedMessages);

        // 4. AI 서버에 분석 요청
        AIAnalysisResponse aiResponse = textAnalysisService.analyzeIndividualMessages(chatUpload.getFilePath());

        // 5. 파싱된 메시지와 AI 분석 결과 매칭
        if (aiResponse.getMessages() == null || aiResponse.getMessages().isEmpty()) {
            log.error("AI 분석 결과가 비어 있습니다.");
            throw new RuntimeException("AI 분석 결과가 비어 있습니다.");
        }

        if (parsedMessages.isEmpty()) {
            log.error("파싱된 메시지가 없습니다.");
            throw new RuntimeException("파싱된 메시지가 없습니다.");
        }

        Map<String, ChatMessage> messageMap = parsedMessages.stream()
                .collect(Collectors.toMap(ChatMessage::getMessage, message -> message));

        analyzeMessages(parsedMessages, aiResponse);

        // 6. 분석된 메시지 저장
        chatMessageRepository.saveAll(parsedMessages);

        // 7. GPT를 사용한 요약 생성
        String gptResponse = textAnalysisService.generateGPTResponse(chatUpload.getFilePath());

        // 8. 전체 분석 결과 생성
        GptAnalysisResponse gptAnalysis = generateGPTAnalysis(gptResponse);

        // 9. 키워드 분석 결과 저장
        List<KeywordAnalysis> keywordAnalyses = null;
        if (aiResponse.getKeywords() != null && !aiResponse.getKeywords().isEmpty()) {
            keywordAnalyses = new ArrayList<>();
            for (AIAnalysisResponse.KeywordAnalysis keywordAnalysis : aiResponse.getKeywords()) {
                KeywordAnalysis keyword = new KeywordAnalysis();
                keyword.setKeyword(keywordAnalysis.getKeyword());
                keyword.setCount(keywordAnalysis.getCount());
                keyword.setRisk(convertToRiskLevel(keywordAnalysis.getRisk()));
                keywordAnalyses.add(keyword);
            }
            log.info("키워드 분석 결과 저장 완료 - {}개의 키워드", keywordAnalyses.size());
        }
        else log.info("키워드 저장 안됨 - null");

        log.info("createChatAnalysis");
        ChatAnalysis analysis = createChatAnalysis(chatUpload, parsedMessages, gptAnalysis, keywordAnalyses);
        
        // ChatAnalysis 저장
        analysis = chatAnalysisRepository.save(analysis);
        
        // 키워드 분석 결과 저장
        if (keywordAnalyses != null && !keywordAnalyses.isEmpty()) {
            for (KeywordAnalysis keyword : keywordAnalyses) {
                keyword.setChatAnalysis(analysis);
            }
            keywordAnalysisRepository.saveAll(keywordAnalyses);
        }
        
        // 저장된 엔티티 다시 조회하고 키워드 분석 결과 명시적 로드
        analysis = chatAnalysisRepository.findById(analysis.getId())
            .orElseThrow(() -> new RuntimeException("ChatAnalysis not found"));
        
        // 키워드 분석 결과 명시적 로드
        analysis.setKeywordAnalyses(keywordAnalyses);
//        analysis.getKeywordAnalyses().size();  // LAZY 로딩 트리거

        log.info("분석 결과 화면 response 생성");
        if(analysis.getKeywordAnalyses()==null){
            log.info("analysis keyword null");
        } else{
            log.info("analysis.getKeywordAnalyses().size = {}", analysis.getKeywordAnalyses().size());
        }
        return ChatAnalysisResponse.createChatAnalysisResponse(analysis, parsedMessages);
    }


    @Transactional(readOnly = true)
    public List<MyEvidenceResponse> getMyEvidence(Long userId, EvidenceFilterRequest filter) {
        if (userId == null) {
            return new ArrayList<>();
        }

        return evidenceRecordRepository.findByUserId(userId).stream()
                .filter(record -> filter.getCategory() == null ||
                        record.getCategory().equals(filter.getCategory()))
                .filter(record -> filter.getTitle() == null ||
                        record.getTitle().contains(filter.getTitle()))
                .sorted((r1, r2) -> {
                    int comparison = r1.getAnalysisDate().compareTo(r2.getAnalysisDate());
                    return "desc".equalsIgnoreCase(filter.getSortOrder()) ? -comparison : comparison;
                })
                .map(this::convertToMyEvidenceResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatAnalysisResponse getEvidenceDetail(Long evidenceId) {
        ChatAnalysis analysis = chatAnalysisRepository.findById(evidenceId)
                .orElseThrow(() -> new RuntimeException("채팅 분석 결과를 찾을 수 없습니다."));
        List<ChatMessage> chatMessages = chatMessageRepository.findByChatUpload(analysis.getChatUpload());
        return ChatAnalysisResponse.createChatAnalysisResponse(analysis, chatMessages);
    }

    private MyEvidenceResponse convertToMyEvidenceResponse(EvidenceRecord record) {
        MyEvidenceResponse response = new MyEvidenceResponse();
        response.setId(record.getId());
        response.setTitle(record.getTitle());

        MyEvidenceResponse.Report report = new MyEvidenceResponse.Report();
        report.setAnalyzedAt(record.getAnalysisDate());
        response.setReport(report);

        return response;
    }

    private GptAnalysisResponse generateGPTAnalysis(String gptResponse) {
        if (gptResponse == null || gptResponse.trim().isEmpty()) {
            log.error("GPT 응답이 비어있습니다.");
            return createDefaultGptAnalysis();
        }
        
        try {
            String[] lines = gptResponse.split("\n");
            String summary = extractSummary(lines);
            List<String> reasons = extractReasons(lines);
            
            log.info("추출된 요약: {}", summary);
            for (int i = 0; i < reasons.size(); i++) {
                log.info("{}번째 이유: {}", i + 1, reasons.get(i));
            }
            
            // validateGptResponse(summary, reasons);
            
            return GptAnalysisResponse.builder()
                .summary(summary)
                .reasons(reasons)
                .build();
        } catch (Exception e) {
            log.error("GPT 응답 파싱 중 오류 발생: {}", e.getMessage());
            return createDefaultGptAnalysis();
        }
    }

    private String extractSummary(String[] lines) {
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("요약:")) {
                String summary = line.substring(3).trim();
                // 중복된 요약이 있는지 확인
                if (summary.contains("요약:")) {
                    summary = summary.substring(summary.indexOf("요약:") + 3).trim();
                }
                return summary;
            }
        }
        return "";
    }

    private List<String> extractReasons(String[] lines) {
        List<String> reasons = new ArrayList<>();
        boolean isReasons = false;
        boolean foundSummary = false;

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            if (line.equals("이유:")) {
                isReasons = true;
                continue;
            }

            if (isReasons) {
                if (line.startsWith("-")) {
                    String reason = line.substring(1).trim();
                    // 중복된 이유가 있는지 확인
                    if (!reasons.contains(reason)) {
                        reasons.add(reason);
                    }
                } else if (line.startsWith("요약:") && !foundSummary) {
                    // 첫 번째 요약 섹션이 시작되면 이유 수집 중단
                    foundSummary = true;
                    break;
                }
            }
        }

        return reasons;
    }

    private void validateGptResponse(String summary, List<String> reasons) {
        if (summary.length() < 10) {
            throw new IllegalArgumentException("요약이 너무 짧습니다.");
        }
        
        if (reasons.size() < 2) {
            throw new IllegalArgumentException("이유가 충분하지 않습니다.");
        }
    }

    private GptAnalysisResponse createDefaultGptAnalysis() {
        return GptAnalysisResponse.builder()
            .summary("대화 분석 중 오류가 발생했습니다. 다시 시도해주세요.")
            .reasons(List.of(
                "분석 서비스 일시적 오류",
                "잠시 후 다시 시도해주세요"
            ))
            .build();
    }

    // chat analysis
    private ChatAnalysis createChatAnalysis(ChatUpload chatUpload, List<ChatMessage> messages, GptAnalysisResponse gptAnalysis, List<KeywordAnalysis> keywordAnalyses) {
        ChatAnalysis analysis = new ChatAnalysis();
        analysis.setChatUpload(chatUpload);
        analysis.setUser(chatUpload.getUser());
        analysis.setMessageCount(messages.size());
        analysis.setSummary(gptAnalysis.getSummary());
        analysis.setReasons(gptAnalysis.getReasons() != null ? gptAnalysis.getReasons() : new ArrayList<>());

        // 위험도 계산
        log.info("위험도 계산");
        RiskLevel roomRiskLevel = calculateRoomRiskLevel(messages, keywordAnalyses);
        analysis.setRoomRiskLevel(roomRiskLevel);

        // 지속 시간 계산
        log.info("지속 시간 계산");
        double duration = calculateDuration(messages);
        analysis.setDuration((int) duration);

        // 키워드 비율 계산
        log.info("키워드 비율 계산");
        double keyPhrasePercent = calculateKeyPhrasePercent(messages, keywordAnalyses);
        analysis.setKeyPhrasePercent((float) keyPhrasePercent);

        // 키워드 분석 결과 저장
        log.info("키워드 분석 결과 저장");
        if (keywordAnalyses != null && !keywordAnalyses.isEmpty()) {
            for (KeywordAnalysis keyword : keywordAnalyses) {
                keyword.setChatAnalysis(analysis);
            }
            keywordAnalysisRepository.saveAll(keywordAnalyses);
            log.info("analysis - 키워드 분석 결과 저장, 개수 : {}", analysis.getKeywordAnalyses().size());
        } else {
            log.info("키워드 분석 결과가 없습니다.");
        }
        
        return analysis;
    }

    private double calculateDuration(List<ChatMessage> messages) {
        if (messages.isEmpty()) {
            return 0.0;
        }

        ChatMessage firstMessage = messages.get(0);
        ChatMessage lastMessage = messages.get(messages.size() - 1);
        
        LocalDateTime startTime = firstMessage.getSentAt();
        LocalDateTime endTime = lastMessage.getSentAt();
        
        return ChronoUnit.MINUTES.between(startTime, endTime);
    }

    private double calculateKeyPhrasePercent(List<ChatMessage> messages, List<KeywordAnalysis> keywordAnalyses) {
        if (messages.isEmpty()) {
            return 0.0;
        }

        // 메시지 위험도 비율 계산 (70% 가중치)
        double messageRiskRatio = messages.stream()
            .filter(m -> m.getHighestRiskLevel() != RiskLevel.NORMAL)
            .count() / (double) messages.size();

        // 키워드 위험도 비율 계산 (30% 가중치)
        double keywordRiskRatio = 0.0;
        if (keywordAnalyses != null && !keywordAnalyses.isEmpty()) {
            int totalKeywords = keywordAnalyses.stream()
                .mapToInt(KeywordAnalysis::getCount)
                .sum();
            
            int highRiskKeywords = keywordAnalyses.stream()
                .filter(k -> k.getRisk() == RiskLevel.HIGH)
                .mapToInt(KeywordAnalysis::getCount)
                .sum();
            
            keywordRiskRatio = totalKeywords > 0 ? (double) highRiskKeywords / totalKeywords : 0.0;
        }

        // 가중 평균 계산 (메시지 70%, 키워드 30%)
        return (messageRiskRatio * 0.7 + keywordRiskRatio * 0.3) * 100;
    }

    private RiskLevel calculateRoomRiskLevel(List<ChatMessage> messages, List<KeywordAnalysis> keywordAnalyses) {
        if (messages.isEmpty()) {
            return RiskLevel.NORMAL;
        }

        // 메시지 위험도 점수 계산 (70% 가중치)
        double messageRiskScore = messages.stream()
            .mapToDouble(m -> {
                switch (m.getHighestRiskLevel()) {
                    case HIGH: return 1.0;
                    case MEDIUM: return 0.7;
                    case LOW: return 0.3;
                    default: return 0.0;
                }
            })
            .average()
            .orElse(0.0);

        // 키워드 위험도 점수 계산 (30% 가중치)
        double keywordRiskScore = 0.0;
        if (keywordAnalyses != null && !keywordAnalyses.isEmpty()) {
            int totalKeywords = keywordAnalyses.stream()
                .mapToInt(KeywordAnalysis::getCount)
                .sum();
            
            if (totalKeywords > 0) {
                keywordRiskScore = keywordAnalyses.stream()
                    .mapToDouble(k -> {
                        switch (k.getRisk()) {
                            case HIGH: return 1.0 * k.getCount();
                            case MEDIUM: return 0.7 * k.getCount();
                            case LOW: return 0.3 * k.getCount();
                            default: return 0.0;
                        }
                    })
                    .sum() / totalKeywords;
            }
        }

        // 가중 평균 계산
        double totalRiskScore = (messageRiskScore * 0.7 + keywordRiskScore * 0.3) * 100;

        // 위험도 레벨 결정
        if (totalRiskScore >= 70) {
            return RiskLevel.HIGH;
        } else if (totalRiskScore >= 40) {
            return RiskLevel.MEDIUM;
        } else if (totalRiskScore >= 20) {
            return RiskLevel.LOW;
        } else {
            return RiskLevel.NORMAL;
        }
    }

    private List<ChatMessage> parseChatMessages(String chatContent, ChatUpload chatUpload) {
        List<ChatMessage> parsedMessages = new ArrayList<>();
        ChatFormat chatFormat = detectChatFormat(chatContent);
        LocalDate currentDate = LocalDate.now();
        String[] lines = chatContent.split("\n");

        for (String line : lines) {
            if (line.trim().isEmpty()) continue;

            // PC 형식 메시지 파싱
            if (chatFormat == ChatFormat.PC) {
                Matcher pcMatcher = PC_MESSAGE_PATTERN.matcher(line);
                if (pcMatcher.find()) {
                    try {
                        ChatMessage message = new ChatMessage();
                        message.setSender(pcMatcher.group(1));

                        String timeStr = pcMatcher.group(2) + " " + pcMatcher.group(3);
                        LocalDateTime messageTime = parsePCDateTime(currentDate, timeStr);
                        message.setSentAt(messageTime);

                        String messageContent = pcMatcher.group(4).trim();
                        message.setMessage(messageContent);
                        message.setChatUpload(chatUpload);

                        parsedMessages.add(message);
                    } catch (Exception e) {
                        log.error("PC 메시지 파싱 오류: {} - {}", line, e.getMessage());
                    }
                }
            }

            // Mobile 형식 메시지 파싱
            if (chatFormat == ChatFormat.MOBILE) {
                Matcher mobileMatcher = MOBILE_MESSAGE_PATTERN.matcher(line);
                if (mobileMatcher.find()) {
                    try {
                        ChatMessage message = new ChatMessage();
                        message.setSender(mobileMatcher.group(3));

                        String dateTimeStr = mobileMatcher.group(1);
                        LocalDateTime messageTime = parseMobileDateTime(dateTimeStr);
                        message.setSentAt(messageTime);

                        String messageContent = mobileMatcher.group(4).trim();
                        message.setMessage(messageContent);
                        message.setChatUpload(chatUpload);

                        parsedMessages.add(message);
                    } catch (Exception e) {
                        log.error("모바일 메시지 파싱 오류: {} - {}", line, e.getMessage());
                    }
                }
            }
        }

        if (parsedMessages.isEmpty()) {
            log.warn("파싱된 메시지가 없습니다. 채팅 형식: {}", chatFormat);
        } else {
            log.info("총 {}개의 메시지가 파싱되었습니다. 채팅 형식: {}", parsedMessages.size(), chatFormat);
        }

        return parsedMessages;
    }

    private LocalDateTime parsePCDateTime(LocalDate date, String timeStr) {
        try {
            String[] parts = timeStr.split(" ");
            String amPm = parts[0];
            String time = parts[1];

            String[] timeParts = time.split(":");
            int hour = Integer.parseInt(timeParts[0]);
            int minute = Integer.parseInt(timeParts[1]);

            if (amPm.equals("오후") && hour != 12) {
                hour += 12;
            } else if (amPm.equals("오전") && hour == 12) {
                hour = 0;
            }

            return date.atTime(hour, minute);
        } catch (Exception e) {
            log.error("시간 파싱 오류: {} - {}", timeStr, e.getMessage());
            return LocalDateTime.now();
        }
    }

    private LocalDateTime parseMobileDateTime(String dateTimeStr) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy년 M월 d일 a h:mm", java.util.Locale.KOREAN);
            return LocalDateTime.parse(dateTimeStr, formatter);
        } catch (Exception e) {
            log.error("모바일 시간 파싱 오류: {} - {}", dateTimeStr, e.getMessage());
            return LocalDateTime.now();
        }
    }

    private ChatFormat detectChatFormat(String chatContent) {
        String[] lines = chatContent.split("\n");
        if (lines.length < 2) {
            log.warn("채팅 내용이 너무 짧습니다.");
            return ChatFormat.UNKNOWN;
        }

        // 첫 두 줄을 합쳐서 채팅방 정보 형식 확인
        String chatRoomInfo = lines[0] + "\n" + lines[1];

        if (PC_CHATROOM_INFO_PATTERN.matcher(chatRoomInfo).matches()) {
            log.info("PC 형식 채팅방 감지됨");
            return ChatFormat.PC;
        } else if (MOBILE_CHATROOM_INFO_PATTERN.matcher(chatRoomInfo).matches()) {
            log.info("모바일 형식 채팅방 감지됨");
            return ChatFormat.MOBILE;
        }

        log.warn("알 수 없는 채팅 형식입니다.");
        return ChatFormat.UNKNOWN;
    }

    private void validateAIAnalysis(AIAnalysisResponse aiResponse) {
        if (aiResponse == null || aiResponse.getMessages() == null) {
            throw new RuntimeException("AI 분석 결과가 유효하지 않습니다.");
        }
        
        // 분석 결과의 신뢰도 검증
        long validAnalyses = aiResponse.getMessages().stream()
            .filter(analysis -> 
                analysis.getRisks() != null && 
                !analysis.getRisks().isEmpty() &&
                analysis.getMessage() != null && 
                !analysis.getMessage().trim().isEmpty()
            )
            .count();
        
        if (validAnalyses == 0) {
            throw new RuntimeException("유효한 AI 분석 결과가 없습니다.");
        }
        
        log.info("AI 분석 결과 검증 완료: {}개의 유효한 분석 결과", validAnalyses);
    }

    /**
     * 특정 증거 자료를 PDF로 저장합니다.
     * @param userId 사용자 ID
     * @param evidenceId 증거 자료 ID
     * @param request PDF 생성 옵션
     * @return PDF가 생성된 증거 자료 정보
     */
    public EvidencePdfResponse generateEvidenceToPdf(Long userId, Long evidenceId, PdfGenerationRequest request) {
        EvidenceRecord evidence = evidenceRecordRepository.findById(evidenceId)
                .orElseThrow(() -> new RuntimeException("증거 자료를 찾을 수 없습니다."));
        
        // 권한 확인
        if (!evidence.getUser().getId().equals(userId)) {
            throw new RuntimeException("해당 증거 자료에 대한 접근 권한이 없습니다.");
        }

        return evidenceService.generateEvidenceToPdf(evidenceId, request);
    }

    /**
     * 채팅 분석 결과를 바로 PDF로 저장합니다.
     * @param chatAnalysisId 채팅 분석 ID
     * @param request PDF 생성 옵션
     * @return PDF가 생성된 증거 자료 정보
     */
    public EvidencePdfResponse createPdf(Long chatAnalysisId, PdfCreateRequest request) {
        ChatAnalysis chatAnalysis = chatAnalysisRepository.findById(chatAnalysisId)
                .orElseThrow(() -> new RuntimeException("채팅 분석 결과를 찾을 수 없습니다."));

        return evidenceService.createPdf(chatAnalysisId, request);
    }

    // AI 서버의 위험도 값을 RiskLevel enum으로 변환
    private RiskLevel convertToRiskLevel(String level) {
        try {
            // 대소문자 구분 없이 변환
            return RiskLevel.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("알 수 없는 위험도 레벨: {}, 기본값 NORMAL로 설정", level);
            return RiskLevel.NORMAL;
        }
    }

    // AI 서버의 위험 유형을 ChatMessage.RiskType enum으로 변환
    private RiskType convertToRiskType(String type) {
        try {
            // 한글 위험 유형을 enum으로 변환
            switch (type) {
//                case "성적": return RiskType.SEXUAL;
//                case "스토킹": return RiskType.STALKING;
//                case "강요": return RiskType.COERCION;
//                case "협박": return RiskType.THREAT;
//                case "개인정보": return RiskType.PERSONAL_INFO;
//                case "차별": return RiskType.DISCRIMINATION;
//                case "모욕": return RiskType.INSULT;
//                case "거절": return RiskType.REJECTION;
//                case "일반": return RiskType.NORMAL;
                case "SEXUAL": return RiskType.SEXUAL;
                case "STALKING": return RiskType.STALKING;
                case "COERCION": return RiskType.COERCION;
                case "THREAT": return RiskType.THREAT;
                case "PERSONAL_INFO": return RiskType.PERSONAL_INFO;
                case "DISCRIMINATION": return RiskType.DISCRIMINATION;
                case "INSULT": return RiskType.INSULT;
                case "REJECTION": return RiskType.REJECTION;
                case "NORMAL": return RiskType.NORMAL;
                default:
                    log.warn("알 수 없는 위험 유형: {}, 기본값 NORMAL로 설정", type);
                    return RiskType.NORMAL;
            }
        } catch (Exception e) {
            log.warn("위험 유형 변환 중 오류 발생: {}, 기본값 NORMAL로 설정", e.getMessage());
            return RiskType.NORMAL;
        }
    }

    private void analyzeMessages(List<ChatMessage> messages, AIAnalysisResponse aiResponse) {
        if (messages.isEmpty() || aiResponse == null || aiResponse.getMessages() == null) {
            return;
        }

        Map<String, ChatMessage> messageMap = messages.stream()
            .collect(Collectors.toMap(ChatMessage::getMessage, message -> message));

        for (AIAnalysisResponse.MessageAnalysis analysis : aiResponse.getMessages()) {
            ChatMessage message = messageMap.get(analysis.getMessage());
            if (message != null && analysis.getRisks() != null && !analysis.getRisks().isEmpty()) {
                MessageRisk risk = analysis.getRisks().get(0);
                try {
                    RiskLevel riskLevel = convertToRiskLevel(risk.getLevel());
                    RiskType riskType = convertToRiskType(risk.getType());
                    
                    // 기존 위험도 제거 후 새로운 위험도 설정
                    message.getRisks().clear();
                    message.addRisk(riskType, riskLevel, "AI 분석 결과");

                    // 거부 메시지 발견 시 이전 메시지의 위험도 상향 조정
                    if (riskType == RiskType.REJECTION && message.getSender().equals("윤정")) {
                        int messageIndex = messages.indexOf(message);
                        if (messageIndex > 0) {
                            ChatMessage previousMessage = messages.get(messageIndex - 1);
                            RiskLevel currentLevel = previousMessage.getHighestRiskLevel();
                            RiskLevel newLevel = switch (currentLevel) {
                                case NORMAL -> RiskLevel.LOW;
                                case LOW -> RiskLevel.MEDIUM;
                                case MEDIUM -> RiskLevel.HIGH;
                                default -> currentLevel;
                            };
                            previousMessage.getRisks().clear();
                            previousMessage.addRisk(RiskType.COERCION, newLevel, "거부 메시지로 인한 위험도 상향 조정");
                        }
                    }
                } catch (Exception e) {
                    log.warn("위험도 설정 중 오류 발생: {}, 기본값 NORMAL로 설정", e.getMessage());
                    message.getRisks().clear();
                    message.addRisk(RiskType.NORMAL, RiskLevel.NORMAL, "기본 위험도 설정");
                }
            }
        }
    }
}
