package com.capstone.SafeHug.common;

public enum RiskLevel {
    HIGH("심각"),
    MEDIUM("경고"),
    LOW("주의"),
    NORMAL("일반");

    private final String displayName;

    RiskLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}