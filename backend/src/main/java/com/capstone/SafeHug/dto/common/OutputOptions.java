package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;

/**
 * PDF 출력 옵션을 담는 공통 DTO 클래스
 */
@Getter
@Setter
public class OutputOptions {
    private boolean includeMessages = true;
    private boolean includeCover = false;
    private boolean includeToc = false;
    private boolean pageNumbering = true;
    private Orientation orientation = Orientation.PORTRAIT;
    private boolean maskingOption = true;

    public enum Orientation {
        PORTRAIT("세로"),
        LANDSCAPE("가로");

        private final String description;

        Orientation(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
} 