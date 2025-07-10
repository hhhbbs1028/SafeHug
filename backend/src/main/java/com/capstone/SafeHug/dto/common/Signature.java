package com.capstone.SafeHug.dto.common;

import com.capstone.SafeHug.entity.EvidencePdf.HashAlgorithm;
import com.capstone.SafeHug.entity.EvidencePdf.SignatureAlgorithm;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 서명 정보를 담는 공통 DTO 클래스
 */
@Getter
@Setter
public class Signature {
    private String signedBy;
    private LocalDateTime signedAt;
    private HashAlgorithm hashAlgorithm = HashAlgorithm.SHA256;
    private SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.SHA256WithRSA;
} 