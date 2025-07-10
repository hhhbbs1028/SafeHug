package com.capstone.SafeHug.controller;

import com.capstone.SafeHug.dto.response.VerifyPdfResponse;
import com.capstone.SafeHug.dto.response.ApiResponse;
import com.capstone.SafeHug.exception.FileUploadException;
import com.capstone.SafeHug.service.FileUploadService;
import com.capstone.SafeHug.service.VerifyPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
public class VerifyPdfCotroller {

    private final FileUploadService fileUploadService;
    private final VerifyPdfService verifyPdfService;

    @PostMapping
    public ResponseEntity<ApiResponse<VerifyPdfResponse>> verifyPdf(@RequestParam("file") MultipartFile file) {
        log.info("파일 검증 시작 - 파일명: {}", file.getOriginalFilename());

        try {
            if (file.isEmpty()) {
                throw new FileUploadException("업로드된 파일이 비어있습니다.");
            }

            // PDF 파일 검증
            VerifyPdfResponse response = verifyPdfService.verifyPdfFile(file);
            log.info("PDF 분석 완료 - 결과: {}", response.getStatus());

            // 파일 업로드
            String uploadedUrl = fileUploadService.uploadChatFile(file);
            log.debug("파일 업로드 완료 - URL: {}", uploadedUrl);

            return ResponseEntity.ok(ApiResponse.success("PDF 파일 검증이 완료되었습니다.", response));
        } catch (FileUploadException e) {
            log.error("파일 업로드 실패 - 파일명: {}", file.getOriginalFilename(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("파일 업로드에 실패했습니다.", "FILE_UPLOAD_FAILED", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("예상치 못한 오류 발생 - 파일명: {}", file.getOriginalFilename(), e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("업로드 처리 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }
}
