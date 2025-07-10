package com.capstone.SafeHug.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Builder
public class VerifyPdfResponse {
    private String status;
    private String message;
    private Map<String, Object> verificationResults;
}
