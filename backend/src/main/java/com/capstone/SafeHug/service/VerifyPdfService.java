package com.capstone.SafeHug.service;

import com.capstone.SafeHug.dto.response.VerifyPdfResponse;
import com.capstone.SafeHug.entity.EvidencePdf;
import com.capstone.SafeHug.repository.EvidencePdfRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.xmp.XMPMeta;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerifyPdfService {

    private final EvidencePdfRepository evidencePdfRepository;
    private static final String SAFEHUG_NAMESPACE = "http://www.safehug.com/xmp/1.0/";
    private static final String PUBLIC_KEY_PATH = "keys/safehug_public_key.pem";
    
    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        try {
            this.publicKey = loadPublicKey();
            log.info("공개키 로드 완료");
        } catch (Exception e) {
            log.error("공개키 로드 실패", e);
        }
    }

    private PublicKey loadPublicKey() throws Exception {
        // 1. PEM 파일에서 공개키 읽기
        ClassPathResource resource = new ClassPathResource(PUBLIC_KEY_PATH);
        String pemContent = new String(Files.readAllBytes(Paths.get(resource.getURI())));
        
        // 2. PEM 헤더와 푸터 제거
        String publicKeyPEM = pemContent
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replaceAll("\\s", "");
        
        // 3. Base64 디코딩
        byte[] encoded = Base64.getDecoder().decode(publicKeyPEM);
        
        // 4. X509EncodedKeySpec 생성
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(encoded);
        
        // 5. KeyFactory를 사용하여 PublicKey 생성
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(keySpec);
    }

    @Transactional
    public VerifyPdfResponse verifyPdfFile(MultipartFile file) {
        try {
            byte[] pdfContent = file.getBytes();
            Map<String, Object> verificationResults = new HashMap<>();

            // 1. PDF 메타데이터 검증
            Map<String, String> metadata = verifyPdfMetadata(pdfContent);
            verificationResults.put("metadata", metadata);

            // 2. 해시값 검증
            boolean hashValid = verifyPdfHash(pdfContent, metadata.get("HashValue"));
            verificationResults.put("hashValid", hashValid);

            // 3. 전자서명 검증
            boolean signatureValid = verifyPdfSignature(pdfContent, metadata);
            verificationResults.put("signatureValid", signatureValid);

            // 4. 검증 결과 생성
            boolean isValid = hashValid && signatureValid;
            String status = isValid ? "VALID" : "INVALID";
            String message = isValid ? "PDF 파일이 유효합니다." : "PDF 파일이 유효하지 않습니다.";

            return VerifyPdfResponse.builder()
                    .status(status)
                    .message(message)
                    .verificationResults(verificationResults)
                    .build();

        } catch (Exception e) {
            log.error("PDF 검증 중 오류 발생", e);
            return VerifyPdfResponse.builder()
                    .status("ERROR")
                    .message("PDF 검증 중 오류가 발생했습니다: " + e.getMessage())
                    .build();
        }
    }

    private Map<String, String> verifyPdfMetadata(byte[] pdfContent) throws IOException {
        Map<String, String> metadata = new HashMap<>();
        try (PdfReader reader = new PdfReader(new ByteArrayInputStream(pdfContent));
             PdfDocument pdfDoc = new PdfDocument(reader)) {
            
            try {
                // XMP 메타데이터 읽기
                byte[] xmpData = pdfDoc.getXmpMetadata();
                if (xmpData != null) {
                    // XMP 데이터를 문자열로 변환
                    String xmpString = new String(xmpData, "UTF-8");
                    
                    // XMP 문자열에서 필요한 정보 추출
                    extractMetadataFromXmp(xmpString, metadata);
                }
            } catch (Exception e) {
                log.warn("XMP 메타데이터 읽기 실패", e);
            }
        }
        return metadata;
    }

    private void extractMetadataFromXmp(String xmpString, Map<String, String> metadata) {
        try {
            // XMP 문자열에서 필요한 정보 추출
            String namespace = SAFEHUG_NAMESPACE;
            
            // 해시값 추출
            String hashValue = extractXmpProperty(xmpString, namespace, "HashValue");
            if (hashValue != null) metadata.put("HashValue", hashValue);
            
            // 서명값 추출
            String signatureValue = extractXmpProperty(xmpString, namespace, "SignatureValue");
            if (signatureValue != null) metadata.put("SignatureValue", signatureValue);
            
            // 서명자 추출
            String signedBy = extractXmpProperty(xmpString, namespace, "SignedBy");
            if (signedBy != null) metadata.put("SignedBy", signedBy);
            
            // 서명 시간 추출
            String signedAt = extractXmpProperty(xmpString, namespace, "SignedAt");
            if (signedAt != null) metadata.put("SignedAt", signedAt);
            
        } catch (Exception e) {
            log.warn("XMP 메타데이터 파싱 실패", e);
        }
    }

    private String extractXmpProperty(String xmpString, String namespace, String propertyName) {
        try {
            // XMP 문자열에서 특정 속성 추출
            String pattern = namespace + propertyName + "=\"([^\"]*)\"";
            java.util.regex.Pattern r = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = r.matcher(xmpString);
            
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            log.warn("XMP 속성 추출 실패: " + propertyName, e);
        }
        return null;
    }

    private boolean verifyPdfHash(byte[] pdfContent, String storedHash) throws Exception {
        if (storedHash == null) {
            return false;
        }

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(pdfContent);
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        
        return storedHash.equals(hexString.toString());
    }

    private boolean verifyPdfSignature(byte[] pdfContent, Map<String, String> metadata) {
        try {
            // 1. 필수 메타데이터 확인
            if (!metadata.containsKey("SignatureValue") || !metadata.containsKey("SignedBy") ||
                !metadata.containsKey("SignatureAlgorithm")) {
                return false;
            }

            // 2. 서명 알고리즘 확인
            String signatureAlgorithm = metadata.get("SignatureAlgorithm");
            if (!signatureAlgorithm.equals("SHA256withRSA")) {
                log.warn("지원하지 않는 서명 알고리즘: {}", signatureAlgorithm);
                return false;
            }

            // 3. 서명값 디코딩
            byte[] signatureBytes = Base64.getDecoder().decode(metadata.get("SignatureValue"));

            // 4. 공개키 확인
            if (publicKey == null) {
                log.error("공개키가 로드되지 않았습니다.");
                return false;
            }

            // 5. 서명 검증
            Signature signature = Signature.getInstance(signatureAlgorithm);
            signature.initVerify(publicKey);
            signature.update(pdfContent);
            
            return signature.verify(signatureBytes);
        } catch (Exception e) {
            log.error("서명 검증 중 오류 발생", e);
            return false;
        }
    }
}
