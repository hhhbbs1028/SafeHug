package com.capstone.SafeHug.controller;

import com.capstone.SafeHug.dto.response.evidence.MyEvidenceResponse;
import com.capstone.SafeHug.dto.response.chat.ChatAnalysisResponse;
import com.capstone.SafeHug.dto.request.evidence.EvidenceFilterRequest;
import com.capstone.SafeHug.dto.request.PdfCreateRequest;
import com.capstone.SafeHug.dto.request.PdfGenerationRequest;
import com.capstone.SafeHug.dto.response.evidence.EvidencePdfResponse;
import com.capstone.SafeHug.dto.response.ApiResponse;
import com.capstone.SafeHug.entity.EvidenceRecord;
import com.capstone.SafeHug.repository.EvidenceRecordRepository;
import com.capstone.SafeHug.repository.UserRepository;
import com.capstone.SafeHug.service.ChatAnalysisService;
import com.capstone.SafeHug.service.JwtService;
import com.capstone.SafeHug.exception.UserNotFoundException;
import com.capstone.SafeHug.exception.EvidenceNotFoundException;
import com.capstone.SafeHug.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.time.LocalDateTime;
import java.util.logging.Filter;

/**
 * 내 증거함 관리를 위한 컨트롤러
 * 사용자의 모든 증거 자료를 조회하고 PDF로 저장하는 기능을 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/my-evidence")
@RequiredArgsConstructor
public class MyEvidencesController {
    private final ChatAnalysisService chatAnalysisService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final EvidenceRecordRepository evidenceRecordRepository;

    /**
     * 현재 로그인한 사용자의 모든 증거 자료를 조회합니다.
     * 필터링 및 정렬 기능을 제공합니다.
     * @param authorization JWT 토큰 (Bearer 형식)
     * @param filter 필터링 및 정렬 조건
     * @return 사용자의 증거 자료 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MyEvidenceResponse>>> getAllEvidence(
            @RequestHeader("Authorization") String authorization,
            @ModelAttribute EvidenceFilterRequest filter) {
        try {
            log.info("내 증거 자료 목록 조회 시작");
            String token = authorization.replace("Bearer ", "");
            Long userId = jwtService.getUserIdFromToken(token);
            
            List<MyEvidenceResponse> response = chatAnalysisService.getMyEvidence(userId, filter);
            log.info("내 증거 자료 목록 조회 완료 - 개수: {}", response.size());
            
            return ResponseEntity.ok(ApiResponse.success("증거 자료 목록을 조회했습니다.", response));
        } catch (UserNotFoundException e) {
            log.error("내 증거 자료 목록 조회 실패 - 사용자를 찾을 수 없음", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("사용자를 찾을 수 없습니다.", "USER_NOT_FOUND", List.of(e.getMessage())));
        } catch (ValidationException e) {
            log.error("내 증거 자료 목록 조회 실패 - 유효성 검증 오류", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("증거 자료 목록 조회에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("내 증거 자료 목록 조회 중 예상치 못한 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("증거 자료 목록 조회 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    /**
     * 특정 증거 자료의 상세 분석 결과를 조회합니다.
     * @param authorization JWT 토큰 (Bearer 형식)
     * @param evidenceId 조회할 증거 자료의 ID
     * @return 증거 자료의 상세 분석 결과
     */
    @GetMapping("/{evidenceId}")
    public ResponseEntity<ApiResponse<ChatAnalysisResponse>> getEvidenceDetail(
            @RequestHeader("Authorization") String authorization,
            @PathVariable(name = "evidenceId") Long evidenceId) {
        try {
            log.info("증거 자료 상세 조회 시작 - evidenceId: {}", evidenceId);
            String token = authorization.replace("Bearer ", "");
            Long userId = jwtService.getUserIdFromToken(token);

            ChatAnalysisResponse chatAnalysisResponse = chatAnalysisService.getEvidenceDetail(evidenceId);
            log.info("증거 자료 상세 조회 완료 - evidenceId: {}", evidenceId);
            return ResponseEntity.ok(ApiResponse.success("증거 자료 상세 정보를 조회했습니다.", chatAnalysisResponse));
        } catch (UserNotFoundException e) {
            log.error("증거 자료 상세 조회 실패 - 사용자를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (EvidenceNotFoundException e) {
            log.error("증거 자료 상세 조회 실패 - 증거 자료를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (ValidationException e) {
            log.error("증거 자료 상세 조회 실패 - 유효성 검증 오류", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("증거 자료 상세 조회에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("증거 자료 상세 조회 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("증거 자료 상세 조회 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    /**
     * 특정 증거 자료를 PDF로 저장합니다.
     * @param authorization JWT 토큰 (Bearer 형식)
     * @param evidenceId PDF로 저장할 증거 자료의 ID
     * @param request PDF 생성 옵션
     * @return PDF가 생성된 증거 자료 정보
     */
    @PostMapping("/{evidenceId}/pdf")
    public ResponseEntity<ApiResponse<EvidencePdfResponse>> generatePdf(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long evidenceId,
            @RequestBody PdfGenerationRequest request) {
        try {
            log.info("PDF 생성 시작 - evidenceId: {}", evidenceId);
            String token = authorization.replace("Bearer ", "");
            Long userId = jwtService.getUserIdFromToken(token);
            
            EvidencePdfResponse response = chatAnalysisService.generateEvidenceToPdf(userId, evidenceId, request);
            log.info("PDF 생성 완료 - evidenceId: {}", evidenceId);
            return ResponseEntity.ok(ApiResponse.success("PDF가 생성되었습니다.", response));
        } catch (UserNotFoundException e) {
            log.error("PDF 생성 실패 - 사용자를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (EvidenceNotFoundException e) {
            log.error("PDF 생성 실패 - 증거 자료를 찾을 수 없음", e);
            return ResponseEntity.notFound().build();
        } catch (ValidationException e) {
            log.error("PDF 생성 실패 - 유효성 검증 오류", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("PDF 생성에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("PDF 생성 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("PDF 생성 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

    // /**
    //  * 테스트용 증거 자료를 생성합니다.
    //  * @param authorization JWT 토큰 (Bearer 형식)
    //  * @return 생성된 증거 자료 정보
    //  */
    // @PostMapping("/test")
    // public ResponseEntity<ApiResponse<MyEvidenceResponse>> createTestEvidence(
    //         @RequestHeader("Authorization") String authorization) {
    //     try {
    //         log.info("테스트 증거 자료 생성 시작");
    //         String token = authorization.replace("Bearer ", "");
    //         Long userId = jwtService.getUserIdFromToken(token);

    //         // 테스트용 증거 자료 생성
    //         EvidenceRecord testEvidence = new EvidenceRecord();
    //         testEvidence.setUser(userRepository.findById(userId)
    //             .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다: " + userId)));
    //         testEvidence.setTitle("테스트 증거 자료");
    //         testEvidence.setCategory(EvidenceRecord.Category.SEXUAL);
    //         testEvidence.setAnalysisDate(LocalDateTime.now());
    //         testEvidence.setIncidentStartDate(LocalDateTime.now().minusDays(1));
    //         testEvidence.setLocation("테스트 장소");
    //         testEvidence.setOffenderInfo("테스트 가해자");
    //         testEvidence.setDetails("이것은 테스트용 증거 자료입니다.\n" +
    //                 "이 문서는 PDF 생성 테스트를 위해 생성되었습니다.\n" +
    //                 "여러 줄의 텍스트와 다양한 정보를 포함하고 있습니다.");

    //         EvidenceRecord savedEvidence = evidenceRecordRepository.save(testEvidence);
    //         MyEvidenceResponse response = convertToMyEvidenceResponse(savedEvidence);
            
    //         log.info("테스트 증거 자료 생성 완료 - evidenceId: {}", savedEvidence.getId());
    //         return ResponseEntity.ok(ApiResponse.success("테스트 증거 자료가 생성되었습니다.", response));
    //     } catch (UserNotFoundException e) {
    //         log.error("테스트 증거 자료 생성 실패 - 사용자를 찾을 수 없음", e);
    //         return ResponseEntity.notFound().build();
    //     } catch (Exception e) {
    //         log.error("테스트 증거 자료 생성 중 예상치 못한 오류 발생", e);
    //         return ResponseEntity.internalServerError()
    //             .body(ApiResponse.error("테스트 증거 자료 생성 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
    //     }
    // }

    // /**
    //  * 특정 증거 자료를 삭제합니다.
    //  * @param authorization JWT 토큰 (Bearer 형식)
    //  * @param evidenceId 삭제할 증거 자료의 ID
    //  * @return 삭제 결과
    //  */
    // @DeleteMapping("/{evidenceId}")
    // public ResponseEntity<ApiResponse<Void>> deleteEvidence(
    //         @RequestHeader("Authorization") String authorization,
    //         @PathVariable Long evidenceId) {
    //     try {
    //         log.info("증거 자료 삭제 시작 - evidenceId: {}", evidenceId);
    //         String token = authorization.replace("Bearer ", "");
    //         Long userId = jwtService.getUserIdFromToken(token);
            
    //         chatAnalysisService.deleteEvidence(userId, evidenceId);
    //         log.info("증거 자료 삭제 완료 - evidenceId: {}", evidenceId);
    //         return ResponseEntity.ok(ApiResponse.success("증거 자료가 삭제되었습니다.", null));
    //     } catch (UserNotFoundException e) {
    //         log.error("증거 자료 삭제 실패 - 사용자를 찾을 수 없음", e);
    //         return ResponseEntity.notFound().build();
    //     } catch (EvidenceNotFoundException e) {
    //         log.error("증거 자료 삭제 실패 - 증거 자료를 찾을 수 없음", e);
    //         return ResponseEntity.notFound().build();
    //     } catch (ValidationException e) {
    //         log.error("증거 자료 삭제 실패 - 유효성 검증 오류", e);
    //         return ResponseEntity.badRequest()
    //             .body(ApiResponse.error("증거 자료 삭제에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
    //     } catch (Exception e) {
    //         log.error("증거 자료 삭제 중 예상치 못한 오류 발생", e);
    //         return ResponseEntity.internalServerError()
    //             .body(ApiResponse.error("증거 자료 삭제 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
    //     }
    // }

    // /**
    //  * 새로운 증거 자료를 생성합니다.
    //  * @param authorization JWT 토큰 (Bearer 형식)
    //  * @param request 증거 자료 생성 요청
    //  * @return 생성된 증거 자료 정보
    //  */
    // @PostMapping
    // public ResponseEntity<ApiResponse<MyEvidenceResponse>> createEvidence(
    //         @RequestHeader("Authorization") String authorization,
    //         @RequestBody PdfCreateRequest request) {
    //     try {
    //         log.info("증거 자료 생성 시작");
    //         String token = authorization.replace("Bearer ", "");
    //         Long userId = jwtService.getUserIdFromToken(token);
            
    //         MyEvidenceResponse response = chatAnalysisService.createEvidence(userId, request);
    //         log.info("증거 자료 생성 완료 - evidenceId: {}", response.getId());
    //         return ResponseEntity.ok(ApiResponse.success("증거 자료가 생성되었습니다.", response));
    //     } catch (UserNotFoundException e) {
    //         log.error("증거 자료 생성 실패 - 사용자를 찾을 수 없음", e);
    //         return ResponseEntity.notFound().build();
    //     } catch (ValidationException e) {
    //         log.error("증거 자료 생성 실패 - 유효성 검증 오류", e);
    //         return ResponseEntity.badRequest()
    //             .body(ApiResponse.error("증거 자료 생성에 실패했습니다.", "VALIDATION_ERROR", List.of(e.getMessage())));
    //     } catch (Exception e) {
    //         log.error("증거 자료 생성 중 예상치 못한 오류 발생", e);
    //         return ResponseEntity.internalServerError()
    //             .body(ApiResponse.error("증거 자료 생성 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
    //     }
    // }

    // private MyEvidenceResponse convertToMyEvidenceResponse(EvidenceRecord record) {
    //     MyEvidenceResponse response = new MyEvidenceResponse();
    //     response.setId(record.getId());
    //     response.setTitle(record.getTitle());
        
    //     MyEvidenceResponse.Report report = new MyEvidenceResponse.Report();
    //     report.setAnalyzedAt(record.getAnalysisDate());
    //     response.setReport(report);
        
    //     return response;
    // }
}
