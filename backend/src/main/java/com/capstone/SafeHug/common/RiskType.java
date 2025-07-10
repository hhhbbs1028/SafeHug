package com.capstone.SafeHug.common;

public enum RiskType {
    SEXUAL("성적"),
    STALKING("스토킹"),
    COERCION("강요"),
    THREAT("협박"),
    PERSONAL_INFO("개인정보"),
    DISCRIMINATION("차별"),
    INSULT("모욕"),
    REJECTION("거절"),
    NORMAL("일반");

    private final String koreanName;

    RiskType(String koreanName) {
        this.koreanName = koreanName;
    }

    public String getKoreanName() {
        return koreanName;
    }
}