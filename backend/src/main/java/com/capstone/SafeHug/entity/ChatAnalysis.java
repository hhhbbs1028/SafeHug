package com.capstone.SafeHug.entity;

import com.capstone.SafeHug.common.RiskLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_analysis")
@Getter
@Setter
public class ChatAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    private ChatUpload chatUpload;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @OneToOne(mappedBy = "chatAnalysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private EvidenceRecord evidenceRecord;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_risk_level", nullable = false)
    private RiskLevel roomRiskLevel;

    @Column(name = "message_count", nullable = false)
    private int messageCount;

    @Column(name = "duration", nullable = false)
    private int duration;

    @Column(name = "key_phrase_percent", nullable = false)
    private float keyPhrasePercent;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Column(name = "reasons", columnDefinition = "TEXT", nullable = false)
    private String reasons;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "chatAnalysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KeywordAnalysis> keywordAnalyses = new ArrayList<>();

    @PrePersist
    @PreUpdate
    public void checkUser() {
        if (user == null) {
            // user가 null이면 관련된 모든 데이터 삭제
            if (evidenceRecord != null) {
                evidenceRecord.setChatAnalysis(null);
                evidenceRecord = null;
            }
            if (keywordAnalyses != null) {
                keywordAnalyses.clear();
            }
        }
    }

    public void setReasons(List<String> reasonsList) {
        this.reasons = String.join("|", reasonsList);
    }

    public List<String> getReasons() {
        return reasons != null ? Arrays.asList(reasons.split("\\|")) : new ArrayList<>();
    }
} 