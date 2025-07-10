package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class Summary {
    private int totalMessages;     // 전체 메시지 수
    private int dangerMessages;    // 위험 메시지 수
    private List<MainType> mainTypes;  // 주요 위험 유형 목록
} 