package com.capstone.SafeHug.dto.common;

import lombok.Data;

@Data
public class MessageRisk {
    private String type;
    private String level;  // RiskLevel -> String으로 변경
} 