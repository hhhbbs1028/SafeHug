package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MainType {
    private String type;    // 위험 유형 (예: 스토킹, 협박 등)
    private String level;   // 위험도 (심각, 경고, 일반)
    private int count;      // 해당 유형의 발생 횟수
} 