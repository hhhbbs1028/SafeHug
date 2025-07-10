package com.capstone.SafeHug.dto.common;

import com.capstone.SafeHug.common.RiskLevel;
import com.capstone.SafeHug.entity.ChatMessage;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Keyword {
    private String keyword; // 위험 키워드
    private int count;      // 출현 횟수
    private RiskLevel risk;
} 