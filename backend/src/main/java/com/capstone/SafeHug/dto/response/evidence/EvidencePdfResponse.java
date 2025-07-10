package com.capstone.SafeHug.dto.response.evidence;

import lombok.Getter;
import lombok.Setter;

/**
 * PDF 문서 정보를 담는 응답 DTO 클래스
 */
@Getter
@Setter
public class EvidencePdfResponse {
    private String status;
    private String pdfUrl;

    public static EvidencePdfResponse success(String pdfPath) {
        EvidencePdfResponse response = new EvidencePdfResponse();
        response.setStatus("success");
        response.setPdfUrl(pdfPath);
        return response;
    }

    public static EvidencePdfResponse error(String message) {
        EvidencePdfResponse response = new EvidencePdfResponse();
        response.setStatus("error");
        response.setPdfUrl(null);
        return response;
    }
} 