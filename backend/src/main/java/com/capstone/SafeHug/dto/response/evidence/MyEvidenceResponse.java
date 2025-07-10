package com.capstone.SafeHug.dto.response.evidence;

import com.capstone.SafeHug.dto.common.Summary;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MyEvidenceResponse {
    private Long id;
    private String title;
    private Report report;


    @Getter
    @Setter
    public static class Report {
        private LocalDateTime analyzedAt;  // 분석이 수행된 시간
        private Summary summary;           // 분석 요약 정보
    }
} 