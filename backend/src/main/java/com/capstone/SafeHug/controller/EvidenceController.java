package com.capstone.SafeHug.controller;

import com.capstone.SafeHug.dto.request.EvidenceCreateRequest;
import com.capstone.SafeHug.dto.request.PdfCreateRequest;
import com.capstone.SafeHug.dto.request.evidence.EvidenceFilterRequest;
import com.capstone.SafeHug.dto.response.evidence.EvidencePdfResponse;
import com.capstone.SafeHug.dto.response.evidence.EvidenceResponse;
import com.capstone.SafeHug.dto.request.PdfGenerationRequest;
import com.capstone.SafeHug.dto.response.ApiResponse;
import com.capstone.SafeHug.service.EvidenceService;
import com.capstone.SafeHug.service.JwtService;
import com.capstone.SafeHug.service.UserService;
import com.capstone.SafeHug.exception.EvidenceNotFoundException;
import com.capstone.SafeHug.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.capstone.SafeHug.exception.UserNotFoundException;
import org.springframework.http.HttpStatus;

/**
 * 증거 자료 관리를 위한 컨트롤러
 * 증거 자료의 생성, 조회, PDF 생성 등의 기능을 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
public class EvidenceController {
    private final EvidenceService evidenceService;
    private final JwtService jwtService;
    private final UserService userService;

    /**
     * 내 증거함에 저장
     * @param chatAnalysisId 채팅 분석 ID
     * @param request 증거 자료 생성 요청 데이터
     * @return 생성된 증거 자료 정보
     */
    @PostMapping("/{chatAnalysisId}")
    public ResponseEntity<ApiResponse<EvidenceResponse>> createEvidence(
            @PathVariable Long chatAnalysisId,
            @RequestBody EvidenceCreateRequest request) {
        try {
            log.info("증거 자료 생성 요청 - chatAnalysisId: {}, request: {}", chatAnalysisId, request);
            EvidenceResponse response = evidenceService.createEvidence(chatAnalysisId, request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (ValidationException e) {
            log.error("증거 자료 생성 실패 - 유효성 검증 오류: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("증거 자료 생성에 실패했습니다.", "VALIDATION_ERROR"));
        } catch (Exception e) {
            log.error("증거 자료 생성 실패 - 서버 오류: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("증거 자료 생성 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR"));
        }
    }

    /**
     * 증거 자료를 PDF로 변환하여 저장
     * @param evidenceId 증거 ID
     * @param request PDF 생성 요청 데이터
     * @return PDF가 생성된 증거 자료 정보
     */
    @PostMapping("/{evidenceId}/pdf")
    public ResponseEntity<ApiResponse<EvidencePdfResponse>> convertEvidenceToPdf(
            @PathVariable Long evidenceId,
            @RequestBody PdfGenerationRequest request) {
        try {
            log.info("PDF 변환 시작 - evidenceId: {}", evidenceId);
            EvidencePdfResponse response = evidenceService.generateEvidenceToPdf(evidenceId, request);
            log.info("PDF 변환 완료");
            return ResponseEntity.ok(ApiResponse.success("PDF가 생성되었습니다.", response));
        } catch (EvidenceNotFoundException e) {
            log.error("PDF 변환 실패 - 증거 자료를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (ValidationException e) {
            log.error("PDF 변환 실패 - 유효성 검증 오류", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("PDF 생성에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("PDF 변환 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("PDF 생성 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    /**
     * 모든 증거 자료 목록을 조회합니다.
     * @return 증거 자료 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EvidenceResponse>>> getAllEvidence() {
        try {
            log.info("모든 증거 자료 조회 시작");
            List<EvidenceResponse> response = evidenceService.getAllEvidence();
            log.info("모든 증거 자료 조회 완료 - 개수: {}", response.size());
            return ResponseEntity.ok(ApiResponse.success("증거 자료 목록을 조회했습니다.", response));
        } catch (Exception e) {
            log.error("증거 자료 목록 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("증거 자료 목록 조회 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    /**
     * 특정 ID의 증거 자료를 조회합니다.
     * @param id 증거 자료 ID
     * @return 증거 자료 정보
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvidenceResponse>> getEvidenceById(@PathVariable Long id) {
        try {
            log.info("증거 자료 조회 시작 - evidenceId: {}", id);
            EvidenceResponse response = evidenceService.getEvidenceById(id);
            log.info("증거 자료 조회 완료");
            return ResponseEntity.ok(ApiResponse.success("증거 자료를 조회했습니다.", response));
        } catch (EvidenceNotFoundException e) {
            log.error("증거 자료 조회 실패 - 증거 자료를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("증거 자료 조회 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("증거 자료 조회 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    /**
     * 현재 로그인한 사용자의 증거 자료 목록을 조회합니다.
     * @param filter 필터링 및 정렬 조건
     * @return 사용자의 증거 자료 목록
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<EvidenceResponse>>> getMyEvidence(
            @ModelAttribute EvidenceFilterRequest filter) {
        try {
            log.info("내 증거 자료 목록 조회 시작");
            List<EvidenceResponse> response = evidenceService.getEvidenceByUserId(getCurrentUserId());
            log.info("내 증거 자료 목록 조회 완료 - 개수: {}", response.size());
            return ResponseEntity.ok(ApiResponse.success("증거 자료 목록을 조회했습니다.", response));
        } catch (UserNotFoundException e) {
            log.error("내 증거 자료 목록 조회 실패 - 사용자를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (ValidationException e) {
            log.error("내 증거 자료 목록 조회 실패 - 유효성 검증 오류", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("증거 자료 목록 조회에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("내 증거 자료 목록 조회 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("증거 자료 목록 조회 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("인증되지 않은 사용자입니다.");
        }
        return Long.parseLong(authentication.getName());
    }
} 
