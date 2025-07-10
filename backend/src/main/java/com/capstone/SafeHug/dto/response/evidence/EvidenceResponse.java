package com.capstone.SafeHug.dto.response.evidence;

import lombok.Getter;
import lombok.Setter;
import java.util.Map;

/**
 * 증거 자료 응답을 처리하기 위한 DTO 클래스
 */
@Getter
@Setter
public class EvidenceResponse {
    private String status;
    private String evidenceId;
    private String message;
    private Map<String, Object> details;

    public static EvidenceResponse success(Long id) {
        EvidenceResponse response = new EvidenceResponse();
        response.setStatus("success");
        response.setEvidenceId(String.format("evi_%s_%03d", 
            java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")),
            id));
        response.setMessage("증거가 저장되었습니다.");
        return response;
    }

    public static EvidenceResponse error(String message) {
        EvidenceResponse response = new EvidenceResponse();
        response.setStatus("error");
        response.setMessage(message);
        return response;
    }
} 