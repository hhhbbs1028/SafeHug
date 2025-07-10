package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RiskCalendar {
    private String date;    // 날짜 (YYYY-MM-DD 형식)
    private String level;   // 해당 날짜의 최고 위험도
} 