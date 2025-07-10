package com.capstone.SafeHug.dto.request.evidence;

import com.capstone.SafeHug.entity.EvidenceRecord.Category;
import lombok.Getter;
import lombok.Setter;

/**
 * 증거 자료 필터링을 위한 요청 DTO 클래스
 */
@Getter
@Setter
public class EvidenceFilterRequest {
    private Category category;           // 카테고리 필터
    private String title;                // 제목 검색
    private String sortOrder;            // 정렬 순서 (asc: 오래된순, desc: 최신순)
} 