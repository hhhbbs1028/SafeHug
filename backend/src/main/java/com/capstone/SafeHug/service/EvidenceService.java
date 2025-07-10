package com.capstone.SafeHug.service;

import com.capstone.SafeHug.dto.common.OutputOptions;
import com.capstone.SafeHug.dto.common.Signature;
import com.capstone.SafeHug.dto.common.IncidentDate;
import com.capstone.SafeHug.dto.request.EvidenceCreateRequest;
import com.capstone.SafeHug.dto.request.PdfCreateRequest;
import com.capstone.SafeHug.dto.response.evidence.EvidencePdfResponse;
import com.capstone.SafeHug.dto.response.evidence.EvidenceResponse;
import com.capstone.SafeHug.dto.request.PdfGenerationRequest;
import com.capstone.SafeHug.entity.ChatAnalysis;
import com.capstone.SafeHug.entity.EvidenceRecord;
import com.capstone.SafeHug.entity.EvidencePdf;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.entity.KeywordAnalysis;
import com.capstone.SafeHug.repository.ChatAnalysisRepository;
import com.capstone.SafeHug.repository.EvidenceRecordRepository;
import com.capstone.SafeHug.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.capstone.SafeHug.exception.ValidationException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EvidenceService {
    private final EvidenceRecordRepository evidenceRecordRepository;
    private final UserRepository userRepository;
    private final ChatAnalysisRepository chatAnalysisRepository;
    private final PdfGeneratorService pdfGeneratorService;
    private static final Logger log = LoggerFactory.getLogger(EvidenceService.class);

    public List<EvidenceResponse> getAllEvidence() {
        return evidenceRecordRepository.findAll().stream()
                .map(this::convertToEvidenceResponse)
                .collect(Collectors.toList());
    }

    public EvidenceResponse getEvidenceById(Long id) {
        EvidenceRecord evidenceRecord = findEvidenceRecordById(id);
        return convertToEvidenceResponse(evidenceRecord);
    }

    public List<EvidenceResponse> getEvidenceByUserId(Long userId) {
        validateUserExists(userId);
        return evidenceRecordRepository.findByUserId(userId).stream()
                .map(this::convertToEvidenceResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EvidenceResponse createEvidence(Long chatAnalysisId, EvidenceCreateRequest request) {
        try {
            log.info("증거자료 생성 시작 - chatAnalysisId: {}, request: {}", chatAnalysisId, request);
            
            // 사용자 확인
            User currentUser = findCurrentUser();
            log.info("현재 사용자 확인 완료 - userId: {}", currentUser.getId());
            
            // 채팅 분석 결과 확인
            ChatAnalysis chatAnalysis = findChatAnalysisById(chatAnalysisId);
            log.info("채팅 분석 결과 확인 완료 - chatAnalysisId: {}", chatAnalysisId);
            
            // 이미 증거 자료가 있는지 확인
            if (evidenceRecordRepository.existsByChatAnalysisId(chatAnalysisId)) {
                log.warn("이미 증거자료가 존재함 - chatAnalysisId: {}", chatAnalysisId);
                throw new ValidationException("이미 증거자료가 존재합니다.");
            }
            
            // 증거자료 생성
            EvidenceRecord evidenceRecord = createEvidenceRecord(currentUser, request, chatAnalysis);
            log.info("증거자료 생성 완료 - evidenceId: {}", evidenceRecord.getId());
            
            return convertToEvidenceResponse(evidenceRecord);
        } catch (ValidationException e) {
            log.error("증거자료 생성 실패 - 유효성 검증 오류: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("증거자료 생성 실패 - 예상치 못한 오류: {}", e.getMessage(), e);
            throw new RuntimeException("증거자료 저장 중 오류가 발생했습니다.", e);
        }
    }

    @Transactional
    public EvidencePdfResponse createPdf(Long evidenceId, PdfCreateRequest request) {
        EvidenceRecord evidenceRecord = findEvidenceRecordById(evidenceId);
        
        // 기존 PDF가 있다면 삭제
        if (evidenceRecord.getEvidencePdf() != null) {
            evidenceRecord.setEvidencePdf(null);
        }

        // PDF 생성
        EvidencePdf evidencePdf = createEvidencePdf(evidenceRecord, request.getOutputOptions(), request.getSignature());
        String pdfPath = pdfGeneratorService.generatePdf(evidenceRecord, evidencePdf);
        evidenceRecord.setEvidencePdf(evidencePdf);
        evidenceRecordRepository.save(evidenceRecord);
        return EvidencePdfResponse.success(pdfPath);
    }

    @Transactional
    public EvidencePdfResponse generateEvidenceToPdf(Long id, PdfGenerationRequest request) {
        EvidenceRecord evidenceRecord = findEvidenceRecordById(id);
        EvidencePdf evidencePdf = createEvidencePdf(evidenceRecord, request.getOutputOptions(), request.getSignature());
        String pdfPath = pdfGeneratorService.generatePdf(evidenceRecord, evidencePdf);
        return EvidencePdfResponse.success(pdfPath);
    }

    private EvidenceRecord findEvidenceRecordById(Long id) {
        return evidenceRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evidence not found with id: " + id));
    }

    private ChatAnalysis findChatAnalysisById(Long id) {
        return chatAnalysisRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chat analysis not found with id: " + id));
    }

    private ChatAnalysis findChatAnalysisByChatUploadId(Long chatUploadId){
        return chatAnalysisRepository.findByChatUploadId(chatUploadId)
                .orElseThrow(() -> new RuntimeException("Chat analysis not found with chat upload id: " + chatUploadId));

    }

    private User findCurrentUser() {
        // SecurityContext에서 현재 인증된 사용자 정보를 가져옵니다
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("인증되지 않은 사용자입니다.");
        }
        
        String username = authentication.getName();
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));
    }

    private void validateUserExists(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    private EvidenceRecord createEvidenceRecord(User user, EvidenceCreateRequest request, ChatAnalysis chatAnalysis) {
        try {
            log.info("증거자료 엔티티 생성 시작");
            EvidenceRecord evidenceRecord = new EvidenceRecord();
            evidenceRecord.setUser(user);
            evidenceRecord.setChatAnalysis(chatAnalysis);
            evidenceRecord.setTitle(request.getTitle());
            evidenceRecord.setCategory(request.getCategory().get(0));
            evidenceRecord.setTags(convertListToJson(request.getTags()));
            evidenceRecord.setIncidentStartDate(request.getIncidentDate().getStart().atStartOfDay());
            evidenceRecord.setIncidentEndDate(request.getIncidentDate().getEnd().atStartOfDay());
            evidenceRecord.setIncidentTime(request.getIncidentTime());
            evidenceRecord.setLocation(request.getLocation());
            evidenceRecord.setOffenderInfo(request.getOffenderInfo());
            evidenceRecord.setWitnesses(convertListToJson(request.getWitnesses()));
            evidenceRecord.setEmotions(convertListToJson(request.getEmotions()));
            evidenceRecord.setOtherEmotion(request.getOtherEmotion());
            evidenceRecord.setDetails(request.getDetails());
            evidenceRecord.setAnalysisDate(LocalDateTime.now());
            
            log.info("증거자료 엔티티 생성 완료");
            return evidenceRecordRepository.save(evidenceRecord);
        } catch (Exception e) {
            log.error("증거자료 엔티티 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("증거자료 생성 중 오류가 발생했습니다.", e);
        }
    }

    private String convertListToJson(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        try {
            return new ObjectMapper().writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 중 오류가 발생했습니다.", e);
        }
    }

    private EvidenceRecord createEvidenceRecord(ChatAnalysis chatAnalysis, PdfCreateRequest request) {
        EvidenceRecord evidenceRecord = new EvidenceRecord();
        evidenceRecord.setChatAnalysis(chatAnalysis);
        evidenceRecord.setTitle(request.getTitle());
        evidenceRecord.setCategory(request.getCategory().get(0));
        evidenceRecord.setTags(String.join(",", request.getTags()));
        evidenceRecord.setIncidentStartDate(request.getIncidentDate().getStart().atStartOfDay());
        evidenceRecord.setIncidentEndDate(request.getIncidentDate().getEnd().atStartOfDay());
        evidenceRecord.setIncidentTime(request.getIncidentTime());
        evidenceRecord.setLocation(request.getLocation());
        evidenceRecord.setOffenderInfo(request.getOffenderInfo());
        evidenceRecord.setWitnesses(String.join(",", request.getWitnesses()));
        evidenceRecord.setEmotions(String.join(",", request.getEmotions()));
        evidenceRecord.setOtherEmotion(request.getOtherEmotion());
        evidenceRecord.setDetails(request.getDetails());
        evidenceRecord.setAnalysisDate(LocalDateTime.now());

        return evidenceRecordRepository.save(evidenceRecord);
    }

    private EvidencePdf createEvidencePdf(EvidenceRecord evidenceRecord, OutputOptions outputOptions, Signature signature) {
        EvidencePdf evidencePdf = new EvidencePdf();
        evidencePdf.setEvidenceRecord(evidenceRecord);
        evidencePdf.setIncludeCover(outputOptions.isIncludeCover());
        evidencePdf.setIncludeToc(outputOptions.isIncludeToc());
        evidencePdf.setIncludeMessages(outputOptions.isIncludeMessages());
        evidencePdf.setPageNumbering(outputOptions.isPageNumbering());

        EvidencePdf.Signature pdfSignature = new EvidencePdf.Signature();
        pdfSignature.setSignedAt(signature.getSignedAt());
        pdfSignature.setSignedBy(signature.getSignedBy());
        pdfSignature.setHashAlgorithm(EvidencePdf.HashAlgorithm.SHA256);
        pdfSignature.setSignatureAlgorithm(EvidencePdf.SignatureAlgorithm.SHA256WithRSA);
        evidencePdf.setSignature(pdfSignature);

        evidencePdf.setOrientation(EvidencePdf.Orientation.valueOf(outputOptions.getOrientation().name()));
        evidencePdf.setMaskingOption(outputOptions.isMaskingOption());
        evidencePdf.setPdfCreatedAt(LocalDateTime.now());
        return evidencePdf;
    }

    private EvidenceResponse convertToEvidenceResponse(EvidenceRecord evidenceRecord) {
        EvidenceResponse response = new EvidenceResponse();
        response.setStatus("success");
        response.setEvidenceId(String.format("evi_%s_%03d", 
            evidenceRecord.getAnalysisDate().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
            evidenceRecord.getId()));
        
        // 상세 정보 설정
        Map<String, Object> details = new HashMap<>();
        details.put("title", evidenceRecord.getTitle());
        details.put("category", evidenceRecord.getCategory());
        details.put("tags", evidenceRecord.getTags() != null ? 
            Arrays.asList(evidenceRecord.getTags().split(",")) : new ArrayList<>());
        details.put("incidentStartDate", evidenceRecord.getIncidentStartDate());
        details.put("incidentEndDate", evidenceRecord.getIncidentEndDate());
        details.put("incidentTime", evidenceRecord.getIncidentTime());
        details.put("location", evidenceRecord.getLocation());
        details.put("offenderInfo", evidenceRecord.getOffenderInfo());
        details.put("witnesses", evidenceRecord.getWitnesses() != null ? 
            Arrays.asList(evidenceRecord.getWitnesses().split(",")) : new ArrayList<>());
        details.put("emotions", evidenceRecord.getEmotions() != null ? 
            Arrays.asList(evidenceRecord.getEmotions().split(",")) : new ArrayList<>());
        details.put("otherEmotion", evidenceRecord.getOtherEmotion());
        details.put("details", evidenceRecord.getDetails());
        details.put("analysisDate", evidenceRecord.getAnalysisDate());
        
        // ChatAnalysis 데이터 설정
        ChatAnalysis chatAnalysis = evidenceRecord.getChatAnalysis();
        if (chatAnalysis != null) {
            // 메시지 데이터 설정
            details.put("messages", chatAnalysis.getChatUpload() != null ?
                chatAnalysis.getChatUpload().getChatMessages() : new ArrayList<>());

            // 리포트 데이터 설정
            Map<String, Object> report = new HashMap<>();
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalMessages", chatAnalysis.getMessageCount());
            summary.put("dangerMessages", 0); // TODO: 위험 메시지 수 계산 로직 추가
            summary.put("duration", chatAnalysis.getDuration());
            summary.put("keyPhrasePercent", chatAnalysis.getKeyPhrasePercent());
            summary.put("mainTypes", new ArrayList<>()); // TODO: 주요 유형 데이터 추가
            summary.put("analyzedAt", chatAnalysis.getCreatedAt());

            Map<String, Object> aiRisk = new HashMap<>();
            aiRisk.put("level", chatAnalysis.getRoomRiskLevel().name());
            Map<String, Object> aiRiskDescription = new HashMap<>();
            aiRiskDescription.put("summary", chatAnalysis.getSummary());
            aiRiskDescription.put("reasons", chatAnalysis.getReasons());
            aiRisk.put("description", aiRiskDescription);

            report.put("summary", summary);
            report.put("aiRisk", aiRisk);
            report.put("guides", new ArrayList<>()); // TODO: 가이드 데이터 추가
            report.put("riskCalendar", new ArrayList<>()); // TODO: 위험 캘린더 데이터 추가
            report.put("keywords", chatAnalysis.getKeywordAnalyses().stream()
                .map(KeywordAnalysis::getKeyword)
                .collect(Collectors.toList()));

            details.put("report", report);
            details.put("roomRiskLevel", chatAnalysis.getRoomRiskLevel().name());
        } else {
            // ChatAnalysis가 없는 경우 기본값 설정
            details.put("messages", new ArrayList<>());
            details.put("report", new HashMap<>());
            details.put("roomRiskLevel", "NORMAL");
        }

        response.setDetails(details);
        response.setMessage("증거 정보를 성공적으로 조회했습니다.");
        return response;
    }
}