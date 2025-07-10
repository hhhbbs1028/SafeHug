package com.capstone.SafeHug.dto.common;

import com.capstone.SafeHug.common.RiskLevel;
import com.capstone.SafeHug.common.RiskType;
import com.capstone.SafeHug.entity.ChatMessage;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class Guide {
    private RiskType type;    // 가이드 유형 (기본 대응, 스토킹, 협박 등)
    private RiskLevel level;   // 위험도
    private List<String> advice;  // 구체적인 조언 목록
} 