package com.capstone.SafeHug.dto.common;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDate;

/**
 * 사건 발생 날짜 정보를 담는 공통 DTO 클래스
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentDate {
    private LocalDate start;
    private LocalDate end;

    public LocalDate getStart() {
        return start != null ? start : LocalDate.now();
    }

    public LocalDate getEnd() {
        return end != null ? end : getStart();
    }
} 