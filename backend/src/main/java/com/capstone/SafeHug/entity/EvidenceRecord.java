package com.capstone.SafeHug.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "evidence_record")
@Getter
@Setter
@NoArgsConstructor
public class EvidenceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_analysis_id", nullable = false)
    private ChatAnalysis chatAnalysis;

    @OneToOne(mappedBy = "evidenceRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private EvidencePdf evidencePdf;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "category", nullable = false)
    @Enumerated(EnumType.STRING)
    private Category category;

    @Column(name = "tags", length = 1000)
    private String tags; // JSON 형식으로 저장

    @Column(name = "incident_start_date", nullable = false)
    private LocalDateTime incidentStartDate;

    @Column(name = "incident_end_date")
    private LocalDateTime incidentEndDate;

    @Column(name = "incident_time")
    private String incidentTime;

    @Column(name = "location")
    private String location;

    @Column(name = "offender_info")
    private String offenderInfo;

    @Column(name = "witnesses", length = 1000)
    private String witnesses; // JSON 형식으로 저장

    @Column(name = "emotions", length = 1000)
    private String emotions; // JSON 형식으로 저장

    @Column(name = "other_emotion")
    private String otherEmotion;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "analysis_date", nullable = false)
    private LocalDateTime analysisDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Category {
        SEXUAL("성적"),
        STALKING("스토킹"),
        COERCION("강요"),
        THREAT("협박"),
        PERSONAL_INFO("개인정보"),
        DISCRIMINATION("차별"),
        INSULT("모욕"),
        REJECTION("거절"),
        NORMAL("기타");

        private final String displayName;

        Category(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
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
}

