package com.capstone.SafeHug.service;

import com.capstone.SafeHug.common.RiskType;
import com.capstone.SafeHug.dto.common.Signature;
import com.capstone.SafeHug.entity.*;
import com.capstone.SafeHug.repository.ChatAnalysisRepository;
import com.capstone.SafeHug.repository.ChatMessageRepository;
import com.capstone.SafeHug.repository.ChatUploadRepository;
import com.capstone.SafeHug.repository.EvidencePdfRepository;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.xmp.XMPException;
import com.itextpdf.kernel.xmp.XMPMeta;
import com.itextpdf.kernel.xmp.impl.XMPMetaImpl;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGeneratorService {
    private final EvidencePdfRepository evidencePdfRepository;
    private final ChatAnalysisRepository chatAnalysisRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatUploadRepository chatUploadRepository;
    private final S3Service s3Service;

    @Value("${cloud.aws.s3.pdf-dir}")
    private String pdfDir;

    private static final String SAFEHUG_NAMESPACE = "http://www.safehug.com/xmp/1.0/";
    private static final String SAFEHUG_NS_PREFIX = "safehug";

    @Transactional
    public String generatePdf(EvidenceRecord evidenceRecord, EvidencePdf evidencePdf) {
        try {
            // 1. PDF 생성
            String pdfPath = createPdfFile(evidenceRecord, evidencePdf);

            // 2. PDF 파일의 해시값 생성 및 저장
            String hash = generatePdfHash(pdfPath, evidencePdf);

            // 3. 서명 정보 설정
            EvidencePdf.Signature signature = new EvidencePdf.Signature();
            signature.setDocumentHash(hash);
            signature.setSignedAt(LocalDateTime.now());
            signature.setSignedBy(evidenceRecord.getUser().getName()); // 서명자 정보 설정
            signature.setHashAlgorithm(EvidencePdf.HashAlgorithm.SHA256);
            signature.setSignatureAlgorithm(EvidencePdf.SignatureAlgorithm.SHA256WithRSA);

            // 4. 전자서명 생성 및 저장
            String eSignature = generateDigitalSignature(pdfPath, evidencePdf);
            signature.setESignature(eSignature);

            evidencePdf.setSignature(signature);

            // 5. 해시값과 서명을 PDF 메타데이터에 저장
            saveMetadataToPdf(pdfPath, hash, signature);

            // 6. S3에 업로드
            String s3Path = s3Service.uploadPdf(pdfPath, pdfDir);

            // 7. PDF 경로 저장
            evidencePdf.setPdfPath(s3Path);
            evidencePdfRepository.save(evidencePdf);

            // 8. 임시 파일 삭제
            new File(pdfPath).delete();

            return s3Path;
        } catch (Exception e) {
            throw new RuntimeException("PDF 생성 중 오류 발생: " + e.getMessage(), e);
        }
    }

    private String generateDigitalSignature(String pdfPath, EvidencePdf evidencePdf) throws Exception {
        // 1. 서명할 데이터 준비
        byte[] pdfContent = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(pdfPath));
        
        // 2. 서명 생성
        java.security.Signature signature = java.security.Signature.getInstance(
            evidencePdf.getSignature().getSignatureAlgorithm().name());
        
        // 3. 개인키 가져오기
        java.security.PrivateKey privateKey = getPrivateKey();
        if (privateKey == null) {
            throw new IllegalStateException("서명에 필요한 개인키를 찾을 수 없습니다.");
        }
        
        signature.initSign(privateKey);
        signature.update(pdfContent);
        byte[] signatureBytes = signature.sign();

        return java.util.Base64.getEncoder().encodeToString(signatureBytes);
    }

    private java.security.PrivateKey getPrivateKey() {
        try {
            // 1. PEM 파일에서 개인키 읽기
            ClassPathResource resource = new ClassPathResource("keys/safehug_private_key.pem");
            String pemContent = new String(Files.readAllBytes(Paths.get(resource.getURI())));
            
            // 2. PEM 헤더와 푸터 제거
            String privateKeyPEM = pemContent
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
            
            // 3. Base64 디코딩
            byte[] encoded = Base64.getDecoder().decode(privateKeyPEM);
            
            // 4. PKCS8EncodedKeySpec 생성
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(encoded);
            
            // 5. KeyFactory를 사용하여 PrivateKey 생성
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return keyFactory.generatePrivate(keySpec);
            
        } catch (Exception e) {
            log.error("개인키 로드 중 오류 발생: {}", e.getMessage());
            return null;
        }
    }

    private void saveMetadataToPdf(String pdfPath, String hashValue, EvidencePdf.Signature signature) throws IOException {
        PdfReader reader = new PdfReader(pdfPath);
        PdfWriter writer = new PdfWriter(new FileOutputStream(pdfPath + ".temp"));
        PdfDocument pdfDoc = new PdfDocument(reader, writer);

        try {
            // XMP 메타데이터 생성
            com.itextpdf.kernel.xmp.XMPMetaFactory.getSchemaRegistry().registerNamespace(SAFEHUG_NAMESPACE, SAFEHUG_NS_PREFIX);
            XMPMeta xmpMeta = new XMPMetaImpl();

            // 해시 정보 저장
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "HashAlgorithm", "SHA-256");
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "HashValue", hashValue);
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "HashTimestamp", LocalDateTime.now().toString());
            
            // 서명 정보 저장
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "SignatureAlgorithm", signature.getSignatureAlgorithm());
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "SignatureValue", signature.getESignature());
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "SignedBy", signature.getSignedBy());
            xmpMeta.setProperty(SAFEHUG_NAMESPACE, "SignedAt", signature.getSignedAt().toString());
            
            // XMP 메타데이터를 PDF에 설정
            pdfDoc.setXmpMetadata(xmpMeta);
            
            // 문서 닫기
            pdfDoc.close();
            
            // 임시 파일을 원본 파일로 이동
            File tempFile = new File(pdfPath + ".temp");
            File originalFile = new File(pdfPath);
            originalFile.delete();
            tempFile.renameTo(originalFile);
            
            log.info("PDF 메타데이터에 해시값과 서명 저장 완료");
        } catch (Exception e) {
            pdfDoc.close();
            new File(pdfPath + ".temp").delete();
            throw new IOException("PDF 메타데이터 저장 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * PDF 파일의 해시값을 생성하고 저장하는 메소드
     * @param pdfPath PDF 파일 경로
     * @param evidencePdf EvidencePdf 엔티티
     * @throws IOException 파일 읽기 오류 발생 시
     * @throws java.security.NoSuchAlgorithmException 해시 알고리즘을 찾을 수 없을 때
     */
    private String generatePdfHash(String pdfPath, EvidencePdf evidencePdf) throws IOException, java.security.NoSuchAlgorithmException {
        byte[] pdfContent = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(pdfPath));

        java.security.MessageDigest digest = java.security.MessageDigest.getInstance(evidencePdf.getSignature().getHashAlgorithm().name());
        byte[] hash = digest.digest(pdfContent);
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private String createPdfFile(EvidenceRecord evidenceRecord, EvidencePdf evidencePdf) throws IOException {
        String tempPath = System.getProperty("java.io.tmpdir") + "/" + UUID.randomUUID().toString() + ".pdf";
        PdfWriter writer = new PdfWriter(new FileOutputStream(tempPath));
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // 1. 표지 페이지
        if (evidencePdf.isIncludeCover()) {
            addCoverPage(document, evidenceRecord);
        }

        // 2. 목차
        if (evidencePdf.isIncludeToc()) {
            addTableOfContents(document, evidenceRecord, evidencePdf);
        }

        // 3. 본문
        addMainContent(document, evidenceRecord, evidencePdf);

        document.close();
        return tempPath;
    }

    private void addCoverPage(Document document, EvidenceRecord evidenceRecord) {
        document.add(new Paragraph("증거 보고서")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(24)
                .setBold());
        document.add(new Paragraph(evidenceRecord.getTitle())
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(18)
                .setMarginTop(20));
        document.add(new Paragraph("작성일: " + evidenceRecord.getAnalysisDate().format(DateTimeFormatter.ISO_DATE))
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(20));
        document.add(new Paragraph("작성자: " + evidenceRecord.getUser().getName())
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private void addTableOfContents(Document document, EvidenceRecord evidenceRecord, EvidencePdf evidencePdf) {
        document.add(new Paragraph("목차")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(18)
                .setBold()
                .setMarginTop(20));

        Table toc = new Table(2);
        toc.setWidth(UnitValue.createPercentValue(100));
        toc.addCell("1. 사건 개요");
        toc.addCell("1");
        toc.addCell("2. 상세 내용");
        toc.addCell("2");
        if (evidencePdf.isIncludeMessages()) {
            toc.addCell("3. 증거 자료");
            toc.addCell("3");
        }
        document.add(toc);
    }

    private void addMainContent(Document document, EvidenceRecord evidenceRecord, EvidencePdf evidencePdf) {
        // 1. 사건 개요
        document.add(new Paragraph("1. 사건 개요")
                .setFontSize(16)
                .setBold()
                .setMarginTop(20));

        Table overview = new Table(2);
        overview.setWidth(UnitValue.createPercentValue(100));
        addTableRow(overview, "사건명", evidenceRecord.getTitle());
        addTableRow(overview, "발생일시", evidenceRecord.getIncidentStartDate() != null ? evidenceRecord.getIncidentStartDate().format(DateTimeFormatter.ISO_DATE_TIME) : "미입력");
        addTableRow(overview, "발생장소", evidenceRecord.getLocation() != null ? evidenceRecord.getLocation() : "발생장소 미입력");
        addTableRow(overview, "관련자", evidenceRecord.getOffenderInfo() != null ? evidenceRecord.getOffenderInfo() : "관련자 미입력");
        document.add(overview);

        // 2. 상세 내용
        document.add(new Paragraph("2. 상세 내용")
                .setFontSize(16)
                .setBold()
                .setMarginTop(20));
        document.add(new Paragraph(evidenceRecord.getDetails()));

        // 3. 증거 자료 (includeMessages가 true일 때만 포함)
        if (evidencePdf.isIncludeMessages()) {
            document.add(new Paragraph("3. 증거 자료")
                    .setFontSize(16)
                    .setBold()
                    .setMarginTop(20));

            // 채팅 메시지 테이블 생성
            Table messagesTable = new Table(3);
            messagesTable.setWidth(UnitValue.createPercentValue(100));

            // 테이블 헤더
            messagesTable.addCell("시간").setBold();
            messagesTable.addCell("발신자").setBold();
            messagesTable.addCell("내용").setBold();

            // 채팅 메시지 추가
            ChatAnalysis chatAnalysis = chatAnalysisRepository.findByEvidenceRecordId(evidenceRecord.getId())
                    .orElseThrow(() -> new RuntimeException("Chat analysis not found"));
            
            List<ChatMessage> chatMessages = chatMessageRepository.findByChatUploadId(chatAnalysis.getChatUpload().getId());

            for (ChatMessage message : chatMessages) {
                if (!message.getRisks().contains(RiskType.NORMAL)) {
                    messagesTable.addCell(message.getSentAt().format(DateTimeFormatter.ISO_DATE_TIME));
                    messagesTable.addCell(message.getSender());
                    messagesTable.addCell(message.getMessage());
                }
            }
            document.add(messagesTable);
        }
    }

    private void addTableRow(Table table, String header, String value) {
        table.addCell(header).setBold();
        table.addCell(value);
    }
}