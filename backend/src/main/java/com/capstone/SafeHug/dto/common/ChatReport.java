package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
// extends report 삭제
public class ChatReport{
    private List<RiskCalendar> riskCalendar;  // 날짜별 위험도 정보
    private List<Keyword> keywords;    // 위험 키워드 목록
    private AiRisk aiRisk;            // AI 위험도 평가 결과
    private List<Guide> guides;        // 상황별 가이드라인
    private LocalDateTime analyzedAt;  // 분석이 수행된 시간
    private Summary summary; // 전체 메시지 수, 위험 메시지 수, 주요 위험 유형 목록
} 