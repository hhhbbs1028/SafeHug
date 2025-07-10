package com.capstone.SafeHug.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evidence_pdf")
@Getter
@Setter
@NoArgsConstructor
public class EvidencePdf {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "evidence_record_id")
    private EvidenceRecord evidenceRecord;

    @Column(name = "pdf_path", length = 255)
    private String pdfPath;

    @Column(name = "signature")
    private Signature signature;

    @Column(name = "pdf_created_at")
    private LocalDateTime pdfCreatedAt;

    @Column(name = "include_messages", nullable = false)
    private boolean includeMessages = true;

    @Column(name = "include_cover", nullable = false)
    private boolean includeCover = false;

    @Column(name = "include_toc", nullable = false)
    private boolean includeToc = false;

    @Column(name = "page_numbering", nullable = false)
    private boolean pageNumbering = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "paper_size", nullable = false)
    private PaperSize paperSize = PaperSize.A4;

    @Enumerated(EnumType.STRING)
    @Column(name = "orientation", nullable = false)
    private Orientation orientation = Orientation.PORTRAIT;

    @Column(name = "masking_option", nullable = false)
    private boolean maskingOption = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Embeddable
    @Getter
    @Setter
    public static class Signature {
        @Column(name = "signed_by", length = 100)
        private String signedBy;

        @Column(name = "signed_at")
        private LocalDateTime signedAt;

        @Column(name = "document_hash", length = 64)
        private String documentHash;

        @Enumerated(EnumType.STRING)
        @Column(name = "hash_algorithm", length = 10)
        private HashAlgorithm hashAlgorithm = HashAlgorithm.SHA256;

        @Enumerated(EnumType.STRING)
        @Column(name = "signature_algorithm", length = 10)
        private SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.SHA256WithRSA;

        @Column(name = "e_signature", columnDefinition = "TEXT")
        private String eSignature;
    }

    public enum PaperSize {
        A4, LETTER, LEGAL
    }

    public enum Orientation {
        PORTRAIT, LANDSCAPE
    }

    public enum HashAlgorithm {
        SHA256("SHA-256");

        private final String displayName;

        HashAlgorithm(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum SignatureAlgorithm {
        SHA256WithRSA("SHA256withRSA"),
        SHA512WithRSA("SHA512withRSA");

        private final String displayName;

        SignatureAlgorithm(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
} 