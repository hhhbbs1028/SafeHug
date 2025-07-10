package com.capstone.SafeHug.dto.request;

import com.capstone.SafeHug.dto.common.OutputOptions;
import com.capstone.SafeHug.dto.common.Signature;
import lombok.Getter;
import lombok.Setter;

/**
 * 내 증거함 -> pdf 저장
 */
@Getter
@Setter
public class PdfGenerationRequest {
    private OutputOptions outputOptions;
    private Signature signature;
} 