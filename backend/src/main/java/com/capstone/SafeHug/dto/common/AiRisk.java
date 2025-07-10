package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AiRisk {
    private String level;   // 위험도 (심각, 경고, 일반)
    private RiskDescription description;  // 위험도 상세 설명

    @Getter
    @Setter
    public static class RiskDescription {
        private String summary;     // 위험도 요약 설명
        private List<String> reasons;  // 위험도 판단 이유 목록
    }
} 