package com.capstone.SafeHug.entity;

import com.capstone.SafeHug.common.RiskLevel;
import com.capstone.SafeHug.common.RiskType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_message")
@Getter
@Setter
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    private ChatUpload chatUpload;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "sender", length = 100, nullable = false)
    private String sender;

    @OneToMany(mappedBy = "chatMessage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Risk> risks = new ArrayList<>();

    // 위험 정보 추가를 위한 편의 메서드
    public void addRisk(RiskType riskType, RiskLevel riskLevel, String description) {
        Risk risk = new Risk();
        risk.setRiskType(riskType);
        risk.setRiskLevel(riskLevel);
        risk.setChatMessage(this);
        this.risks.add(risk);
    }

    // 가장 높은 위험도 반환
    public RiskLevel getHighestRiskLevel() {
        return risks.stream()
                .map(Risk::getRiskLevel)
                .max(Enum::compareTo)
                .orElse(RiskLevel.NORMAL);
    }
}