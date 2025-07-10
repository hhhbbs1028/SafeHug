package com.capstone.SafeHug.dto.response.chat;

import com.capstone.SafeHug.common.RiskLevel;
import com.capstone.SafeHug.common.RiskType;
import com.capstone.SafeHug.dto.common.*;
import com.capstone.SafeHug.dto.response.evidence.MyEvidenceResponse;
import com.capstone.SafeHug.entity.ChatAnalysis;
import com.capstone.SafeHug.entity.ChatMessage;
import com.capstone.SafeHug.entity.ChatUpload;
import com.capstone.SafeHug.entity.KeywordAnalysis;
import com.capstone.SafeHug.entity.Risk;
import com.capstone.SafeHug.repository.ChatAnalysisRepository;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static java.lang.String.valueOf;

@Slf4j
@Getter
@Setter
public class ChatAnalysisResponse {
    private ChatReport report;        // 전체 분석 보고서
    private List<MessageInfo> messages;  // 개별 메시지 정보 목록
    private Long id;
    private RiskLevel roomRiskLevel;
    private int messageCount;
    private int duration;
    private float keyPhrasePercent;


    @Getter
    @Setter
    public static class MessageInfo {
        private Long id;          // 메시지 ID
        private String sender;    // 발신자
        private String date;      // 날짜 (YYYY-MM-DD)
        private String time;      // 시간 (HH:mm:ss)
        private String content;   // 메시지 내용
        private List<MessageRisk> risks; // 위험 정보 목록
    }


    public static ChatAnalysisResponse createChatAnalysisResponse(
            ChatAnalysis analysis, List<ChatMessage> messages) {

        ChatAnalysisResponse response = new ChatAnalysisResponse();
        ChatReport report = new ChatReport();
        report.setAnalyzedAt(analysis.getCreatedAt());

        // response - report 설정
        report.setRiskCalendar(createRiskCalendar(messages));
        report.setKeywords(createKeywords(analysis));
        report.setAiRisk(createAiRisk(analysis));

        log.info("createSummary");
        Summary summary = createSummary(messages);
        log.info("createGuides");
        report.setGuides(createGuides(summary));
        log.info("setSummary");
        report.setSummary(summary);

        // response 설정
        log.info("setReport");
        response.setReport(report);
        log.info("createMessageInfos");
        response.setMessages(createMessageInfos(messages));
        response.setId(analysis.getId());
        response.setRoomRiskLevel(analysis.getRoomRiskLevel());
        response.setMessageCount(analysis.getMessageCount());
        response.setDuration(analysis.getDuration());
        response.setKeyPhrasePercent(analysis.getKeyPhrasePercent());
        return response;
    }


    private static AiRisk createAiRisk(ChatAnalysis analysis) {
        AiRisk aiRisk = new AiRisk();
        AiRisk.RiskDescription riskDescription = new AiRisk.RiskDescription();
        riskDescription.setSummary(analysis.getSummary());
        riskDescription.setReasons(analysis.getReasons());
        aiRisk.setDescription(riskDescription);

        aiRisk.setLevel(valueOf(analysis.getRoomRiskLevel()));

        return aiRisk;
    }
//
//    public static MyEvidenceResponse createMyEvidenceResponse(ChatAnalysis analysis, List<ChatMessage> messages) {
//        MyEvidenceResponse response = new MyEvidenceResponse();
//        response.setId(analysis.getId());
//
//        Report report = new Report();
//        report.setAnalyzedAt(analysis.getCreatedAt());
//        report.setSummary(createSummary(messages));
//        response.setReport(report);
//        return response;
//    }

    private static List<Keyword> createKeywords(ChatAnalysis analysis) {
        List<KeywordAnalysis> keywordAnalyses = analysis.getKeywordAnalyses();
        log.info("entity keyword : {}", keywordAnalyses);
        
        if (keywordAnalyses == null || keywordAnalyses.isEmpty()) {
            log.info("키워드 분석 결과가 없습니다.");
            return new ArrayList<>();
        }
        
        List<Keyword> keywords = keywordAnalyses.stream()
            .map(keywordAnalysis -> {
                Keyword keyword = new Keyword();
                keyword.setKeyword(keywordAnalysis.getKeyword());
                keyword.setCount(keywordAnalysis.getCount());
                keyword.setRisk(keywordAnalysis.getRisk());
                return keyword;
            })
            .collect(Collectors.toList());
            
        log.info("dto keyword : {}", keywords);
        return keywords;
    }

    private static Summary createSummary(List<ChatMessage> messages) {
        Summary summary = new Summary();
        summary.setTotalMessages(messages.size());
        
        // 위험 메시지 수 계산 (HIGH, MEDIUM, LOW 위험도 포함)
        int dangerMessages = (int) messages.stream()
            .filter(m -> m.getHighestRiskLevel() != RiskLevel.NORMAL)
            .count();
        summary.setDangerMessages(dangerMessages);
        
        // 주요 위험 유형 계산
        summary.setMainTypes(createMainTypes(messages));
        
        return summary;
    }

    private static int countDangerMessages(List<ChatMessage> messages) {
        return (int) messages.stream()
                .filter(m -> m.getHighestRiskLevel() == RiskLevel.HIGH)
                .count();
    }

    private static List<MainType> createMainTypes(List<ChatMessage> messages) {
        Map<RiskType, Map.Entry<Integer, RiskLevel>> riskTypeMap = messages.stream()
                .flatMap(message -> message.getRisks().stream())
                .filter(risk -> risk.getRiskLevel() != RiskLevel.NORMAL)
                .collect(Collectors.groupingBy(
                        Risk::getRiskType,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    int count = list.size();
                                    RiskLevel maxRisk = list.stream()
                                            .map(Risk::getRiskLevel)
                                            .max(Comparator.naturalOrder())
                                            .orElse(RiskLevel.NORMAL);
                                    return Map.entry(count, maxRisk);
                                }
                        )
                ));

        return riskTypeMap.entrySet().stream()
                .map(entry -> {
                    MainType mainType = new MainType();
                    mainType.setType(entry.getKey().toString());
                    mainType.setLevel(entry.getValue().getValue().toString());
                    mainType.setCount(entry.getValue().getKey());
                    return mainType;
                })
                .toList();
    }

    private static List<RiskCalendar> createRiskCalendar(List<ChatMessage> messages) {
        Map<LocalDate, RiskLevel> dateRiskMap = messages.stream()
                .flatMap(message -> message.getRisks().stream()
                        .map(risk -> Map.entry(message.getSentAt().toLocalDate(), risk.getRiskLevel())))
                .filter(entry -> entry.getValue() != RiskLevel.NORMAL)
                .collect(Collectors.groupingBy(
                    Map.Entry::getKey,
                    Collectors.collectingAndThen(
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList()),
                        risks -> risks.stream()
                            .max(Enum::compareTo)
                            .orElse(RiskLevel.NORMAL)
                    )
                ));

        return dateRiskMap.entrySet().stream()
                .map(entry -> {
                    RiskCalendar calendar = new RiskCalendar();
                    calendar.setDate(entry.getKey().toString());
                    calendar.setLevel(entry.getValue().getDisplayName());
                    return calendar;
                })
                .toList();
    }

    public static List<Guide> createGuides(Summary summary) {
        List<Guide> guides = new ArrayList<>();

        // mainTypes를 통해 Guide 생성
        for (MainType mainType : summary.getMainTypes()) {
            Guide guide = new Guide();

            String type = mainType.getType();
            String level = mainType.getLevel();

            log.info("타입 : {}, 레벨 : {}", type, level);
            guide.setType(RiskType.valueOf(type));
            guide.setLevel(RiskLevel.valueOf(level));
            guide.setAdvice(getAdviceForRiskType(type));
            guides.add(guide);
        }

        return guides;
    }

    private static List<MessageInfo> createMessageInfos(List<ChatMessage> messages) {
        return messages.stream()
                .map(message -> {
                    MessageInfo messageInfo = new MessageInfo();
                    messageInfo.setId(message.getId());
                    messageInfo.setSender(message.getSender());
                    messageInfo.setDate(message.getSentAt().toLocalDate().toString());
                    messageInfo.setTime(message.getSentAt().toLocalTime().toString());
                    messageInfo.setContent(message.getMessage());
                    messageInfo.setRisks(createMessageRisks(message));
                    return messageInfo;
                })
                .toList();
    }

    private static List<MessageRisk> createMessageRisks(ChatMessage message) {
        return message.getRisks().stream()
                .map(risk -> {
                    MessageRisk messageRisk = new MessageRisk();
                    messageRisk.setType(risk.getRiskType().toString());
                    messageRisk.setLevel(risk.getRiskLevel().toString());
                    return messageRisk;
                })
                .toList();
    }

    /**
     * 위험 유형에 따른 구체적인 조언 목록을 반환
     * 
     * @param riskType 위험 유형
     * @return 해당 위험 유형에 대한 조언 목록
     */

    private static List<String> getAdviceForRiskType(String riskType) {
        return switch (riskType) {
            case "SEXUAL" -> List.of(
                    "해당 발언은 성적 수치심을 유발할 수 있는 표현입니다.",
                    "반복되거나 노골적인 경우, 성희롱/성폭력에 해당될 수 있으므로 대화를 중단하고 증거를 확보하세요.",
                    "필요 시 법률 상담 또는 여성긴급전화 1366에 연락하는 것을 권장합니다."
            );
            case "STALKING" -> List.of(
                    "특정 인물이 반복적으로 위치, 사생활, 일정을 묻거나 따라다니는 발언은 스토킹 범죄로 간주될 수 있습니다.",
                    "의도적으로 거리를 두고, 대화 기록을 보관해 두세요.",
                    "위험하다고 느껴진다면 경찰에 즉시 신고하거나 안전한 장소로 이동하세요."
            );
            case "COERCION" -> List.of(
                    "상대가 반복적으로 원치 않는 행동을 하도록 강요하는 경우, 이는 의사 강요 및 협박에 해당될 수 있습니다.",
                    "\"싫다\"는 의사를 명확히 표현하고, 강요가 지속된다면 대화를 중단하세요.",
                    "특히 관계에서의 심리적 압박은 장기적으로 해로우며, 필요한 경우 상담 기관에 도움을 요청하세요."
            );
            case "THREAT" -> List.of(
                    "해당 표현은 명백한 협박 발언일 수 있으며, 형법상 범죄로 간주될 수 있습니다.",
                    "위협이 현실화될 가능성이 있다면 대화 내용을 저장하고 즉시 경찰에 신고하세요.",
                    "신변 보호 요청도 가능하니 가까운 경찰서나 관련 기관에 문의하세요."
            );
            case "PERSONAL_INFO" -> List.of(
                    "사용자의 실명, 주소, 사진, SNS 계정 등 개인정보가 노출되었거나 위협받고 있습니다.",
                    "개인정보 유출은 법적으로 보호받을 수 있으며, 상대가 이를 악용할 경우 형사처벌 대상이 됩니다.",
                    "가능한 빠르게 캡처 및 로그를 저장하고 관련 기관에 신고하세요."
            );
            case "DISCRIMINATION" -> List.of(
                    "성별, 나이, 출신, 외모 등을 이유로 차별하거나 편견을 드러내는 표현은 사회적으로도 용인될 수 없는 언어폭력입니다.",
                    "불쾌감을 느낀다면 대화를 멈추고, 신뢰할 수 있는 기관에 신고하거나 상담을 받아보세요.",
                    "반복적 차별은 정서적 학대가 될 수 있습니다."
            );
            case "INSULT" -> List.of(
                    "상대의 발언은 인격을 훼손하거나 비하하는 표현일 수 있습니다.",
                    "모욕죄는 형법상 고소 가능한 범죄로 분류되며, 증거가 될 수 있는 로그를 보관하는 것이 중요합니다.",
                    "감정적으로 반응하기보다, 객관적인 증거 확보 후 대응하세요."
            );
            case "REJECTION" -> List.of(
                    "사용자 또는 상대방이 거절 의사를 명확히 표현했음에도 불구하고 이를 무시하는 경우, 심리적 압박이나 위협이 될 수 있습니다.",
                    "\"아니오\"라는 의사는 존중되어야 하며, 반복적으로 무시된다면 그 자체로 위험 신호입니다.",
                    "계속적인 대화 요구나 집착은 스토킹으로 확장될 수 있으니 주의하세요."
            );
            default -> List.of(
                    "현재 대화는 특별한 위험 요소 없이 정상적인 수준의 언어로 판단됩니다.",
                    "다만, 감정적 피로감이나 불편함이 느껴진다면 잠시 대화를 쉬어가는 것도 좋은 선택입니다.",
                    "언제든지 도움이 필요하면 심리상담, 온라인 지원 서비스 등을 활용하세요."
            );
        };
    }
} 